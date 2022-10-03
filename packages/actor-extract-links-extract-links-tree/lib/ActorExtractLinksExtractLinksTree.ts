import { ActorExtractLinks, IActionExtractLinks, IActorExtractLinksOutput, IActorExtractLinksArgs } from '@comunica/bus-extract-links';
import { IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { DataFactory } from 'rdf-data-factory';
import { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { storeStream } from 'rdf-store-stream';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksExtractLinksTree extends ActorExtractLinks {
  static aNodeType = DF.namedNode('tree:node');

  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    const quadsStream = action.metadata;
    const typeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    const store =  await storeStream(quadsStream);
    const result = store.match(undefined, typeNode, ActorExtractLinksExtractLinksTree.aNodeType, undefined );
    return result.read() !== null;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        // if it's a blank node that contain a tree:node meaning that it stand from a relation
        if (quad.subject.termType === 'BlankNode' && quad.predicate.equals(ActorExtractLinksExtractLinksTree.aNodeType)) {
          links.push(<ILink>{ url: quad.object.value });
        }
      })
    }
  }
}
