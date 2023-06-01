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
import type { ITreeRelationRaw, ITreeRelation, ITreeNode } from './TreeMetadata';
import { buildRelationElement, materializeTreeRelation, addRelationDescription } from './treeMetadataExtraction';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  private readonly reachabilityCriterionUseSPARQLFilter: boolean = true;
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');
  private static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly aView = DF.namedNode('https://w3id.org/tree#view');
  public static readonly aSubset = DF.namedNode('http://rdfs.org/ns/void#subset');
  public static readonly isPartOf = DF.namedNode('http://purl.org/dc/terms/isPartOf');

  public constructor(args: IActorExtractLinksTreeArgs) {
    super(args);
    this.reachabilityCriterionUseSPARQLFilter = args.reachabilityCriterionUseSPARQLFilter === undefined ?
      true :
      args.reachabilityCriterionUseSPARQLFilter;
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public isUsingReachabilitySPARQLFilter(): boolean {
    return this.reachabilityCriterionUseSPARQLFilter;
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
            relations.push(materializeTreeRelation(relationDescription || {}, link));
          }
        }

        // Create a ITreeNode object
        const node: ITreeNode = { relation: relations, identifier: currentNodeUrl };
        let acceptedRelation = relations;
        if (this.reachabilityCriterionUseSPARQLFilter) {
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

    const descriptionElement = buildRelationElement(quad);
    if (descriptionElement) {
      const [ value, key ] = descriptionElement;
      addRelationDescription(relationDescriptions, quad, value, key);
    }
  }
}

export interface IActorExtractLinksTreeArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * If true (default), then we use a reachability criterion that prune links that don't respect the
   * SPARQL filter
   * @default {true}
   */
  reachabilityCriterionUseSPARQLFilter: boolean;
}
