 import { bindingsToString } from '@comunica/bindings-factory';
import type { IActorQueryOperationTypedMediatedArgs } from '@comunica/bus-query-operation';
import {
  ActorQueryOperation,
  ActorQueryOperationTypedMediated,
} from '@comunica/bus-query-operation';
import type { IActorTest } from '@comunica/core';
import type { Bindings, IActionContext, IQueryOperationResult } from '@comunica/types';
import type { Algebra } from 'sparqlalgebrajs';
import { AsyncEvaluator, isExpressionError } from 'sparqlee';
import { KeyFilterLinksTraversal } from '@comunica/context-entries-link-traversal';


/**
 * A [Query Operation](https://github.com/comunica/comunica/tree/master/packages/bus-query-operation) actor that handles filter operations in the context of links traversal
 */
/** 
export class ActorQueryOperationFilterLinksTraversal extends ActorQueryOperationTypedMediated<Algebra.Filter> {
  public constructor(args: IActorQueryOperationTypedMediatedArgs) {
    super(args, 'filter');
  }

  public async testOperation(operation: Algebra.Filter, context: IActionContext): Promise<IActorTest> {
    // Will throw error for unsupported operators
    const config = { ...ActorQueryOperation.getAsyncExpressionContext(context, this.mediatorQueryOperation) };
    const _ = new AsyncEvaluator(operation.expression, config);
    return context.has(KeyFilterLinksTraversal.zoneOfInterest)
  }

  public async runOperation(operation: Algebra.Filter, context: IActionContext):
  Promise<IQueryOperationResult> {
    
    return { type: 'bindings', bindingsStream, metadata }; // TODO: implement
  }
}
*/
