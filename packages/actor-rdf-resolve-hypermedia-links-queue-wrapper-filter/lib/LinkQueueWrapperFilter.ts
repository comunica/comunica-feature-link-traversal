import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { LinkFilterType } from '@comunica/types-link-traversal';

/**
 * A link queue wrapper that filters away links.
 */
export class LinkQueueWrapperFilter extends LinkQueueWrapper {
  private readonly filters: LinkFilterType[];

  public constructor(linkQueue: ILinkQueue, linkFilters: LinkFilterType[]) {
    super(linkQueue);
    this.filters = linkFilters;
  }

  public override pop(): ILink | undefined {
    let link = super.pop();
    while (link) {
      if (this.filters.some(filter => !filter(link!))) {
        link = super.pop();
      } else {
        break;
      }
    }
    return link;
  }
}
