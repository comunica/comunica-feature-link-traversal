import type { ILinkQueue, ILink } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapper } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';

/**
 * A link queue that prioritizes Sparql endpoint URIs
 */
export class LinkQueuePrioritizePredicates extends LinkQueueWrapper {
  private readonly predicates: Set<string>;

  public constructor(linkQueue: ILinkQueue, predicates: Set<string>) {
    super(linkQueue);
    this.predicates = predicates;
  }

  public override push(link: ILink, parent: ILink): boolean {
    if (
      typeof link.metadata?.producedByActor?.matchingPredicate === 'string' &&
      this.predicates.has(link.metadata.producedByActor.matchingPredicate)
    ) {
      link.metadata.priority = 1;
    }
    return super.push(link, parent);
  }
}
