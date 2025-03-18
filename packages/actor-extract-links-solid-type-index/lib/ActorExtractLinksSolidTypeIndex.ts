import { QueryEngineBase } from '@comunica/actor-init-query';
import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysInitQuery, KeysQuerySourceIdentify } from '@comunica/context-entries';
import { KeysRdfJoin } from '@comunica/context-entries-link-traversal';
import type { IActorArgs, IActorTest, TestResult } from '@comunica/core';
import { failTest, passTestVoid } from '@comunica/core';
import type { ILink, IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { storeStream } from 'rdf-store-stream';
import { termToString } from 'rdf-string';
import { Util as AlgebraUtil } from 'sparqlalgebrajs';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Solid Type Index Extract Links Actor.
 */
export class ActorExtractLinksSolidTypeIndex extends ActorExtractLinks {
  public static readonly RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

  private readonly typeIndexPredicates: string[];
  private readonly onlyMatchingTypes: boolean;
  private readonly inference: boolean;
  public readonly mediatorDereferenceRdf: MediatorDereferenceRdf;
  public readonly queryEngine: QueryEngineBase;

  public constructor(args: IActorExtractLinksSolidTypeIndexArgs) {
    super(args);
    this.queryEngine = new QueryEngineBase(args.actorInitQuery);
  }

  public async test(action: IActionExtractLinks): Promise<TestResult<IActorTest>> {
    if (!action.context.get(KeysInitQuery.query)) {
      return failTest(`Actor ${this.name} can only work in the context of a query.`);
    }
    return passTestVoid();
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    // Determine links to type indexes
    const typeIndexes = [ ...await this.extractTypeIndexLinks(action.metadata) ];

    // Dereference all type indexes, and collect them in one record
    const typeLinks = (await Promise.all(typeIndexes
      .map(typeIndex => this.dereferenceTypeIndex(typeIndex, action.context))))

      .reduce<Record<string, ILink[]>>((acc, typeLinksInner) => {
        for (const [ type, linksInner ] of Object.entries(typeLinksInner)) {
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(...linksInner);
        }
        return acc;
      }, {});

    // Avoid further processing if no type index entries were discovered
    if (Object.keys(typeLinks).length === 0) {
      return { links: []};
    }

    // Different behaviour depending on whether or not we match type index entries with the current query.
    if (this.onlyMatchingTypes) {
      // Filter out those links that match with the query
      return {
        links: await this.getLinksMatchingQuery(
          typeLinks,
          action.context.get(KeysInitQuery.query)!,
        ),
      };
    }

    // Follow all type links in the other case
    const links: ILink[] = [];
    for (const linksInner of Object.values(typeLinks)) {
      links.push(...linksInner);
    }
    return { links };
  }

  /**
   * Extract links to type index from the metadata stream.
   * @param metadata A metadata quad stream.
   */
  public extractTypeIndexLinks(metadata: RDF.Stream): Promise<Set<string>> {
    return new Promise<Set<string>>((resolve, reject) => {
      const typeIndexesInner: Set<string> = new Set();

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) => {
        if (this.typeIndexPredicates.includes(quad.predicate.value)) {
          typeIndexesInner.add(quad.object.value);
        }
      });

      // Resolve to discovered links
      metadata.on('end', () => {
        resolve(typeIndexesInner);
      });
    });
  }

  /**
   * Determine all entries within the given type index.
   * @param typeIndex The URL of a type index.
   * @param context The context.
   * @return typeLinks A record mapping class URLs to an array of links.
   */
  public async dereferenceTypeIndex(typeIndex: string, context: IActionContext): Promise<Record<string, ILink[]>> {
    // Parse the type index document
    const response = await this.mediatorDereferenceRdf.mediate({ url: typeIndex, context });
    const store = await storeStream(response.data);

    // Query the document to extract all type registrations
    const bindingsArray = await (await this.queryEngine
      .queryBindings(`
        PREFIX solid: <http://www.w3.org/ns/solid/terms#>
        SELECT ?class ?instance WHERE {
          _:registration a solid:TypeRegistration;
            solid:forClass ?class;
            (solid:instance|solid:instanceContainer) ?instance.
        }`, {
        sources: [ store ],
        [KeysQuerySourceIdentify.traverse.name]: false,
        [KeysRdfJoin.skipAdaptiveJoin.name]: true,
        lenient: true,
      })).toArray();

    // Collect links per type
    const typeLinks: Record<string, ILink[]> = {};
    for (const bindings of bindingsArray) {
      const type = bindings.get('class')!.value;
      if (!typeLinks[type]) {
        typeLinks[type] = [];
      }
      typeLinks[type].push({
        url: bindings.get('instance')!.value,
        metadata: {
          producedByActor: { name: this.name, onlyMatchingTypes: this.onlyMatchingTypes, inference: this.inference },
        },
      });
    }
    return typeLinks;
  }

  /**
   * To fetch the domain of the predicate.
   * @param predicateSubjects A dictionary of predicate and its subjects from the query.
   * @param typeSubjects A dictionary of class type and its subjects from the query.
   */
  public async linkPredicateDomains(
    predicateSubjects: Record<string, RDF.Term>,
    typeSubjects: Record<string, RDF.Term[]>,
  ): Promise<void> {
    if (Object.keys(predicateSubjects).length > 0) {
      const predicateDomainsInner = await Promise.all(Object.keys(predicateSubjects)
        .map(async predicate => [ predicate, await this.fetchPredicateDomains(predicate) ]));
      const predicateDomainsRec = Object.fromEntries(predicateDomainsInner);
      for (const [ predicate, subject ] of Object.entries(predicateSubjects)) {
        const typeNames = predicateDomainsRec[predicate];
        if (typeNames) {
          for (const typeName of typeNames) {
            if (!typeSubjects[typeName]) {
              typeSubjects[typeName] = [];
            }
            typeSubjects[typeName].push(subject);
          }
        }
      }
    }
  }

  /**
   * To fetch the rdf type from the vocabulary if the type is not already present.
   * @param predicateValue Predicate value from the query.
   * @return predicateTypeLinks A record mapping predicate URIs to it's domain.
   */
  public async fetchPredicateDomains(predicateValue: string): Promise<string[]> {
    const bindings = await this.queryEngine.queryBindings(`
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT * WHERE {
          <${predicateValue}> rdfs:domain ?domain.
        }`, {
      sources: [ predicateValue ],
      [KeysQuerySourceIdentify.traverse.name]: false,
      [KeysRdfJoin.skipAdaptiveJoin.name]: true,
      lenient: true,
    });

    const bindingsArray = await bindings.toArray();
    const domainsArray: string[] = [];
    // A predicate can have multiple domains
    for (const binding of bindingsArray) {
      domainsArray.push(binding.get('domain')!.value);
    }
    return domainsArray;
  }

  /**
   * Determine all links that match with the current query pattern.
   * @param typeLinks The type index links.
   * @param query The original query that is being executed.
   */
  public async getLinksMatchingQuery(
    typeLinks: Record<string, ILink[]>,
    query: Algebra.Operation,
  ): Promise<ILink[]> {
    // Collect all non-variable subjects, and all subjects in the original query that refer to a specific type.
    const ruleMatchingSubjects: Set<string> = new Set();
    const typeSubjects: Record<string, RDF.Term[]> = {};
    const predicateSubjects: Record<string, RDF.Term> = {};

    // Helper function for walking through query
    function handleQueryTriple(subject: RDF.Term, predicate: RDF.Term, object: RDF.Term): void {
      if ([ 'NamedNode', 'Literal', 'BlankNode' ].includes(subject.termType)) {
        ruleMatchingSubjects.add(termToString(subject));
      }

      if (predicate.value === ActorExtractLinksSolidTypeIndex.RDF_TYPE && object.termType === 'NamedNode') {
        const type = object.value;
        if (!typeSubjects[type]) {
          typeSubjects[type] = [];
        }
        typeSubjects[type].push(subject);
      }

      // Aggregates all the predicates from the query.
      if (predicate.value !== ActorExtractLinksSolidTypeIndex.RDF_TYPE) {
        predicateSubjects[predicate.value] = subject;
      }
    }

    // Visit nodes in query to determine subjects
    AlgebraUtil.recurseOperation(query, {
      pattern(queryPattern) {
        handleQueryTriple(queryPattern.subject, queryPattern.predicate, queryPattern.object);
        return false;
      },
      path(path: Algebra.Path) {
        AlgebraUtil.recurseOperation(path, {
          link(link: Algebra.Link) {
            handleQueryTriple(path.subject, link.iri, path.object);
            return false;
          },
          nps(nps: Algebra.Nps) {
            for (const iri of nps.iris) {
              handleQueryTriple(path.subject, iri, path.object);
            }
            return false;
          },
        });
        return false;
      },
    });

    if (this.inference) {
      await this.linkPredicateDomains(predicateSubjects, typeSubjects);
    }

    // Check if the current pattern has any of the allowed subjects,
    // and consider the type index entry's links in that case.
    const links: ILink[] = [];
    for (const [ type, subjects ] of Object.entries(typeSubjects)) {
      const currentLinks = typeLinks[type];
      if (currentLinks) {
        links.push(...currentLinks);
      }

      // Remove subjects of this type from allSubjects
      for (const subject of subjects) {
        ruleMatchingSubjects.delete(termToString(subject));
      }
    }

    // Abort link pruning if there is at least one subject not matching a type index.
    // Because this means that we have an unknown type, which requires traversal over all entries.
    if (ruleMatchingSubjects.size > 0) {
      return Object.values(typeLinks).flat();
    }

    return links;
  }
}

export interface IActorExtractLinksSolidTypeIndexArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * The type index predicate URLs that will be followed.
   * @default {http://www.w3.org/ns/solid/terms#publicTypeIndex}
   * @default {http://www.w3.org/ns/solid/terms#privateTypeIndex}
   */
  typeIndexPredicates: string[];
  /**
   * If only those type index entries matching with the current query should be considered.
   * If false, all links within the type index entries will be followed.
   * @default {true}
   */
  onlyMatchingTypes: boolean;
  /**
   * If the domains of query predicates will be considered when checking the type index.
   * If false, no predicates will be considered.
   * @default {true}
   */
  inference: boolean;
  /**
   * An init query actor that is used to query shapes.
   * @default {<urn:comunica:default:init/actors#query>}
   */
  actorInitQuery: ActorInitQueryBase;
  /**
   * The Dereference RDF mediator
   */
  mediatorDereferenceRdf: MediatorDereferenceRdf;
}
