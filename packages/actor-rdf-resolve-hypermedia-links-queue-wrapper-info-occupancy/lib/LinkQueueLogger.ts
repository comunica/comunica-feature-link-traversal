import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Logger } from '@comunica/types';

/**
 * A link queue that log information about event happening in the queue
 */
export class LinkQueueLogger extends LinkQueueWrapper {
  public readonly query: string;
  private readonly logger: Logger;
  private readonly linkProductionRatio: ILinkProductionActorRatio = {
    pushEvents: {},
    popEvents: {},
  };

  public static readonly LINK_QUEUE_EVENT_NAME = 'Link queue changed';

  /**
   *
   * @param {ILinkQueue} linkQueue - The link queue
   * @param {Algebra.Operation} query - The current query
   * @param {Logger} logger - The logger where the events are output
   */
  public constructor(linkQueue: ILinkQueue, query: string, logger: Logger) {
    super(linkQueue);
    this.logger = logger;
    this.query = query;
  }

  /**
   * Helper function to get the reachability criteria of a link
   * @param {ILink} link - Current link
   * @returns {IProducedByActor | null } The reachability criteria with extra information about it if available
   */
  private static getActorProductorInformation(link: ILink): IProducedByActor | null {
    const metadata = link.metadata;
    if (metadata !== undefined && metadata[PRODUCED_BY_ACTOR] !== undefined) {
      const { name, ...rest } = metadata[PRODUCED_BY_ACTOR];

      if (name === undefined) {
        return null;
      }
      return {
        name,
        metadata: Object.keys(rest).length === 0 ? undefined : rest,
      };
    }
    return null;
  }

  /**
   * Update the link production ratio
   * @param {IUrlStatistic} link - current link
   * @param {keyof ILinkProductionActorRatio} event - link queue event
   */
  private updateLinkProductionRatio(link: IUrlStatistic, event: keyof ILinkProductionActorRatio): void {
    if (link.producedByActor !== null &&
      this.linkProductionRatio[event][link.producedByActor?.name] !== undefined) {
      this.linkProductionRatio[event][link.producedByActor?.name] += 1;
    } else if (link.producedByActor !== null &&
      this.linkProductionRatio[event][link.producedByActor?.name] === undefined) {
      this.linkProductionRatio[event][link.producedByActor?.name] = 1;
    } else if (this.linkProductionRatio[event].unknown === undefined) {
      this.linkProductionRatio[event].unknown = 1;
    } else {
      this.linkProductionRatio[event].unknown += 1;
    }
  }

  /**
   * Create the information of a link queue event
   * @param {ILink} link - current link
   * @param {EventType} eventType - the type of event
   * @param {ILink|undefined} parent - the parent of the link
   * @returns {ILinkQueueEvent} current event of the link queue
   */
  private createLinkQueueEvent(link: ILink, eventType: EventType, parent?: ILink): ILinkQueueEvent {
    const linkInfo: IUrlStatistic = {
      url: link.url,
      producedByActor: LinkQueueLogger.getActorProductorInformation(link),
      timestamp: Date.now(),
      parent: parent?.url,
    };
    this.updateLinkProductionRatio(linkInfo, eventType === EventType.POP ? 'popEvents' : 'pushEvents');

    return {
      type: eventType,
      link: linkInfo,
      query: this.query,
      queue: {
        size: this.getSize(),
        ...this.linkProductionRatio,
      },
    };
  }

  public override push(link: ILink, parent: ILink): boolean {
    const resp: boolean = super.push(link, parent);
    if (resp) {
      const event: ILinkQueueEvent = this.createLinkQueueEvent(link, EventType.PUSH, parent);
      this.materialize(event);
    }
    return resp;
  }

  public override pop(): ILink | undefined {
    const link = super.pop();
    if (link !== undefined) {
      const event: ILinkQueueEvent = this.createLinkQueueEvent(link, EventType.POP);
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

/**
 * The type of event
 */
export enum EventType {
  PUSH,
  POP,
}

/**
 * A link queue event
 */
interface ILinkQueueEvent {
  type: EventType;
  link: IUrlStatistic;
  query: string;
  queue: IQueueStatistics;
}
/**
 * Statistic of the link queue
 */
interface IQueueStatistics extends ILinkProductionActorRatio {
  size: number;
}
/**
 * Ratio of the actor producing links in relation to the push and pop events.
 * The key of the index is the name of the actor and the value is the number of occurences.
 */
interface ILinkProductionActorRatio {
  pushEvents: Record<string, number>;
  popEvents: Record<string, number>;
}

/**
 * Information about an URL
 */
interface IUrlStatistic {
  url: string;
  producedByActor: IProducedByActor | null;
  timestamp?: number;
  parent?: string;
}
/**
 * Information about the actor that produce the link
 */
interface IProducedByActor {
  name: string;
  metadata?: object;
}

const PRODUCED_BY_ACTOR = 'producedByActor';
