import type {
  IActionExtractLinks,
  IActorExtractLinksArgs,
  IActorExtractLinksOutput,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { IActorTest } from '@comunica/core';
import { getNamedNodes, getTerms } from 'rdf-terms';

/**
 * A comunica Traverse All RDF Metadata Extract Actor.
 */
export class ActorExtractLinksAll extends ActorExtractLinks {
  public static readonly REACHABILITY_LABEL = 'cAll';

  public constructor(args: IActorExtractLinksArgs) {
    super(args);
    this.reachabilityLabel = ActorExtractLinksAll.REACHABILITY_LABEL;
    Object.freeze(this.reachabilityLabel);
  }

  public async test(_action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        for (const link of getNamedNodes(getTerms(quad))) {
          links.push(this.annotateLinkWithTheReachabilityCriteria({ url: link.value }));
        }
      }),
    };
  }
}
