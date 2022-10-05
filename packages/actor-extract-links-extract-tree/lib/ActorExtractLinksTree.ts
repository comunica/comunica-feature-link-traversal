import type {
  IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IActorTest } from '@comunica/core';
import type { IDataSource } from '@comunica/types';
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
    let rootUrl = '';
    const source: IDataSource = action.context.get(KeysRdfResolveQuadPattern.source)!;
    if (typeof source !== 'undefined') {
      if (typeof source === 'string') {
        rootUrl = source;
      } else if ('value' in source) {
        rootUrl = typeof source.value === 'string' ? source.value : '';
      }
    }
    return new Promise((resolve, reject) => {
      const relationObject: Map<string, boolean> = new Map();
      const nodeUrl: [string, string][] = [];
      const links: ILink[] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) =>
        this.getTheRelationshipOfTheCurrentNodeAndUrlOfTheNextNode(quad, rootUrl, relationObject, nodeUrl));

      // Resolve to discovered links
      metadata.on('end', () => {
        // Validate if the node forward have the current node as implicit subject
        for (const [ nodeValue, link ] of nodeUrl) {
          if (typeof relationObject.get(nodeValue) !== 'undefined') {
            links.push({ url: link });
          }
        }
        resolve({ links });
      });
    });
  }

  private getTheRelationshipOfTheCurrentNodeAndUrlOfTheNextNode(
    quad: RDF.Quad,
    rootUrl: string,
    relationObject: Map<string, boolean>,
    nodeUrl: [string, string][],
  ): void {
    // If it's a relation of the current node
    if (quad.subject.value === rootUrl && quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      relationObject.set(quad.object.value, true);
      // If it's a node forward
    } else if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeUrl.push([ quad.subject.value, quad.object.value ]);
    }
  }
}
