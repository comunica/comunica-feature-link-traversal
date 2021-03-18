import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import { ActionContext } from '@comunica/core';
import { LinkQueueLimitCount } from './LinkQueueLimitCount';

/**
 * A comunica Wrapper Limit Count RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperLimitCount extends ActorRdfResolveHypermediaLinksQueue {
  private readonly limit: number;
  private readonly mediatorRdfResolveHypermediaLinksQueue: Mediator<
  Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
  IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>;

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperLimitCountArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorTest> {
    if (action.context && action.context.get('actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count')) {
      throw new Error('Unable to wrap link queues multiple times');
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = (action.context || ActionContext({}))
      .set('actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count', true);
    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });
    return { linkQueue: new LinkQueueLimitCount(linkQueue, this.limit) };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperLimitCountArgs
  extends IActorArgs<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput> {
  limit: number;
  mediatorRdfResolveHypermediaLinksQueue: Mediator<
  Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
  IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>;
}
