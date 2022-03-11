import type { IActionRdfResolveHypermediaLinks,
  IActorRdfResolveHypermediaLinksOutput, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { ActionContextKey } from '@comunica/core';

/**
 * A comunica Traverse RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTraverse extends ActorRdfResolveHypermediaLinks {
  public static readonly CONTEXT_KEY_TRAVERSE =
    new ActionContextKey<boolean>('@comunica/actor-rdf-resolve-hypermedia-links-traverse:traverse');

  public constructor(
    args: IActorArgs<IActionRdfResolveHypermediaLinks, IActorTest, IActorRdfResolveHypermediaLinksOutput>,
  ) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinks): Promise<IActorTest> {
    if (!action.metadata.traverse) {
      throw new Error(`Actor ${this.name} requires a 'traverse' metadata entry.`);
    }
    if (action.context.has(ActorRdfResolveHypermediaLinksTraverse.CONTEXT_KEY_TRAVERSE) &&
      !action.context.get(ActorRdfResolveHypermediaLinksTraverse.CONTEXT_KEY_TRAVERSE)) {
      throw new Error(`Link traversal has been disabled via the context.`);
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinks): Promise<IActorRdfResolveHypermediaLinksOutput> {
    return {
      links: action.metadata.traverse.map((fileLink: ILink) => {
        const hashPosition = fileLink.url.indexOf('#');
        if (hashPosition >= 0) {
          fileLink.url = fileLink.url.slice(0, hashPosition);
        }
        return fileLink;
      }),
    };
  }
}
