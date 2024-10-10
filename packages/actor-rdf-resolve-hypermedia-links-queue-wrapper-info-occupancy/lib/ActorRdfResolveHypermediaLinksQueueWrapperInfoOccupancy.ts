import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { KeysInitQuery, KeysCore } from '@comunica/context-entries';
import type { Actor, IActorArgs, IActorTest, Mediator, TestResult } from '@comunica/core';
import { ActionContextKey, failTest, passTestVoid } from '@comunica/core';
import type { Logger } from '@comunica/types';
import { type Algebra, toSparql } from 'sparqlalgebrajs';
import { LinkQueueLogger } from './LinkQueueLogger';

/**
 * A comunica Wrapper Info Occupancy RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy
  extends ActorRdfResolveHypermediaLinksQueue {
  private readonly mediatorRdfResolveHypermediaLinksQueue: Mediator<
    Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
    IActionRdfResolveHypermediaLinksQueue,
    IActorTest,
    IActorRdfResolveHypermediaLinksQueueOutput
  >;

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancyArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<TestResult<IActorTest>> {
    if (action.context.get(KEY_CONTEXT_WRAPPED)) {
      return failTest('Unable to wrap link queues multiple times');
    }
    if (!action.context.get(KeysCore.log)) {
      return failTest('A logger is required when reporting link queue occupancy');
    }
    return passTestVoid();
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = action.context.set(KEY_CONTEXT_WRAPPED, true);
    const query: Algebra.Operation = action.context.get(KeysInitQuery.query)!;
    const logger: Logger = action.context.get(KeysCore.log)!;

    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });
    return {
      linkQueue: new LinkQueueLogger(linkQueue, toSparql(query), logger),
    };
  }
}

export interface IActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancyArgs
  extends IActorArgs<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput> {
  mediatorRdfResolveHypermediaLinksQueue: Mediator<
    Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
    IActionRdfResolveHypermediaLinksQueue,
    IActorTest,
    IActorRdfResolveHypermediaLinksQueueOutput
  >;
}

export const KEY_CONTEXT_WRAPPED = new ActionContextKey<boolean>(
  '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy:wrapped',
);
