import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';

/**
 * A link queue that only allows the given number of links to be pushed into it.
 */
export class LinkQueueLimitCount extends LinkQueueWrapper {
  private limit: number;

  public constructor(linkQueue: ILinkQueue, limit: number) {
    super(linkQueue);
    this.limit = limit;
  }

  public override push(link: ILink, parent: ILink): boolean {
    if (this.limit === 0) {
      return false;
    }
    this.limit--;
    return super.push(link, parent);
  }
}
