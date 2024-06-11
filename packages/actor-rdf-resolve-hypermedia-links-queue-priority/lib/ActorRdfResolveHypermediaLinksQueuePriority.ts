import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueArgs,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { IActorTest } from '@comunica/core';
import { LinkQueuePriority } from './LinkQueuePriority';

/**
 * A comunica Priority RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueuePriority extends ActorRdfResolveHypermediaLinksQueue {
  public constructor(args: IActorRdfResolveHypermediaLinksQueueArgs) {
    super(args);
  }

  // eslint-disable-next-line  unused-imports/no-unused-vars
  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorTest> {
    return true;
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    return { linkQueue: new LinkQueuePriority() };
  }
}
