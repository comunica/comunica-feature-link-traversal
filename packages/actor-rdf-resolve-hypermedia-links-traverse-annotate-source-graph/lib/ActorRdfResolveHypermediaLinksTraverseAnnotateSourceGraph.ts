import type { Readable, TransformCallback } from 'stream';
import {
  ActorRdfResolveHypermediaLinks,
} from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActionRdfResolveHypermediaLinks,
  IActorRdfResolveHypermediaLinksOutput,
  ILink,
  MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { Transform } from 'readable-stream';

const DF = new DataFactory();

/**
 * A comunica Traverse Annotate Source Graph RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph extends ActorRdfResolveHypermediaLinks {
  private readonly mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;

  public constructor(args: IActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraphArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinks): Promise<IActorTest> {
    if (action.context.getSafe(KeysRdfResolveHypermediaLinks.annotateSources) !== 'graph') {
      throw new Error(`Actor ${this.name} can only work when graph annotation is enabled.`);
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinks): Promise<IActorRdfResolveHypermediaLinksOutput> {
    const result = await this.mediatorRdfResolveHypermediaLinks
      .mediate({ ...action, context: action.context.delete(KeysRdfResolveHypermediaLinks.annotateSources) });
    return {
      ...result,
      links: result.links.map(link => this.mapLink(link)),
    };
  }

  /**
   * Adds a transformer to the given link that transforms all quads that are returned from the link's document
   * into quads that have the link's url as graph.
   * @param link The link to transform.
   */
  public mapLink(link: ILink): ILink {
    return {
      ...link,
      async transform(input: RDF.Stream): Promise<RDF.Stream> {
        // First apply the existing transformer if it exists
        if (link.transform) {
          input = await link.transform(input);
        }

        // Then apply our new transformation
        return (<Readable> input).pipe(new Transform({
          objectMode: true,
          transform(quad: RDF.Quad, encoding: string, callback: TransformCallback) {
            if (quad.graph.termType === 'DefaultGraph') {
              return callback(undefined, DF.quad(
                quad.subject,
                quad.predicate,
                quad.object,
                DF.namedNode(link.url),
              ));
            }
            return callback(undefined, quad);
          },
        }));
      },
    };
  }
}

export interface IActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraphArgs
  extends IActorArgs<IActionRdfResolveHypermediaLinks, IActorTest, IActorRdfResolveHypermediaLinksOutput> {
  mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
}
