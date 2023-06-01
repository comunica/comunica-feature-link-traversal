import type {
  IActionExtractLinks,
  IActorExtractLinksOutput,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysExtractLinksTree } from '@comunica/context-entries-link-traversal';
import type { IActorTest, IActorArgs } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { termToString } from 'rdf-string';
import { filterNode } from './filterNode';
import { isBooleanExpressionTreeRelationFilterSolvable } from './solver';
import type { ITreeRelationRaw, ITreeRelation, SparqlRelationOperator, ITreeNode } from './TreeMetadata';
import { TreeNodes, RelationOperatorReversed } from './TreeMetadata';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  private readonly filterPruning: boolean = true;
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');
  public static readonly aView = DF.namedNode('https://w3id.org/tree#view');
  public static readonly aSubset = DF.namedNode('http://rdfs.org/ns/void#subset');
  public static readonly isPartOf = DF.namedNode('http://purl.org/dc/terms/isPartOf');

  public constructor(args: IActorExtractLinksTreeArgs) {
    super(args);
    this.filterPruning = args.filterPruning === undefined ?
      true :
      args.filterPruning;
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public isUsingReachabilitySPARQLFilter(): boolean {
    return this.filterPruning;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, reject) => {
      const strictModeFlag: boolean | undefined =
        action.context.get(KeysExtractLinksTree.strictTraversal);
      const strictMode = strictModeFlag === undefined ? true : strictModeFlag;
      const metadata = action.metadata;

      // Maps relationship identifiers to their description.
      // At this point, there's no guarantee yet that these relationships are linked to the current TREE document.
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      const relations: ITreeRelation[] = [];
      const currentNodeUrl = action.url;
      // The relation node value and the subject of the relation are the values of the map
      const relationNodeSubject: Map<string, string> = new Map();
      const nodeLinks: [string, string][] = [];
      const effectiveTreeDocumentSubject: Set<string> = new Set();

      // Forward errors
      metadata.on('error', reject);

      // Collect information about relationships spread over quads, so that we can accumulate them afterwards.
      metadata.on('data', (quad: RDF.Quad) =>
        this.interpretQuad(
          quad,
          currentNodeUrl,
          relationNodeSubject,
          nodeLinks,
          effectiveTreeDocumentSubject,
          relationDescriptions,
          strictMode,
        ));

      // Resolve to discovered links
      metadata.on('end', async() => {
        // If we are not in the loose mode then the subject of the page is the URL
        if (effectiveTreeDocumentSubject.size === 0) {
          effectiveTreeDocumentSubject.add(currentNodeUrl);
        }

        // Validate if the nodes forward have the current node has implicit subject
        for (const [ relationId, link ] of nodeLinks) {
          const subjectOfRelation = relationNodeSubject.get(relationId);
          if (subjectOfRelation && effectiveTreeDocumentSubject.has(subjectOfRelation)
          ) {
            const relationDescription = relationDescriptions.get(relationId);
            // Add the relation to the relation array
            relations.push(
              ActorExtractLinksTree.materializeTreeRelation(relationDescription || {}, link),
            );
          }
        }

        // Create a ITreeNode object
        const node: ITreeNode = { relation: relations, identifier: currentNodeUrl };
        let acceptedRelation = relations;
        if (this.filterPruning) {
          // Filter the relation based on the query
          const filters = await this.applyFilter(node, action.context);
          acceptedRelation = this.handleFilter(filters, acceptedRelation);
        }
        resolve({ links: acceptedRelation.map(el => ({ url: el.node })) });
      });
    });
  }

  /**
   * @param {ITreeNode} node - TREE metadata
   * @param {IActionContext} context - context of the action; containing the query
   * @returns {Promise<Map<string, boolean>>} a map containing the filter
   */
  public async applyFilter(node: ITreeNode, context: IActionContext): Promise<Map<string, boolean>> {
    return await filterNode(node, context, isBooleanExpressionTreeRelationFilterSolvable);
  }

  /**
   * @param { Map<string, boolean>} filters
   * @param {ITreeRelation[]} acceptedRelation - the current accepted relation
   * @returns {ITreeRelation[]} the relation when the nodes has been filtered
   */
  private handleFilter(filters: Map<string, boolean>, acceptedRelation: ITreeRelation[]): ITreeRelation[] {
    return filters.size > 0 ?
      acceptedRelation.filter(relation => filters?.get(relation.node)) :
      acceptedRelation;
  }

  /**
   * A helper function to find all the relations of a TREE document and the possible next nodes to visit.
   * The next nodes are not guaranteed to have as subject the URL of the current page,
   * so filtering is necessary afterward.
   * @param {RDF.Quad} quad - The current quad.
   * @param {string} currentPageUrl - The url of the page.
   * @param {Set<string>} relationIdentifiers - Identifiers of the relationships defined by the TREE document,
   *                                            represented as stringified RDF terms.
   * @param {[string, string][]} nodeLinks - An array of pairs of relationship identifiers and next page link to another
   *                                         TREE document, represented as stringified RDF terms.
   * @param {Map<string, ITreeRelationRaw>} relationDescriptions - Maps relationship identifiers to their description.
   */
  private interpretQuad(
    quad: RDF.Quad,
    url: string,
    relationNodeSubject: Map<string, string>,
    nodeLinks: [string, string][],
    rootNodeEffectiveSubject: Set<string>,
    relationDescriptions: Map<string, ITreeRelationRaw>,
    strictMode: boolean,
  ): void {
    if (quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      relationNodeSubject.set(termToString(quad.object), termToString(quad.subject));
    }

    if (
      (!strictMode || quad.subject.value === url) &&
      (quad.predicate.equals(ActorExtractLinksTree.aView) ||
        quad.predicate.equals(ActorExtractLinksTree.aSubset))) {
      rootNodeEffectiveSubject.add(termToString(quad.object));
    }

    if (
      (!strictMode || quad.object.value === url) &&
      quad.predicate.equals(ActorExtractLinksTree.isPartOf)) {
      rootNodeEffectiveSubject.add(termToString(quad.subject));
    }

    // If it's a node forward
    if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeLinks.push([ termToString(quad.subject), quad.object.value ]);
    }

    const descriptionElement = ActorExtractLinksTree.buildRelationElement(quad);
    if (descriptionElement) {
      const [ value, key ] = descriptionElement;
      ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, value, key);
    }
  }

  /**
 * Materialize a raw tree relation using the captured values.
 * @param relationRaw Raw representation of a tree relation.
 * @param nextLink Link to the next page.
 * @returns ITreeRelation
 */
  public static materializeTreeRelation(
    relationRaw: ITreeRelationRaw,
    nextLink: string,
  ): ITreeRelation {
    const relation: ITreeRelation = { node: nextLink };
    if (relationRaw?.operator) {
      relation.type = relationRaw.operator[0];
    }

    if (relationRaw?.remainingItems) {
      relation.remainingItems = relationRaw.remainingItems[0];
    }

    if (relationRaw?.subject) {
      relation.path = relationRaw.subject[0];
    }

    if (relationRaw?.value) {
      relation.value = {
        value: relationRaw.value[0],
        term: relationRaw.value[1].object,
      };
    }

    return relation;
  }

  /**
   * From a quad stream return a relation element if it exist
   * @param {RDF.Quad} quad - Current quad of the stream.
   * @returns {[SparqlRelationOperator | number | string, keyof ITreeRelationRaw] | undefined} The relation element
   * and the key associated with it.
   */
  public static buildRelationElement(
    quad: RDF.Quad,
  ): [SparqlRelationOperator | number | string, keyof ITreeRelationRaw] | undefined {
    if (quad.predicate.value === TreeNodes.RDFTypeNode) {
      // Set the operator of the relation
      const operator: SparqlRelationOperator | undefined = RelationOperatorReversed.get(quad.object.value);
      if (typeof operator !== 'undefined') {
        return [ operator, 'operator' ];
      }
    } else if (quad.predicate.value === TreeNodes.Path) {
      // Set the subject of the relation condition
      return [ quad.object.value, 'subject' ];
    } else if (quad.predicate.value === TreeNodes.Value) {
      // Set the value of the relation condition
      return [ quad.object.value, 'value' ];
    } else if (quad.predicate.value === TreeNodes.RemainingItems) {
      const remainingItems = Number.parseInt(quad.object.value, 10);
      if (!Number.isNaN(remainingItems)) {
        return [ remainingItems, 'remainingItems' ];
      }
    }
    return undefined;
  }

  /**
   * Update the relationDescriptions with the new quad value
   * @param {Map<string, ITreeRelationRaw>} relationDescriptions - Maps relationship identifiers to their description.
   * @param {RDF.Quad} quad - Current quad of the steam.
   * @param {SparqlRelationOperator | number | string} value - Current description value fetch
   * @param {keyof ITreeRelationRaw} key - Key associated with the value.
   */
  public static addRelationDescription(
    relationDescriptions: Map<string, ITreeRelationRaw>,
    quad: RDF.Quad,
    value: SparqlRelationOperator | number | string,
    key: keyof ITreeRelationRaw,
  ): void {
    const rawRelation: ITreeRelationRaw = relationDescriptions?.get(termToString(quad.subject)) || {};
    rawRelation[key] = [ value, quad ];

    relationDescriptions.set(termToString(quad.subject), rawRelation);
  }
}

export interface IActorExtractLinksTreeArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * If true (default), then we use a reachability criterion that prune links that don't respect the
   * SPARQL filter
   * @default {true}
   */
  filterPruning: boolean;
}
