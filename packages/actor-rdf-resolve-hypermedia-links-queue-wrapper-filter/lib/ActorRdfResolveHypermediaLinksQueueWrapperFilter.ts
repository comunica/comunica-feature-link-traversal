import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
  IActorRdfResolveHypermediaLinksQueueArgs,
  MediatorRdfResolveHypermediaLinksQueue,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import type { IActorTest, TestResult } from '@comunica/core';
import { ActionContextKey, failTest, passTestVoid } from '@comunica/core';
import { LinkQueueWrapperFilter } from './LinkQueueWrapperFilter';

/**
 * A comunica Wrapper Limit Count RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperFilter extends ActorRdfResolveHypermediaLinksQueue {
  private readonly mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;

  private static readonly keyWrapped = new ActionContextKey<boolean>(
    '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-filter:wrapped',
  );

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperFilterArgs) {
    super(args);
    this.mediatorRdfResolveHypermediaLinksQueue = args.mediatorRdfResolveHypermediaLinksQueue;
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<TestResult<IActorTest>> {
    if (action.context.get(ActorRdfResolveHypermediaLinksQueueWrapperFilter.keyWrapped)) {
      return failTest('Unable to wrap link queues multiple times');
    }
    if (!action.context.has(KeysRdfResolveHypermediaLinks.linkFilters)) {
      return failTest('Unable to wrap link queue with missing filter list');
    }
    return passTestVoid();
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = action.context.set(ActorRdfResolveHypermediaLinksQueueWrapperFilter.keyWrapped, true);
    const linkFilters = action.context.getSafe(KeysRdfResolveHypermediaLinks.linkFilters);
    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });
    return {
      linkQueue: new LinkQueueWrapperFilter(
        linkQueue,
        linkFilters,
        (message: string): void => {
          this.logWarn(action.context, message);
        },
      ),
    };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperFilterArgs extends
  IActorRdfResolveHypermediaLinksQueueArgs {
  mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
}
