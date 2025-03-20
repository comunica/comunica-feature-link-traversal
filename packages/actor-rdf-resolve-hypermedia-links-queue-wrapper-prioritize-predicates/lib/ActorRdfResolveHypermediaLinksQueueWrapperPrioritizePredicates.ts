import { LinkQueuePriority } from '@comunica/actor-rdf-resolve-hypermedia-links-queue-priority';
import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
  IActorRdfResolveHypermediaLinksQueueArgs,
  MediatorRdfResolveHypermediaLinksQueue,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { IActorTest, TestResult } from '@comunica/core';
import { ActionContextKey, failTest, passTestVoid } from '@comunica/core';
import { LinkQueuePrioritizePredicates } from './LinkQueuePrioritizePredicates';

export class ActorRdfResolveHypermediaLinksQueueWrapperPrioritizePredicates
  extends ActorRdfResolveHypermediaLinksQueue {
  private readonly mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
  private readonly predicates: Set<string>;

  private static readonly keyWrapped = new ActionContextKey<boolean>(
    '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-prioritize-predicates:wrapped',
  );

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperPrioritizePredicatesArgs) {
    super(args);
    this.mediatorRdfResolveHypermediaLinksQueue = args.mediatorRdfResolveHypermediaLinksQueue;
    this.predicates = new Set(args.predicates);
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<TestResult<IActorTest>> {
    if (action.context.get(ActorRdfResolveHypermediaLinksQueueWrapperPrioritizePredicates.keyWrapped)) {
      return failTest('Unable to wrap link queues multiple times');
    }
    if (this.predicates.size === 0) {
      return failTest('Unable to prioritize links with no predicates specified');
    }
    return passTestVoid();
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = action.context.set(ActorRdfResolveHypermediaLinksQueueWrapperPrioritizePredicates.keyWrapped, true);
    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });

    if (!(linkQueue instanceof LinkQueuePriority)) {
      throw new TypeError('Tried to wrap a non-priority queue with a link prioritisation wrapper.');
    }

    return { linkQueue: new LinkQueuePrioritizePredicates(linkQueue, this.predicates) };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperPrioritizePredicatesArgs
  extends IActorRdfResolveHypermediaLinksQueueArgs {
  mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
  /**
   * The set of predicates that should be prioritized.
   */
  predicates: string[];
}
