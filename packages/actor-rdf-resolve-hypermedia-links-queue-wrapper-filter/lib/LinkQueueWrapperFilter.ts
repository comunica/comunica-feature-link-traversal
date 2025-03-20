import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { LinkFilterType } from '@comunica/types-link-traversal';

/**
 * A link queue wrapper that filters away links.
 */
export class LinkQueueWrapperFilter extends LinkQueueWrapper {
  private readonly filters: LinkFilterType[];
  private readonly logWarn: (message: string) => void;

  public constructor(linkQueue: ILinkQueue, linkFilters: LinkFilterType[], logWarn: (message: string) => void) {
    super(linkQueue);
    this.filters = linkFilters;
    this.logWarn = logWarn;
  }

  public override pop(): ILink | undefined {
    let link = super.pop();
    while (link) {
      if (this.filters.some(filter => !filter(link!))) {
        this.logWarn(`Skipping link due to filtering: ${link.url}`);
        link = super.pop();
      } else {
        break;
      }
    }
    return link;
  }
}
