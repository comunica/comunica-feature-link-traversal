import { ActorRdfMetadataExtract, IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { IActorArgs, IActorTest } from '@comunica/core';
import { getNamedNodes, getTerms } from 'rdf-terms';

/**
 * A comunica Traverse All RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseAll extends ActorRdfMetadataExtract {
  public constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    return new Promise((resolve, reject) => {
      const traverse: string[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Immediately resolve when a value has been found.
      action.metadata.on('data', quad => {
        for (const link of getNamedNodes(getTerms(quad))) {
          traverse.push(link.value);
        }
      });

      // If no value has been found, assume infinity.
      action.metadata.on('end', () => {
        resolve({ metadata: { traverse }});
      });
    });
  }
}
