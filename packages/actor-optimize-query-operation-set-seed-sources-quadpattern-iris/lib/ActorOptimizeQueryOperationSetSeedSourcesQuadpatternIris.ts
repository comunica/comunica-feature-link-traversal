import type {
  IActionOptimizeQueryOperation,
  IActorOptimizeQueryOperationOutput,
} from '@comunica/bus-optimize-query-operation';
import { ActorOptimizeQueryOperation } from '@comunica/bus-optimize-query-operation';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { DataSources } from '@comunica/types';
import { Algebra, Util } from 'sparqlalgebrajs';

/**
 * A comunica Set Seed Sources Quadpattern IRIs Optimize Query Operation Actor.
 */
export class ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris extends ActorOptimizeQueryOperation {
  private readonly extractSubjects: boolean;
  private readonly extractPredicates: boolean;
  private readonly extractObjects: boolean;
  private readonly extractGraphs: boolean;
  private readonly extractVocabIris: boolean;

  public constructor(args: IActorOptimizeQueryOperationSetSeedSourcesQuadpatternIrisArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeQueryOperation): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionOptimizeQueryOperation): Promise<IActorOptimizeQueryOperationOutput> {
    const contextSources: DataSources | undefined = action.context.get(KeysRdfResolveQuadPattern.sources);
    if (!contextSources || contextSources.length === 0) {
      const sources: string[] = [ ...new Set(this.extractIrisFromOperation(action.operation)) ];
      action.context = action.context.set(KeysRdfResolveQuadPattern.sources, sources);
    }
    return { ...action, context: action.context };
  }

  public extractIrisFromOperation(operation: Algebra.Operation): string[] {
    const iris: string[] = [];
    Util.recurseOperation(operation, {
      [Algebra.types.PATH]: path => {
        if (this.extractSubjects && path.subject.termType === 'NamedNode') {
          iris.push(path.subject.value);
        }
        // Predicates are ignored
        if (this.extractObjects && path.object.termType === 'NamedNode') {
          iris.push(path.object.value);
        }
        if (this.extractGraphs && path.graph.termType === 'NamedNode') {
          iris.push(path.graph.value);
        }
        return false;
      },
      [Algebra.types.PATTERN]: pattern => {
        if (this.extractSubjects && pattern.subject.termType === 'NamedNode') {
          iris.push(pattern.subject.value);
        }
        if (this.extractPredicates && pattern.predicate.termType === 'NamedNode') {
          iris.push(pattern.predicate.value);
        }
        if (this.extractObjects && pattern.object.termType === 'NamedNode' &&
          (this.extractVocabIris || pattern.predicate.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type')) {
          iris.push(pattern.object.value);
        }
        if (this.extractGraphs && pattern.graph.termType === 'NamedNode') {
          iris.push(pattern.graph.value);
        }
        return false;
      },
    });
    return iris;
  }
}

export interface IActorOptimizeQueryOperationSetSeedSourcesQuadpatternIrisArgs
  extends IActorArgs<IActionOptimizeQueryOperation, IActorTest, IActorOptimizeQueryOperationOutput> {
  /**
   * If IRIs should be extracted from subject positions.
   * @default {true}
   */
  extractSubjects: boolean;
  /**
   * If IRIs should be extracted from predicate positions.
   * @default {false}
   */
  extractPredicates: boolean;
  /**
   * If IRIs should be extracted from object positions.
   * @default {true}
   */
  extractObjects: boolean;
  /**
   * If IRIs should be extracted from graph positions.
   * @default {true}
   */
  extractGraphs: boolean;
  /**
   * If object IRIs should be extracted if the predicate is rdf:type.
   * @default {false}
   */
  extractVocabIris: boolean;
}
