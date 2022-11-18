import type {
  IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';

import type { IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type { ITreeRelationRaw, ITreeRelation, ITreeNode } from '@comunica/types-link-traversal';
import { TreeNodes } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { termToString } from 'rdf-string';
import { FilterNode } from './FilterNode';
import { buildRelations, materializeTreeRelation } from './treeMetadataExtraction';

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, reject) => {
      const metadata = action.metadata;
      const currentPageUrl = action.url;
      // Identifiers of the relationships defined by the TREE document, represented as stringified RDF terms.
      const relationIdentifiers: Set<string> = new Set();
      // Maps relationship identifiers to their description.
      // At this point, there's no guarantee yet that these relationships are linked to the current TREE document.
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      const relations: ITreeRelation[] = [];
      // An array of pairs of relationship identifiers and next page link to another TREE document,
      // represented as stringified RDF terms.
      const nodeLinks: [string, string][] = [];

      // Forward errors
      metadata.on('error', reject);

      // Collect information about relationships spread over quads, so that we can accumulate them afterwards.
      metadata.on('data', (quad: RDF.Quad) =>
        this.interpretQuad(quad,
          currentPageUrl,
          relationIdentifiers,
          nodeLinks,
          relationDescriptions));

      // Accumulate collected relationship information.
      metadata.on('end', async() => {
        // Validate if the potential relation node are linked with the current page
        // and add the relation description if it is connected.
        for (const [ identifier, link ] of nodeLinks) {
          // Check if the identifier is the object of a relation of the current page
          if (relationIdentifiers.has(identifier)) {
            const relationDescription = relationDescriptions.get(identifier);
            // Add the relation to the relation array
            relations.push(materializeTreeRelation(relationDescription || {}, link));
          }
        }

        // Create a ITreeNode object
        const node: ITreeNode = { relation: relations, identifier: currentPageUrl };
        let acceptedRelation = relations;

        // Filter the relation based on the query
        const filters = await this.applyFilter(node, action.context);
        acceptedRelation = this.handleFilter(filters, acceptedRelation);
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
    return await new FilterNode().run(node, context);
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
    currentPageUrl: string,
    relationIdentifiers: Set<string>,
    nodeLinks: [string, string][],
    relationDescriptions: Map<string, ITreeRelationRaw>,
  ): void {
    // If it's a relation of the current node
    if (quad.subject.value === currentPageUrl && quad.predicate.value === TreeNodes.Relation) {
      relationIdentifiers.add(termToString(quad.object));
      // If it's a node forward
    } else if (quad.predicate.value === TreeNodes.Node) {
      nodeLinks.push([ termToString(quad.subject), termToString(quad.object) ]);
    }
    buildRelations(relationDescriptions, quad);
  }
}
