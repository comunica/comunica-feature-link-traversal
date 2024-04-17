import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LoggerPretty } from '@comunica/logger-pretty';
import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';
import type { Algebra } from 'sparqlalgebrajs';

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
  query: Algebra.Operation | string;
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
  private readonly logger: LoggerPretty;
  public static readonly LOGGER_NAME = '<Link queue occupancy>';

  /**
   *
   * @param {ILinkQueue & IOptionalLinkQueueParameters} linkQueue - The link queue with optional public parameters
   * @param {Algebra.Operation} query - The current query
   */
  public constructor(linkQueue: ILinkQueue & IOptionalLinkQueueParameters, query: Algebra.Operation) {
    super(linkQueue);

    this.query = JSON.parse(JSON.stringify(query));

    this.logger = new LoggerPretty({ level: 'trace' });

    Object.freeze(this.query);
    Object.freeze(this.logger);
  }

  private static getReachability(link: ILink): string | null {
    const metadata = link.metadata;
    if (metadata !== undefined) {
      return metadata[PRODUCED_BY_ACTOR].name;
    }
    return null;
  }

  public override push(link: ILink, parent: ILink): boolean {
    const resp: boolean = super.push(link, parent);
    if (resp) {
      const parentStatisticLink: IURLStatistic = {
        url: parent.url,
        reachability_criteria: LinkQueueLogger.getReachability(link),
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
  public materialize(event: ILinkQueueEvent): void {
    const jsonEvent = { ...event, type: EventType[event.type] };
    this.logger.trace(LinkQueueLogger.LOGGER_NAME, jsonEvent);
  }
}
