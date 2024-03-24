import type {
  IActionRdfResolveHypermediaLinks,
  IActorRdfResolveHypermediaLinksOutput,
  ILink,
} from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';

/**
 * A comunica Traverse Replace Conditional RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTraverseReplaceConditional extends ActorRdfResolveHypermediaLinks {
  private readonly mediatorRdfResolveHypermediaLinks: Mediator<
  Actor<IActionRdfResolveHypermediaLinks, IActorTest, IActorRdfResolveHypermediaLinksOutput>,
  IActionRdfResolveHypermediaLinks,
IActorTest,
IActorRdfResolveHypermediaLinksOutput
>;

  public constructor(args: IActorRdfResolveHypermediaLinksTraverseReplaceConditionalArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinks): Promise<IActorTest> {
    if (!action.metadata.traverse) {
      throw new Error(`Actor ${this.name} requires a 'traverse' metadata entry.`);
    }
    if (!action.metadata.traverseConditional) {
      throw new Error(`Actor ${this.name} requires a 'traverseConditional' metadata entry.`);
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinks): Promise<IActorRdfResolveHypermediaLinksOutput> {
    // Clone the action without traverseConditional
    const subAction = { ...action, metadata: { ...action.metadata }};
    delete subAction.metadata.traverseConditional;

    // Obtain links from metadata
    const links: ILink[] = action.metadata.traverse;
    const linksConditional: Record<string, ILink> = Object.fromEntries((<ILink[]>action.metadata.traverseConditional)
      .map(link => [ link.url, link ]));

    // Replace links with their conditional counterpart if they exist
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.url in linksConditional) {
        links[i] = linksConditional[link.url];
      }
    }

    // Update metadata in action
    subAction.metadata.traverse = links;

    // Forward updated metadata to next actor
    return this.mediatorRdfResolveHypermediaLinks.mediate(subAction);
  }
}

export interface IActorRdfResolveHypermediaLinksTraverseReplaceConditionalArgs extends IActorArgs<
IActionRdfResolveHypermediaLinks,
IActorTest,
IActorRdfResolveHypermediaLinksOutput
> {
  mediatorRdfResolveHypermediaLinks: Mediator<
  Actor<IActionRdfResolveHypermediaLinks, IActorTest, IActorRdfResolveHypermediaLinksOutput>,
  IActionRdfResolveHypermediaLinks,
IActorTest,
IActorRdfResolveHypermediaLinksOutput
>;
}
