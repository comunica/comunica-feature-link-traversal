import type {
  IActorOptimizeLinkTraversalArgs,
  IActionOptimizeLinkTraversal,
  IActorOptimizeLinkTraversalOutput,
} from '@comunica/bus-optimize-link-traversal';
import { ActorOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import type { IActorTest } from '@comunica/core';
import type { LinkTraversalOptimizationLinkFilter, LinkTraversalFilterOperator } from '@comunica/types-link-traversal';
import { Algebra } from 'sparqlalgebrajs';
import { AsyncEvaluator, isExpressionError } from 'sparqlee';
import { Bindings } from '@comunica/types';
import { bindingsToString } from '@comunica/bindings-factory';


/**
 * A comunica Link traversal optimizer that filter link of document
 * following the [TREE specification](https://treecg.github.io/specification/)
 */

export class ActorOptimizeLinkTraversalFilterTreeLinks extends ActorOptimizeLinkTraversal {
  public constructor(args: IActorOptimizeLinkTraversalArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeLinkTraversal): Promise<IActorTest> {
    return this.findFilterOperation(action, true).length === 1;
  }

  public async run(action: IActionOptimizeLinkTraversal): Promise<IActorOptimizeLinkTraversalOutput> {
    const filters = this.findFilterOperation(action);
    const filterMap: Map<string, boolean> = new Map();
    for (const bindingsStream of action.decisionZoneBindingStream) {
      for (const filter of filters) {
        const evaluator = new AsyncEvaluator(filter.expression);

        const transform = async(item: Bindings, next: any, push: (bindings: Bindings) => void): Promise<void> => {
          try {
            const result = await evaluator.evaluateAsEBV(item);
            if (result) {
              push(item);
            }
          } catch (error: unknown) {
            // We ignore all Expression errors.
            // Other errors (likely programming mistakes) are still propagated.
            //
            // > Specifically, FILTERs eliminate any solutions that,
            // > when substituted into the expression, either result in
            // > an effective boolean value of false or produce an error.
            // > ...
            // > These errors have no effect outside of FILTER evaluation.
            // https://www.w3.org/TR/sparql11-query/#expressions
            if (isExpressionError(<Error> error)) {
              // In many cases, this is a user error, where the user should manually cast the variable to a string.
              // In order to help users debug this, we should report these errors via the logger as warnings.
              this.logWarn(action.context, 'Error occurred while filtering.', () => ({ error, bindings: bindingsToString(item) }));
            } else {
              bindingsStream.emit('error', error);
            }
          }
          next();
        };
        const result = bindingsStream.transform<Bindings>({ transform });
      }
    }

  }
  

 
  private findFilterOperation(action: IActionOptimizeLinkTraversal, oneResult=false): Algebra.Operation[]  {
    let nestedOperation = action.operations;
    const filters: Algebra.Operation[]  = []
    while ('input' in nestedOperation) {
      if (nestedOperation.type === Algebra.types.FILTER) {
        filters.push(nestedOperation);
        if (oneResult) {
          break;
        }
      }
      nestedOperation = nestedOperation.input;
    }
    return filters
  }

}

