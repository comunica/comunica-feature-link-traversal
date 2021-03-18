import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import { ActionContext } from '@comunica/core';
import { LinkQueueLimitDepth } from './LinkQueueLimitDepth';

/**
 * A comunica Wrapper Limit Depth RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth extends ActorRdfResolveHypermediaLinksQueue {
  private readonly limit: number;
  private readonly mediatorRdfResolveHypermediaLinksQueue: Mediator<
  Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
  IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>;

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperLimitDepthArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorTest> {
    if (action.context && action.context.get('actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth')) {
      throw new Error('Unable to wrap link queues multiple times');
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = (action.context || ActionContext({}))
      .set('actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth', true);
    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });
    return { linkQueue: new LinkQueueLimitDepth(linkQueue, this.limit) };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperLimitDepthArgs
  extends IActorArgs<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput> {
  limit: number;
  mediatorRdfResolveHypermediaLinksQueue: Mediator<
  Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
  IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>;
}
