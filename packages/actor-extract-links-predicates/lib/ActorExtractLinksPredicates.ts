import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';

/**
 * A comunica Traverse Predicates RDF Metadata Extract Actor.
 */
export class ActorExtractLinksPredicates extends ActorExtractLinks {
  private readonly checkSubject: boolean;
  private readonly predicates: RegExp[];
  private readonly stringPredicates: string[];

  public constructor(args: IActorExtractLinksTraversePredicatesArgs) {
    super(args);

    this.stringPredicates = args.predicateRegexes;
    this.predicates = args.predicateRegexes.map(stringRegex => new RegExp(stringRegex, 'u'));
  }

  public async test(_action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        if (!this.checkSubject || this.subjectMatches(quad.subject.value, action.url)) {
          for (const regex of this.predicates) {
            if (regex.test(quad.predicate.value)) {
              links.push({
                url: quad.object.value,
                metadata: {
                  [PRODUCED_BY_ACTOR]: {
                    name: this.name,
                    predicates: this.stringPredicates,
                    matchingPredicate: quad.predicate.value,
                    checkSubject: this.checkSubject,
                  },
                },
              });
              break;
            }
          }
        }
      }),
    };
  }

  private subjectMatches(subject: string, url: string): boolean {
    const fragmentPos = subject.indexOf('#');
    if (fragmentPos >= 0) {
      subject = subject.slice(0, fragmentPos);
    }
    return subject === url;
  }
}

export interface IActorExtractLinksTraversePredicatesArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * If only quads will be considered that have a subject equal to the request URL.
   */
  checkSubject: boolean;
  /**
   * A list of regular expressions that will be tested against predicates of quads.
   */
  predicateRegexes: string[];
}
