import type {
  IActionExtractLinks,
  IActorExtractLinksArgs,
  IActorExtractLinksOutput,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Traverse Predicates RDF Metadata Extract Actor.
 */
export class ActorExtractLinksPredicates extends ActorExtractLinks {
  private readonly checkSubject: boolean;
  private readonly predicates: RegExp[];
  public static readonly REACHABILITY_LABEL_COMMON = 'cCommon';
  public static readonly REACHABILITY_LABEL_LDP = 'cLDP';
  public static readonly REACHABILITY_LABEL_SOLID_STORAGE = 'cSolidStorage';
  public static readonly REACHABILITY_LABEL_NONE = 'cNone';
  private static readonly REACHABILITY_PREDICATE = 'cPredicate';

  public constructor(args: IActorExtractLinksTraversePredicatesArgs) {
    super(args);

    this.predicates = args.predicateRegexes.map(stringRegex => new RegExp(stringRegex, 'u'));
    this.reachabilityLabel = ActorExtractLinksPredicates.reachabilityLabel(new Set(args.predicateRegexes));
    Object.freeze(this.reachabilityLabel);
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
              links.push(this.annotateLinkWithTheReachabilityCriteria({ url: quad.object.value }));
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

  public static reachabilityLabel(predicates: Set<string>): string {
    if (setEquals(PREDICATE_COMMON, predicates)) {
      return ActorExtractLinksPredicates.REACHABILITY_LABEL_COMMON;
    }

    if (setEquals(PREDICATE_LDP, predicates)) {
      return ActorExtractLinksPredicates.REACHABILITY_LABEL_LDP;
    }

    if (setEquals(PREDICATE_SOLID_STORAGE, predicates)) {
      return ActorExtractLinksPredicates.REACHABILITY_LABEL_SOLID_STORAGE;
    }

    if (predicates.size === 0) {
      return ActorExtractLinksPredicates.REACHABILITY_LABEL_NONE;
    }

    if (predicates.size === 1) {
      const [ reachability ] = predicates;
      return `${ActorExtractLinksPredicates.REACHABILITY_PREDICATE}_${reachability}`;
    }

    let label = ActorExtractLinksPredicates.REACHABILITY_PREDICATE;
    for (const val of predicates.values()) {
      label += `_${val}`;
    }

    return `${label}`;
  }
}

export interface IActorExtractLinksTraversePredicatesArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput>, IActorExtractLinksArgs {
  /**
   * If only quads will be considered that have a subject equal to the request URL.
   */
  checkSubject: boolean;
  /**
   * A list of regular expressions that will be tested against predicates of quads.
   */
  predicateRegexes: string[];
}

const PREDICATE_COMMON = new Set([
  'http://www.w3.org/2000/01/rdf-schema#seeAlso',
  'http://www.w3.org/2002/07/owl##sameAs',
  'http://xmlns.com/foaf/0.1/isPrimaryTopicOf',
]);

const PREDICATE_LDP = new Set([ 'http://www.w3.org/ns/ldp#contains' ]);
const PREDICATE_SOLID_STORAGE = new Set([ 'http://www.w3.org/ns/pim/space#storage' ]);

function setEquals(setA: Set<string>, setB: Set<string>): boolean {
  if (setA.size !== setB.size) {
    return false;
  }
  return [ ...setA ].every(x => setB.has(x));
}
