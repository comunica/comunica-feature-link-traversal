import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';
import type { Algebra } from 'sparqlalgebrajs';
import { Logger } from '@comunica/types';


/**
 * The type of event
 */
export enum EventType {
  Push,
  Pop,
  Init,
}

/**
 * A link queue event
 */
interface ILinkQueueEvent {
  type: EventType;
  link: IURLStatistic;
  query: Algebra.Operation;
}
/**
 * Optional parameters necessitating special processing
 */
interface IOptionalLinkQueueParameters {
}

/**
 * Information about an URL
 */
interface IURLStatistic {
  url: string;
  reachability_criteria: string | null;
  timestamp?: number;
  parent?: IURLStatistic;
}
/**
 * A link queue that log information about event happening in the queue
 */
export class LinkQueueLogger extends LinkQueueWrapper {
  public readonly query: Algebra.Operation;
  private readonly logger: Logger;
  public static readonly LINK_QUEUE_EVENT_NAME = '<Link queue occupancy>';
  public static readonly LINK_QUEUE_DIDNT_STARTED_EMPTY_MESSAGE = 'the link queue didn\'t started empty';

  /**
   *
   * @param {ILinkQueue & IOptionalLinkQueueParameters} linkQueue - The link queue with optional public parameters
   * @param {Algebra.Operation} query - The current query
   */
  public constructor(linkQueue: ILinkQueue & IOptionalLinkQueueParameters, query: Algebra.Operation, logger: Logger) {
    super(linkQueue);
    this.logger = logger;

    if (linkQueue.isEmpty()) {
      this.logger.warn(LinkQueueLogger.LINK_QUEUE_EVENT_NAME, { message: LinkQueueLogger.LINK_QUEUE_DIDNT_STARTED_EMPTY_MESSAGE });
    }
    this.query = JSON.parse(JSON.stringify(query));

    Object.freeze(this.query);
  }

  private static getReachability(link: ILink): string | null {
    const metadata = link.metadata;
    if (metadata !== undefined) {
      return metadata[PRODUCED_BY_ACTOR]?.name ?? null;
    }
    return null;
  }

  public override push(link: ILink, parent: ILink): boolean {
    const resp: boolean = super.push(link, parent);
    if (resp) {
      const parentStatisticLink: IURLStatistic = {
        url: parent.url,
        reachability_criteria: LinkQueueLogger.getReachability(parent),
      };
      const statisticLink: IURLStatistic = {
        url: link.url,
        reachability_criteria: LinkQueueLogger.getReachability(link),
        timestamp: Date.now(),
        parent: parentStatisticLink,
      };
      const event: ILinkQueueEvent = {
        type: EventType.Push,
        link: statisticLink,
        query: this.query,
      };

      this.materialize(event);
    }
    return resp;
  }

  public override pop(): ILink | undefined {
    const link = super.pop();
    if (link !== undefined) {
      const statisticLink: IURLStatistic = {
        url: link.url,
        reachability_criteria: LinkQueueLogger.getReachability(link),
        timestamp: Date.now(),
      };
      const event: ILinkQueueEvent = {
        type: EventType.Pop,
        link: statisticLink,
        query: this.query,
      };

      this.materialize(event);
    }
    return link;
  }

  /**
   * Materialize the history to a file
   */
  private materialize(event: ILinkQueueEvent): void {
    const jsonEvent = { ...event, type: EventType[event.type] };
    this.logger.trace(LinkQueueLogger.LINK_QUEUE_EVENT_NAME, jsonEvent);
  }
}
