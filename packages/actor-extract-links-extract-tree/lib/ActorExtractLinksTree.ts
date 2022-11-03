import type {
  IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { MediatorOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import type { IActorTest } from '@comunica/core';
import type { IRelationDescription, IRelation, INode } from '@comunica/types-link-traversal';
import { TreeNodes } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { buildRelations, collectRelation } from './treeMetadataExtraction';

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  private readonly mediatorOptimizeLinkTraversal: MediatorOptimizeLinkTraversal;

  public constructor(args: IActorExtractLinksTree) {
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
      const relationDescriptions: Map<string, IRelationDescription> = new Map();
      const relations: IRelation[] = [];
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
        // Validate if the node forward have the current node as implicit subject
        for (const [ nodeValue, link ] of nodeLinks) {
          if (pageRelationNodes.has(nodeValue)) {
            const relationDescription = relationDescriptions.get(nodeValue);
            if (typeof relationDescription !== 'undefined') {
              relations.push(collectRelation(relationDescription, link));
            } else {
              relations.push(collectRelation({}, link));
            }
          }
        }

        const node: INode = { relation: relations, subject: currentNodeUrl };
        const linkTraversalOptimisation = await this.mediatorOptimizeLinkTraversal.mediate(
          { treeMetadata: node, context: action.context },
        );
        let acceptedRelation = relations;
        if (typeof linkTraversalOptimisation.filters !== 'undefined') {
          acceptedRelation = relations.filter(relation => linkTraversalOptimisation.filters?.get(relation));
        }
        resolve({ links: acceptedRelation.map(el => ({ url: el.node })) });
      });
    });
  }

  /**
   * A helper function to find all the relations of a TREE document and the possible next nodes to visit.
   * The next nodes are not guaranteed to have as subject the URL of the current page,
   * so filtering is necessary afterward.
   * @param quad the current quad.
   * @param url url of the page
   * @param pageRelationNodes the url of the relation node of the page that have as subject the URL of the page
   * @param nodeLinks the url of the next potential page that has to be visited,
   *  regardless if the implicit subject is the node of the page
   */
  private getTreeQuadsRawRelations(
    quad: RDF.Quad,
    url: string,
    pageRelationNodes: Set<string>,
    nodeLinks: [string, string][],
    relationDescriptions: Map<string, IRelationDescription>,
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

export interface IActorExtractLinksTree extends IActorExtractLinksArgs {
  /**
   * The optmize link traversal mediator
   */
  mediatorOptimizeLinkTraversal: MediatorOptimizeLinkTraversal;
}

