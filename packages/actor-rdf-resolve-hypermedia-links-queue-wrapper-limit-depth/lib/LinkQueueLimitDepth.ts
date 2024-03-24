import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';

/**
 * A link queue that only allows the given number of links to be pushed into it.
 */
export class LinkQueueLimitDepth extends LinkQueueWrapper {
  private readonly limit: number;

  public constructor(linkQueue: ILinkQueue, limit: number) {
    super(linkQueue);
    this.limit = limit;
  }

  public override push(link: ILink, parent: ILink): boolean {
    // Ensure our parent has a defined depth
    if (!parent.metadata) {
      parent.metadata = {};
    }
    if (!parent.metadata[KEY_METADATA_DEPTH]) {
      parent.metadata[KEY_METADATA_DEPTH] = 0;
    }

    // Determine link depth
    const depth: number = (<number> parent.metadata[KEY_METADATA_DEPTH]) + 1;

    // Don't allow pushing if we exceeded our depth limit
    if (depth > this.limit) {
      return false;
    }

    // Set the depth of our current link
    if (!link.metadata) {
      link.metadata = {};
    }
    link.metadata[KEY_METADATA_DEPTH] = depth;
    return super.push(link, parent);
  }
}

export const KEY_METADATA_DEPTH = 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth';
