import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Actor, IActorArgs, IActorTest, Mediator, TestResult } from '@comunica/core';
import { ActionContextKey, failTest, passTestVoid } from '@comunica/core';
import { LinkQueueLimitDepth } from './LinkQueueLimitDepth';

/**
 * A comunica Wrapper Limit Depth RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth extends ActorRdfResolveHypermediaLinksQueue {
  private readonly limit: number;
  private readonly mediatorRdfResolveHypermediaLinksQueue: Mediator<
  Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
  IActionRdfResolveHypermediaLinksQueue,
IActorTest,
IActorRdfResolveHypermediaLinksQueueOutput
>;

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperLimitDepthArgs) {
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
    return { linkQueue: new LinkQueueLimitDepth(linkQueue, this.limit) };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperLimitDepthArgs
  extends IActorArgs<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput> {
  limit: number;
  mediatorRdfResolveHypermediaLinksQueue: Mediator<
  Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
  IActionRdfResolveHypermediaLinksQueue,
IActorTest,
IActorRdfResolveHypermediaLinksQueueOutput
>;
}

export const KEY_CONTEXT_WRAPPED = new ActionContextKey<boolean>(
  '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:wrapped',
);
