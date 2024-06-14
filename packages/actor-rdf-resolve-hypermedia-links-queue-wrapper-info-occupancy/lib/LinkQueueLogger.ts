import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Logger } from '@comunica/types';
import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * The type of event
 */
export enum EventType {
  Push,
  Pop,
}

/**
 * A link queue event
 */
interface ILinkQueueEvent {
  type: EventType;
  link: IURLStatistic;
  query: Algebra.Operation;
  queueStatistics: IQueueStatistics;
}
/**
 * Statistic of the link queue
 */
interface IQueueStatistics {
  size: number;
  reachabilityRatio: IReachabilityRatio;
}
/**
 * Ratio of the reachability criteria of the link in the queue
 */
interface IReachabilityRatio {
  pushEvent: Record<string, number>;
  popEvent: Record<string, number>;
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
  reachability_criteria_dynamic_info?: object;
  timestamp?: number;
  parent?: IURLStatistic;
}
/**
 * A link queue that log information about event happening in the queue
 */
export class LinkQueueLogger extends LinkQueueWrapper {
  public readonly query: Algebra.Operation;
  private readonly logger: Logger;
  private readonly reachabilityRatio: IReachabilityRatio = {
    pushEvent: {},
    popEvent: {},
  };

  public static readonly LINK_QUEUE_EVENT_NAME = '<Link queue occupancy>';
  public static readonly LINK_QUEUE_DIDNT_START_EMPTY_MESSAGE = 'the link queue didn\'t started empty';

  /**
   *
   * @param {ILinkQueue & IOptionalLinkQueueParameters} linkQueue - The link queue with optional parameters
   * @param {Algebra.Operation} query - The current query
   * @param {Logger} logger - The logger when the event are outputted
   */
  public constructor(linkQueue: ILinkQueue & IOptionalLinkQueueParameters, query: Algebra.Operation, logger: Logger) {
    super(linkQueue);
    this.logger = logger;

    if (!linkQueue.isEmpty()) {
      this.logger.warn(
        LinkQueueLogger.LINK_QUEUE_EVENT_NAME,
        {
          message: LinkQueueLogger.LINK_QUEUE_DIDNT_START_EMPTY_MESSAGE,
        },
      );
    }
    this.query = JSON.parse(JSON.stringify(query));

    Object.freeze(this.query);
  }

  /**
   * Helper function to get the reachability criteria of a link
   * @param {ILink} link - Current link
   * @returns {[string, object | undefined] | null}
   * The reachability criteria with extra information about it if available
   */
  private static getReachability(link: ILink): [string, object | undefined] | null {
    const metadata = link.metadata;
    if (metadata !== undefined && metadata[PRODUCED_BY_ACTOR] !== undefined) {
      const { name, ...rest } = metadata[PRODUCED_BY_ACTOR];

      if (name === undefined) {
        return null;
      }
      return [
        name,
        Object.keys(rest).length === 0 ? undefined : rest,
      ];
    }
    return null;
  }

  /**
   * Append the reachability criterion ratios
   * @param {IURLStatistic} statisticLink - current link
   * @param {IReachabilityRatio} event - The current event
   */
  private appendReachabilityStatistic(statisticLink: IURLStatistic, event: keyof IReachabilityRatio): void {
    if (statisticLink.reachability_criteria !== null &&
      this.reachabilityRatio[event][statisticLink.reachability_criteria] !== undefined) {
      this.reachabilityRatio[event][statisticLink.reachability_criteria] += 1;
    } else if (statisticLink.reachability_criteria !== null &&
      this.reachabilityRatio[event][statisticLink.reachability_criteria] === undefined) {
      this.reachabilityRatio[event][statisticLink.reachability_criteria] = 1;
    } else if (this.reachabilityRatio[event].unknown === undefined) {
      this.reachabilityRatio[event].unknown = 1;
    } else {
      this.reachabilityRatio[event].unknown += 1;
    }
  }

  public override push(link: ILink, parent: ILink): boolean {
    const resp: boolean = super.push(link, parent);
    if (resp) {
      const reachabilityCriteriaParentLink = LinkQueueLogger.getReachability(parent);

      const parentStatisticLink: IURLStatistic = {
        url: parent.url,
        reachability_criteria: reachabilityCriteriaParentLink === null ? null : reachabilityCriteriaParentLink[0],
        reachability_criteria_dynamic_info: reachabilityCriteriaParentLink === null ?
          undefined :
          reachabilityCriteriaParentLink[1],
      };

      const reachabilityCriteriaCurrentLink = LinkQueueLogger.getReachability(link);

      const statisticLink: IURLStatistic = {
        url: link.url,
        reachability_criteria: reachabilityCriteriaCurrentLink === null ? null : reachabilityCriteriaCurrentLink[0],
        reachability_criteria_dynamic_info: reachabilityCriteriaCurrentLink === null ?
          undefined :
          reachabilityCriteriaCurrentLink[1],
        timestamp: Date.now(),
        parent: parentStatisticLink,
      };
      this.appendReachabilityStatistic(statisticLink, 'pushEvent');
      const event: ILinkQueueEvent = {
        type: EventType.Push,
        link: statisticLink,
        query: this.query,
        queueStatistics: {
          size: this.getSize(),
          reachabilityRatio: this.reachabilityRatio,
        },
      };

      this.materialize(event);
    }
    return resp;
  }

  public override pop(): ILink | undefined {
    const link = super.pop();
    if (link !== undefined) {
      const reachabilityCriteriaCurrentLink = LinkQueueLogger.getReachability(link);
      const statisticLink: IURLStatistic = {
        url: link.url,
        reachability_criteria: reachabilityCriteriaCurrentLink === null ? null : reachabilityCriteriaCurrentLink[0],
        reachability_criteria_dynamic_info: reachabilityCriteriaCurrentLink === null ?
          undefined :
          reachabilityCriteriaCurrentLink[1],
        timestamp: Date.now(),
      };
      this.appendReachabilityStatistic(statisticLink, 'popEvent');
      const event: ILinkQueueEvent = {
        type: EventType.Pop,
        link: statisticLink,
        query: this.query,
        queueStatistics: {
          size: this.getSize(),
          reachabilityRatio: this.reachabilityRatio,
        },
      };

      this.materialize(event);
    }
    return link;
  }

  /**
   * Materialize the current event into the logger
   * @param {ILinkQueueEvent} event - Current event
   */
  private materialize(event: ILinkQueueEvent): void {
    const jsonEvent = { ...event, type: EventType[event.type] };
    this.logger.trace(LinkQueueLogger.LINK_QUEUE_EVENT_NAME, { data: JSON.stringify(jsonEvent) });
  }
}
