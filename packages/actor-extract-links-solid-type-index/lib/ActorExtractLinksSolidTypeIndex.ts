import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import { QueryEngineBase } from '@comunica/actor-init-query';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysInitQuery, KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { storeStream } from 'rdf-store-stream';
import { Algebra, Util as AlgebraUtil } from 'sparqlalgebrajs';

/**
 * A comunica Solid Type Index Extract Links Actor.
 */
export class ActorExtractLinksSolidTypeIndex extends ActorExtractLinks {
  public static readonly RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

  private readonly typeIndexPredicates: string[];
  private readonly onlyMatchingTypes: boolean;
  public readonly mediatorDereferenceRdf: MediatorDereferenceRdf;
  public readonly queryEngine: QueryEngineBase;

  public constructor(args: IActorExtractLinksSolidTypeIndexArgs) {
    super(args);
    this.queryEngine = new QueryEngineBase(args.actorInitQuery);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    if (!action.context.get(KeysInitQuery.query)) {
      throw new Error(`Actor ${this.name} can only work in the context of a query.`);
    }
    if (!action.context.get(KeysQueryOperation.operation)) {
      throw new Error(`Actor ${this.name} can only work in the context of a query operation.`);
    }
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    // Determine links to type indexes
    const typeIndexes = await this.extractTypeIndexLinks(action.metadata);

    // Dereference all type indexes, and collect them in one record
    const typeLinks = (await Promise.all(typeIndexes
      .map(typeIndex => this.dereferenceTypeIndex(typeIndex, action.context))))
      // eslint-disable-next-line unicorn/prefer-object-from-entries
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
          action.context.get(KeysQueryOperation.operation)!,
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
  public extractTypeIndexLinks(metadata: RDF.Stream): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const typeIndexesInner: string[] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) => {
        if (this.typeIndexPredicates.includes(quad.predicate.value)) {
          typeIndexesInner.push(quad.object.value);
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
            solid:instance ?instance.
        }`, { sources: [ store ]})).toArray();

    // Collect links per type
    const typeLinks: Record<string, ILink[]> = {};
    for (const bindings of bindingsArray) {
      const type = bindings.get('class')!.value;
      if (!typeLinks[type]) {
        typeLinks[type] = [];
      }
      typeLinks[type].push({ url: bindings.get('instance')!.value });
    }
    return typeLinks;
  }

  /**
   * Determine all links that match with the current query pattern.
   * @param typeLinks The type index links.
   * @param query The original query that is being executed.
   * @param pattern The current pattern that is being evaluated and traversed in.
   */
  public async getLinksMatchingQuery(
    typeLinks: Record<string, ILink[]>,
    query: Algebra.Operation,
    pattern: Algebra.Operation,
  ): Promise<ILink[]> {
    // Collect all subjects in the original query that refer to a specific type
    const typeSubjects: Record<string, RDF.Term[]> = {};
    AlgebraUtil.recurseOperation(query, {
      [Algebra.types.PATTERN](queryPattern) {
        if (queryPattern.predicate.value === ActorExtractLinksSolidTypeIndex.RDF_TYPE &&
          queryPattern.object.termType === 'NamedNode') {
          const type = queryPattern.object.value;
          if (!typeSubjects[type]) {
            typeSubjects[type] = [];
          }
          typeSubjects[type].push(queryPattern.subject);
        }
        return false;
      },
    });

    // Check if the current pattern has any of the allowed subjects,
    // and consider the type index entry's links in that case.
    const links: ILink[] = [];
    for (const [ type, subjects ] of Object.entries(typeSubjects)) {
      const currentLinks = typeLinks[type];
      if (currentLinks && subjects.some(subject => subject.equals(pattern.subject))) {
        links.push(...currentLinks);
      }
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
   * An init query actor that is used to query shapes.
   * @default {<urn:comunica:default:init/actors#query>}
   */
  actorInitQuery: ActorInitQueryBase;
  /**
   * The Dereference RDF mediator
   */
  mediatorDereferenceRdf: MediatorDereferenceRdf;
}
