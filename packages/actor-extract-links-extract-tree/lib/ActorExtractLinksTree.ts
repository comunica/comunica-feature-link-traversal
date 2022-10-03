import type { IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorTest } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { storeStream } from 'rdf-store-stream';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  public static aNodeType = DF.namedNode('tree:node');
  private static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    const quadsStream = action.metadata;
    const store = await storeStream(quadsStream);
    const result = store.match(undefined,
      ActorExtractLinksTree.rdfTypeNode,
      ActorExtractLinksTree.aNodeType);
    return result.read() !== null;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        // If it's a blank node that contain a tree:node meaning that it stand from a relation
        if (quad.subject.termType === 'BlankNode' &&
        quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
          links.push(<ILink>{ url: quad.object.value });
        }
      }),
    };
  }
}
