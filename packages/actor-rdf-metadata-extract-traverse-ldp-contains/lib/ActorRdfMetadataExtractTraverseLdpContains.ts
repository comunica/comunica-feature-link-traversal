import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from '@rdfjs/types';

/**
 * A comunica Traverse LDP Contains RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseLdpContains extends ActorRdfMetadataExtract {
  public static readonly IRI_LDP_CONTAINS = 'http://www.w3.org/ns/ldp#contains';

  public constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    return new Promise((resolve, reject) => {
      const traverse: ILink[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Immediately resolve when a value has been found.
      action.metadata.on('data', (quad: RDF.Quad) => {
        if (quad.predicate.value === ActorRdfMetadataExtractTraverseLdpContains.IRI_LDP_CONTAINS) {
          traverse.push({ url: quad.object.value });
        }
      });

      // If no value has been found, assume infinity.
      action.metadata.on('end', () => {
        resolve({ metadata: { traverse }});
      });
    });
  }
}
