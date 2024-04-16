import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';
import { getNamedNodes, getTerms } from 'rdf-terms';

/**
 * A comunica Traverse All RDF Metadata Extract Actor.
 */
export class ActorExtractLinksAll extends ActorExtractLinks {
  public constructor(args: IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput>) {
    super(args);
  }

  public async test(_action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        for (const link of getNamedNodes(getTerms(quad))) {
          links.push({ url: link.value, metadata: { [PRODUCED_BY_ACTOR]: { name: this.name }}});
        }
      }),
    };
  }
}
