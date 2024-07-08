import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { KeysInitQuery, KeysCore } from '@comunica/context-entries';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import { ActionContextKey } from '@comunica/core';
import { type Algebra, toSparql } from 'sparqlalgebrajs';
import { LinkQueueLogger } from './LinkQueueLogger';
import type { Logger } from '@comunica/types';


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

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorTest> {
    if (action.context.get(KEY_CONTEXT_WRAPPED)) {
      throw new Error('Unable to wrap link queues multiple times');
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = action.context.set(KEY_CONTEXT_WRAPPED, true);
    const query: Algebra.Operation = action.context.get(KeysInitQuery.query)!;
    const logger:Logger|undefined = action.context.get(KeysCore.log);

    if(logger===undefined){
      throw new Error("cannot report link queue information if no logger is defined")
    }

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
