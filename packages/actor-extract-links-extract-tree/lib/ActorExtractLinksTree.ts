import type {
  IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';

import type { IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type { ITreeRelationDescription, ITreeRelation, ITreeNode } from '@comunica/types-link-traversal';
import { TreeNodes } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { FilterNode } from './FilterNode';
import { buildRelations, collectRelation } from './treeMetadataExtraction';

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
      const currentNodeUrl = action.url;
      const pageRelationNodes: Set<string> = new Set();
      const relationDescriptions: Map<string, ITreeRelationDescription> = new Map();
      const relations: ITreeRelation[] = [];
      const nodeLinks: [string, string][] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) =>
        this.getTreeQuadsRawRelations(quad,
          currentNodeUrl,
          pageRelationNodes,
          nodeLinks,
          relationDescriptions));

      // Resolve to discovered links
      metadata.on('end', async() => {
        // Validate if the potential relation node are linked with the current page
        // and add the relation description if it is connected
        for (const [ blankNodeId, link ] of nodeLinks) {
          // Check if the blank node id is the object of a relation of the current page
          if (pageRelationNodes.has(blankNodeId)) {
            const relationDescription = relationDescriptions.get(blankNodeId);
            // Add the relation to the relation array
            relations.push(collectRelation(relationDescription || {}, link));
          }
        }

        // Create a ITreeNode object
        const node: ITreeNode = { relation: relations, subject: currentNodeUrl };
        let acceptedRelation = relations;

        // Filter the relation based on the query
        const filters = await this.applyFilter(node, action.context);
        acceptedRelation = this.handleFilter(filters, acceptedRelation);
        resolve({ links: acceptedRelation.map(el => ({ url: el.node })) });
      });
    });
  }

  /* istanbul ignore next */
  public async applyFilter(node: ITreeNode, context: IActionContext): Promise<Map<string, boolean>> {
    return await new FilterNode().run(node, context);
  }
  /* istanbul ignore next */

  private handleFilter(filters: Map<string, boolean>, acceptedRelation: ITreeRelation[]): ITreeRelation[] {
    return filters.size > 0 ?
      acceptedRelation.filter(relation => filters?.get(relation.node)) :
      acceptedRelation;
  }

  /**
   * A helper function to find all the relations of a TREE document and the possible next nodes to visit.
   * The next nodes are not guaranteed to have as subject the URL of the current page,
   * so filtering is necessary afterward.
   * @param {RDF.Quad} quad - the current quad.
   * @param {string} url - url of the page
   * @param {Set<string>} pageRelationNodes - the url of the relation node of the page
   * that have as subject the URL of the page
   * @param {[string, string][]} - nodeLinks the url of the next potential page that has to be visited,
   *  regardless if the implicit subject is the node of the page
   * @param {Map<string, ITreeRelationDescription>} relationDescriptions - a map where the key is the
   * id of the blank node associated with the description of a relation
   */
  private getTreeQuadsRawRelations(
    quad: RDF.Quad,
    url: string,
    pageRelationNodes: Set<string>,
    nodeLinks: [string, string][],
    relationDescriptions: Map<string, ITreeRelationDescription>,
  ): void {
    // If it's a relation of the current node
    if (quad.subject.value === url && quad.predicate.value === TreeNodes.Relation) {
      pageRelationNodes.add(quad.object.value);
      // If it's a node forward
    } else if (quad.predicate.value === TreeNodes.Node) {
      nodeLinks.push([ quad.subject.value, quad.object.value ]);
    }
    buildRelations(relationDescriptions, quad);
  }
}
