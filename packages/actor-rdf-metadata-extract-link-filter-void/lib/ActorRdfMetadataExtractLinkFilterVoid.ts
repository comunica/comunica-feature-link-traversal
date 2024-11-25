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
import type { LinkFilterType } from '@comunica/types-link-traversal';
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
    const discoveredFilters = await this.extractFilters(action.metadata);
    if (discoveredFilters.length > 0) {
      const linkFilters = action.context.getSafe(KeysRdfResolveHypermediaLinks.linkFilters);
      linkFilters.push(...discoveredFilters);
    }
    return { metadata: {}};
  }

  public async extractFilters(stream: RDF.Stream): Promise<LinkFilterType[]> {
    return new Promise<LinkFilterType[]>((resolve, reject) => {
      const filters = new Map<string, LinkFilterType>();
      const subjectsWithEndpoints = new Set<string>();
      stream
        .on('error', reject)
        .on('data', (quad: RDF.Quad) => {
          switch (quad.predicate.value) {
            case 'http://rdfs.org/ns/void#sparqlEndpoint':
              subjectsWithEndpoints.add(quad.subject.value);
              break;
            case 'http://rdfs.org/ns/void#uriRegexPattern':
              filters.set(quad.subject.value, (link: ILink) => !new RegExp(quad.object.value, 'u').test(link.url));
              break;
            case 'http://rdfs.org/ns/void#uriSpace':
              filters.set(quad.subject.value, (link: ILink) => !link.url.startsWith(quad.object.value));
              break;
          }
        })
        .on('end', () => {
          const output: LinkFilterType[] = [];
          for (const [ subject, filter ] of filters) {
            if (subjectsWithEndpoints.has(subject)) {
              output.push(filter);
            }
          }
          resolve(output);
        });
    });
  }
}
