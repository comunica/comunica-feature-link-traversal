import type { IActionContextPreprocess, IActorContextPreprocessOutput } from '@comunica/bus-context-preprocess';
import { ActorContextPreprocess } from '@comunica/bus-context-preprocess';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { Util, Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Set Seed Sources Quadpattern IRIs Context Preprocess Actor.
 */
export class ActorContextPreprocessSetSeedSourcesQuadpatternIris extends ActorContextPreprocess {
  private readonly extractSubjects: boolean;
  private readonly extractPredicates: boolean;
  private readonly extractObjects: boolean;
  private readonly extractGraphs: boolean;
  private readonly extractVocabIris: boolean;

  public constructor(args: IActorContextPreprocessSetSeedSourcesQuadpatternIrisArgs) {
    super(args);
  }

  public async test(action: IActionContextPreprocess): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionContextPreprocess): Promise<IActorContextPreprocessOutput> {
    if (action.operation && action.context &&
      (!action.context.has(KeysRdfResolveQuadPattern.sources) ||
        action.context.get(KeysRdfResolveQuadPattern.sources).length === 0)) {
      const sources: string[] = [ ...new Set(this.extractIrisFromOperation(action.operation)) ];
      action.context = action.context.set(KeysRdfResolveQuadPattern.sources, sources);
    }
    return { context: action.context };
  }

  public extractIrisFromOperation(operation: Algebra.Operation): string[] {
    const iris: string[] = [];
    Util.recurseOperation(operation, {
      [Algebra.types.PATH]: op => {
        const path: Algebra.Path = <Algebra.Path> op;
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
      [Algebra.types.PATTERN]: op => {
        const pattern: Algebra.Pattern = <Algebra.Pattern> op;
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

export interface IActorContextPreprocessSetSeedSourcesQuadpatternIrisArgs
  extends IActorArgs<IActionContextPreprocess, IActorTest, IActorContextPreprocessOutput> {
  extractSubjects: boolean;
  extractPredicates: boolean;
  extractObjects: boolean;
  extractGraphs: boolean;
  extractVocabIris: boolean;
}
