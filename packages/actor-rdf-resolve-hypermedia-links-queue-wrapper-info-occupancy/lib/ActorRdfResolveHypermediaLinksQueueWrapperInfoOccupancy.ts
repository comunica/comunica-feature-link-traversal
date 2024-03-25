// eslint-disable-next-line import/no-nodejs-modules
import { createHash } from 'node:crypto';

// eslint-disable-next-line import/no-nodejs-modules
import * as Path from 'node:path';
import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { ActorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { KeysInitQuery } from '@comunica/context-entries';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import { ActionContextKey } from '@comunica/core';
import { LinkQueueSaveOnDiskInfo } from './LinkQueueSaveOnDiskInfo';

/**
 * A comunica Wrapper Limit Count RDF Resolve Hypermedia Links Queue Actor.
 */
export class ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy
  extends ActorRdfResolveHypermediaLinksQueue {
  private readonly filePath: string;
  private readonly mediatorRdfResolveHypermediaLinksQueue: Mediator<
    Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
    IActionRdfResolveHypermediaLinksQueue,
    IActorTest,
    IActorRdfResolveHypermediaLinksQueueOutput
  >;

  public constructor(args: IActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancyArgs) {
    super(args);
    this.filePath = args.filePath;
  }

  public async test(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorTest> {
    if (action.context.get(KEY_CONTEXT_WRAPPED)) {
      throw new Error('Unable to wrap link queues multiple times');
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinksQueue): Promise<IActorRdfResolveHypermediaLinksQueueOutput> {
    const context = action.context.set(KEY_CONTEXT_WRAPPED, true);
    const query: string = action.context.get(KeysInitQuery.queryString)!;
    const queryIdentifier: string | undefined = action.context.get(KEY_QUERY_IDENTIFIER);
    const pathObject = Path.parse(this.filePath);

    if (queryIdentifier === undefined) {
      const hashed_query = createHash('md5').update(query).digest('hex');
      pathObject.name += `_${hashed_query}`;
    } else {
      pathObject.name += `_${queryIdentifier}`;
    }

    const path = Path.join(pathObject.dir, `${pathObject.name}${pathObject.ext}`);

    const { linkQueue } = await this.mediatorRdfResolveHypermediaLinksQueue.mediate({ ...action, context });
    return { linkQueue: new LinkQueueSaveOnDiskInfo(linkQueue, path) };
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
  /**
   * Save path of the information
   */
  filePath: string;
}

export const KEY_CONTEXT_WRAPPED = new ActionContextKey<boolean>(
  '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupance:wrapped',
);

/**
 * An identifier for the link info file
 */
export const KEY_QUERY_IDENTIFIER = new ActionContextKey<string>(
  '@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupance:query-identifier',
);
