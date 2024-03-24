import type { ShapeTree } from '@comunica/actor-rdf-metadata-extract-shapetrees';
import type {
  IActionRdfResolveHypermediaLinks,
  IActorRdfResolveHypermediaLinksOutput,
  IActorRdfResolveHypermediaLinksArgs,
  MediatorRdfResolveHypermediaLinks,
  ILink,
} from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorTest } from '@comunica/core';

/**
 * A comunica Traverse Prune Shapetrees RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTraversePruneShapetrees extends ActorRdfResolveHypermediaLinks {
  private readonly mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;

  public constructor(args: IActorRdfResolveHypermediaLinksTraversePruneShapetreesArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinks): Promise<IActorTest> {
    if (!action.metadata.traverse) {
      throw new Error(`Actor ${this.name} requires a 'traverse' metadata entry.`);
    }
    if (!action.metadata.shapetrees) {
      throw new Error(`Actor ${this.name} requires a 'shapetrees' metadata entry.`);
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinks): Promise<IActorRdfResolveHypermediaLinksOutput> {
    // Clone the action without shapetrees
    const subAction = { ...action, metadata: { ...action.metadata }};
    delete subAction.metadata.shapetrees;

    // Obtain links and shapetrees from metadata
    let links: ILink[] = action.metadata.traverse;
    // Const applicable: ShapeTree[] = action.metadata.shapetrees.applicable;
    const nonApplicable: ShapeTree[] = action.metadata.shapetrees.nonApplicable;

    // Prune links from non-applicable shapetrees
    links = links.filter((link) => {
      for (const shapeTree of nonApplicable) {
        if (this.urlMatchesTemplate(link.url, shapeTree.uriTemplate)) {
          return false;
        }
      }
      return true;
    });

    // Prioritize links from applicable shapetrees over other links
    // TODO: check if URL template matches with one of applicable (do in a different actor?)

    // Update metadata in action
    subAction.metadata.traverse = links;

    // TODO: how to handle more complex URI templates recursively?

    // Forward updated metadata to next actor
    return this.mediatorRdfResolveHypermediaLinks.mediate(subAction);
  }

  /**
   * Check if the given URL matches with the given URL template.
   * @param url a URL.
   * @param template a URL template.
   */
  public urlMatchesTemplate(url: string, template: string): boolean {
    // TODO: this is not able to handle more complex cases, see https://datatracker.ietf.org/doc/html/rfc6570
    const templateRegex = new RegExp(template.replaceAll(/\{[^}]*\}/gu, '.+'), 'u');
    return templateRegex.test(url);
  }
}

export interface IActorRdfResolveHypermediaLinksTraversePruneShapetreesArgs
  extends IActorRdfResolveHypermediaLinksArgs {
  /**
   * Mediator over the rdf-resolve-hypermedia-links bus.
   */
  mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
}
