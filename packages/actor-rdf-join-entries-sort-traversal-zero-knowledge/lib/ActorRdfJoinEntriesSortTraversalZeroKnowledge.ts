import type {
  IActionRdfJoinEntriesSort,
  IActorRdfJoinEntriesSortOutput,
  IActorRdfJoinEntriesSortTest,
} from '@comunica/bus-rdf-join-entries-sort';
import { ActorRdfJoinEntriesSort } from '@comunica/bus-rdf-join-entries-sort';
import { KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, TestResult } from '@comunica/core';
import { passTest } from '@comunica/core';
import type { IJoinEntryWithMetadata, IQuerySourceWrapper } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { getNamedNodes, getTerms, getVariables, QUAD_TERM_NAMES } from 'rdf-terms';
import { Algebra, Util as AlgebraUtil } from 'sparqlalgebrajs';

/**
 * An actor that sorts join entries based on Hartig's heuristic for plan selection in link traversal environments.
 *
 * It first determines isolated connected graphs. (done by @comunica/actor-optimize-query-operation-join-connected)
 * For each of the connected graphs, it orders triple patterns in BGPs by the following priority:
 * 1. dependency-respecting: for each (non-first) pattern, at least one variable must occur in a preceding pattern.
 * 2. seed: try to make the first pattern contain a source URI.
 * 3. no vocab seed: avoid first triple pattern with vocab URI (variable predicate,
 *    or variable objects with rdf:type predicate)
 * 4. filtering: patterns only containing variables also contained in preceding triple patterns
 *    are placed as soon as possible.
 *
 * It does this in an adaptive way.
 * This means that this actor will only determine the first triple pattern,
 * execute it, and materialize the remaining BGP based on its results.
 * After that, the remaining BGP is evaluated recursively by this or another BGP actor.
 */
export class ActorRdfJoinEntriesSortTraversalZeroKnowledge extends ActorRdfJoinEntriesSort {
  public constructor(
    args: IActorArgs<IActionRdfJoinEntriesSort, IActorRdfJoinEntriesSortTest, IActorRdfJoinEntriesSortOutput>,
  ) {
    super(args);
  }

  /**
   * Obtain all IRIs from the given pattern that are not related to vocabularies.
   * Concretely, predicates will be omitted, and objects if predicate is http://www.w3.org/1999/02/22-rdf-syntax-ns#type
   * @param pattern A quad pattern.
   */
  public static getPatternNonVocabUris(pattern: Algebra.Pattern | Algebra.Path): RDF.NamedNode[] {
    let nonVocabTerms: RDF.Term[];
    const predicates: RDF.Term[] = [];
    if (pattern.type === 'pattern') {
      predicates.push(pattern.predicate);
    } else {
      AlgebraUtil.recurseOperation(pattern, {
        link(link: Algebra.Link) {
          predicates.push(link.iri);
          return false;
        },
        nps(nps: Algebra.Nps) {
          for (const iri of nps.iris) {
            predicates.push(iri);
          }
          return false;
        },
      });
    }

    if (predicates
      .some(predicate => predicate.termType === 'NamedNode' &&
        predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type')) {
      nonVocabTerms = [ pattern.subject, pattern.graph ];
    } else {
      nonVocabTerms = [ pattern.subject, pattern.object, pattern.graph ];
    }
    return getNamedNodes(nonVocabTerms);
  }

  /**
   * Determine the source IRI of a given IRI without hash.
   * @param namedNode An IRI.
   */
  public static getSourceUri(namedNode: RDF.NamedNode): string {
    const value = namedNode.value;
    const hashPos = value.indexOf('#');
    return hashPos > 0 ? value.slice(0, hashPos) : value;
  }

  /**
   * Calculate a score for the given quad pattern based on a given set of sources.
   * The more sources are present in the given pattern as non-vocab URIs, the higher the score.
   * @param pattern A quad pattern.
   * @param sources An array of sources.
   */
  public static getScoreSeedNonVocab(pattern: Algebra.Pattern | Algebra.Path, sources: string[]): number {
    return ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(pattern)
      .map(term => ActorRdfJoinEntriesSortTraversalZeroKnowledge.getSourceUri(term))
      .filter(uri => sources.includes(uri))
      .length;
  }

  /**
   * Determine a score for the selectivity of the given pattern.
   * The fewer variables, the higher the score.
   * @param pattern A quad pattern.
   */
  public static getScoreSelectivity(pattern: Algebra.Pattern | Algebra.Path): number {
    const terms = pattern.type === 'pattern' ? getTerms(pattern) : [ pattern.subject, pattern.object, pattern.graph ];
    return QUAD_TERM_NAMES.length - getVariables(terms).length;
  }

  /**
   * This sorts join entries by first prioritizing triple patterns in BGPs, and then all other operation types.
   *
   * Sort the patterns in BGPs by the following priorities:
   * 1. A source in S or O (not O if rdf:type) (seed rule, no vocab rule)
   * 2. Most selective: fewest variables (filtering rule, dependency-respecting rule)
   * @param entries Quad patterns.
   * @param sources The sources that are currently being queried.
   */
  public static sortJoinEntries(entries: IJoinEntryWithMetadata[], sources: string[]): IJoinEntryWithMetadata[] {
    return [ ...entries ].sort((entryA: IJoinEntryWithMetadata, entryB: IJoinEntryWithMetadata) => {
      if ((entryA.operation.type === Algebra.types.PATTERN || entryA.operation.type === Algebra.types.PATH) &&
        (entryB.operation.type === Algebra.types.PATTERN || entryB.operation.type === Algebra.types.PATH)) {
        const compSeedNonVocab = ActorRdfJoinEntriesSortTraversalZeroKnowledge
          .getScoreSeedNonVocab(entryB.operation, sources) -
          ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(entryA.operation, sources);
        if (compSeedNonVocab === 0) {
          return ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(entryB.operation) -
            ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(entryA.operation);
        }
        return compSeedNonVocab;
      }
      return entryA.operation.type === Algebra.types.PATTERN ? -1 : 1;
    });
  }

  public async test(_action: IActionRdfJoinEntriesSort): Promise<TestResult<IActorRdfJoinEntriesSortTest>> {
    return passTest({ accuracy: 1 });
  }

  public async run(action: IActionRdfJoinEntriesSort): Promise<IActorRdfJoinEntriesSortOutput> {
    // Determine all current sources
    const sources: string[] = [];
    const dataSources: IQuerySourceWrapper[] | undefined = action.context
      .get(KeysQueryOperation.querySources);
    if (dataSources) {
      for (const source of dataSources) {
        const sourceValue = source.source.referenceValue;
        if (typeof sourceValue === 'string') {
          sources.push(sourceValue);
        }
      }
    }

    return { entries: ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries(action.entries, sources) };
  }
}
