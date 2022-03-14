import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Solid Type Index Extract Links Actor.
 */
export class ActorExtractLinksSolidTypeIndex extends ActorExtractLinks {
  public constructor(args: IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput>) {
    super(args);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    const links: ILink[] = [];
    // TODO implement

    return { links };
  }
}
