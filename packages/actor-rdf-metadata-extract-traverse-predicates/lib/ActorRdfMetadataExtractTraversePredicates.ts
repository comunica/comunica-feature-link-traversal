import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from '@rdfjs/types';

/**
 * A comunica Traverse Predicates RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraversePredicates extends ActorRdfMetadataExtract {
  private readonly checkSubject: boolean;
  private readonly predicates: RegExp[];

  public constructor(args: IActorRdfMetadataExtractTraversePredicatesArgs) {
    super(args);

    this.predicates = args.predicateRegexes.map(stringRegex => new RegExp(stringRegex, 'u'));
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
        if (!this.checkSubject || this.subjectMatches(quad.subject.value, action.url)) {
          for (const regex of this.predicates) {
            if (regex.test(quad.predicate.value)) {
              traverse.push({ url: quad.object.value });
              break;
            }
          }
        }
      });

      // If no value has been found, assume infinity.
      action.metadata.on('end', () => {
        resolve({ metadata: { traverse }});
      });
    });
  }

  private subjectMatches(subject: string, url: string): boolean {
    const fragmentPos = subject.indexOf('#');
    if (fragmentPos >= 0) {
      subject = subject.slice(0, fragmentPos);
    }
    return subject === url;
  }
}

export interface IActorRdfMetadataExtractTraversePredicatesArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
  /**
   * If only quads will be considered that have a subject equal to the request URL.
   */
  checkSubject: boolean;
  /**
   * A list of regular expressions that will be tested against predicates of quads.
   */
  predicateRegexes: string[];
}
