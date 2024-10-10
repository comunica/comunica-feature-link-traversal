import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
  MediatorRdfResolveHypermediaLinksQueue,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { IActorArgs, IActorTest, TestResult } from '@comunica/core';
import { ActionContextKey, failTest, passTestVoid } from '@comunica/core';
import { LinkQueueLimitCount } from './LinkQueueLimitCount';

/**
 * A comunica Wrapper Limit Count RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperLimitCount extends ActorRdfResolveHypermediaLinksQueue {
  private readonly limit: number;
  private readonly mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperLimitCountArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<TestResult<IActorTest>> {
    if (action.context.get(KEY_CONTEXT_WRAPPED)) {
      return failTest('Unable to wrap link queues multiple times');
    }
    return passTestVoid();
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = action.context.set(KEY_CONTEXT_WRAPPED, true);
    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });
    return { linkQueue: new LinkQueueLimitCount(linkQueue, this.limit) };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperLimitCountArgs
  extends IActorArgs<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput> {
  limit: number;
  mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
}

export const KEY_CONTEXT_WRAPPED = new ActionContextKey<boolean>(
  '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count:wrapped',
);
