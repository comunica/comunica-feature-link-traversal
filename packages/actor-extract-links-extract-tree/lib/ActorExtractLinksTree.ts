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
  public static aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static aRelation = DF.namedNode('https://w3id.org/tree#relation');
  private static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    const metadata = action.metadata;
    const rootUrl = action.url;
    return new Promise((resolve, reject) => {
      const relationObject: Map<string, boolean> = new Map();
      const nodeUrl: (ILink | string)[][] = [];
      const links: ILink[] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) => this.getTheRelationshipOfTheCurrentNodeAndUrlOfTheNextNode(quad, rootUrl, relationObject, nodeUrl));

      // Resolve to discovered links
      metadata.on('end', () => {
        // Validate if the node forward have the current node as implicit subject
        for (const [ node, link ] of nodeUrl) {
          if (typeof relationObject.get(<string>node) !== 'undefined') {
            links.push({ url: <string>link });
          }
        }
        resolve({ links });
      });
    });
  }

  private getTheRelationshipOfTheCurrentNodeAndUrlOfTheNextNode(quad: RDF.Quad,
    rootUrl: string,
    relationObject: Map<string, boolean>,
    nodeUrl: any[2][]): void {
    // If it's a relation of the current node
    if (quad.subject.value === rootUrl && quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      relationObject.set(quad.object.value, true);
      // If it's a node forward
    } else if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeUrl.push([ quad.subject.value, quad.object.value ]);
    }
  }
}
