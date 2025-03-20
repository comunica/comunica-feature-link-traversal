import type { MediatorExtractLinks } from '@comunica/bus-extract-links';
import type {
  IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput,
  IActorRdfMetadataExtractArgs,
} from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import type { IActorTest, TestResult } from '@comunica/core';
import { passTestVoid, failTest } from '@comunica/core';
import type { ILink } from '@comunica/types';
import type * as RDF from '@rdfjs/types';

/**
 * Comunica RDF metadata extract actor to collect link filters from VoID descriptions.
 */
export class ActorRdfMetadataExtractLinkFilterVoid extends ActorRdfMetadataExtract {
  private readonly mediatorExtractLinks: MediatorExtractLinks;

  public constructor(args: IActorRdfMetadataExtractArgs) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<TestResult<IActorTest>> {
    if (!action.context.has(KeysRdfResolveHypermediaLinks.linkFilters)) {
      return failTest('unable to extract link filters without context storage target present');
    }
    return passTestVoid();
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    return new Promise<IActorRdfMetadataExtractOutput>((resolve, reject) => {
      const datasetsWithEndpoint = new Set<string>();
      const uriRegexPatterns: Record<string, RegExp> = {};
      const uriSpaces: Record<string, string> = {};

      action.metadata
        .on('error', reject)
        .on('data', (quad: RDF.Quad) => {
          switch (quad.predicate.value) {
            case 'http://rdfs.org/ns/void#sparqlEndpoint':
              datasetsWithEndpoint.add(quad.subject.value);
              break;
            case 'http://rdfs.org/ns/void#uriSpace':
              uriSpaces[quad.subject.value] = quad.object.value;
              break;
            case 'http://rdfs.org/ns/void#uriRegexPattern':
              uriRegexPatterns[quad.subject.value] = new RegExp(quad.object.value, 'u');
              break;
          }
        })
        .on('end', () => {
          const linkFilters = action.context.getSafe(KeysRdfResolveHypermediaLinks.linkFilters);

          // Find out which datasets have both endpoint and URI filter available,
          // and create the corresponding link filters in the action context storage
          for (const datasetUri of datasetsWithEndpoint) {
            if (uriSpaces[datasetUri]) {
              linkFilters.push((link: ILink) => !link.url.startsWith(uriSpaces[datasetUri]));
              this.logWarn(action.context, 'Extracted link filter from VoID', () => ({
                dataset: datasetUri,
                uriSpace: uriSpaces[datasetUri],
              }));
            } else if (uriRegexPatterns[datasetUri]) {
              linkFilters.push((link: ILink) => !uriRegexPatterns[datasetUri].test(link.url));
              this.logWarn(action.context, 'Extracted link filter from VoID', () => ({
                dataset: datasetUri,
                uriRegexPattern: uriRegexPatterns[datasetUri],
              }));
            }
          }

          // Return something that meets the output criteria
          resolve({ metadata: {}});
        });
    });
  }
}
