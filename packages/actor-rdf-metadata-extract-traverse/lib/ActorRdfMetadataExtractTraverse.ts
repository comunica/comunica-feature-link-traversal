import type { MediatorExtractLinks } from '@comunica/bus-extract-links';
import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { IActorArgs, IActorTest, TestResult } from '@comunica/core';
import { passTestVoid } from '@comunica/core';

/**
 * A comunica Traverse RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverse extends ActorRdfMetadataExtract {
  private readonly mediatorExtractLinks: MediatorExtractLinks;

  public constructor(args: IActorRdfMetadataExtractTraverseArgs) {
    super(args);
  }

  public async test(_action: IActionRdfMetadataExtract): Promise<TestResult<IActorTest>> {
    return passTestVoid();
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const result = await this.mediatorExtractLinks.mediate(action);
    return {
      metadata: {
        traverse: result.links,
        traverseConditional: result.linksConditional,
      },
    };
  }
}

export interface IActorRdfMetadataExtractTraverseArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
  /**
   * Mediator for extracting links for traversal.
   */
  mediatorExtractLinks: MediatorExtractLinks;
}
