import type {
  IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorTest } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');
  private static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

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
      const nodeLinks: [string, string][] = [];
      const links: ILink[] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) =>
        this.getTreeQuadsRawRelations(quad,
          currentNodeUrl,
          pageRelationNodes,
          nodeLinks));

      // Resolve to discovered links
      metadata.on('end', () => {
        // Validate if the node forward have the current node as implicit subject
        for (const [ nodeValue, link ] of nodeLinks) {
          if (typeof pageRelationNodes.has(nodeValue) !== 'undefined') {
            links.push({ url: link });
          }
        }
        resolve({ links });
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
  ): void {
    // If it's a relation of the current node
    if (quad.subject.value === url && quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      pageRelationNodes.add(quad.object.value);
      // If it's a node forward
    } else if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeLinks.push([ quad.subject.value, quad.object.value ]);
    }
  }
}
