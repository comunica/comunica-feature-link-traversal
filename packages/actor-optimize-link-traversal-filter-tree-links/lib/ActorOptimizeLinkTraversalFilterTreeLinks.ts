import type {
  IActorOptimizeLinkTraversalArgs,
  IActionOptimizeLinkTraversal,
  IActorOptimizeLinkTraversalOutput,
} from '@comunica/bus-optimize-link-traversal';
import { ActorOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import type { IActorTest } from '@comunica/core';
import type { LinkTraversalOptimizationLinkFilter, LinkTraversalFilterOperator } from '@comunica/types-link-traversal';
import { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Link traversal optimizer that filter link of document
 * following the [TREE specification](https://treecg.github.io/specification/)
 */

export class ActorOptimizeLinkTraversalFilterTreeLinks extends ActorOptimizeLinkTraversal {
  private static readonly dateTimeDataType = 'http://www.w3.org/2001/XMLSchema#dateTime';
  public constructor(args: IActorOptimizeLinkTraversalArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeLinkTraversal): Promise<IActorTest> {
    return typeof this.findFilterOperation(action) !== 'undefined';
  }

  public async run(action: IActionOptimizeLinkTraversal): Promise<IActorOptimizeLinkTraversalOutput> {
    const filter = this.findFilterOperation(action)!;
    const operator = filter.expression.operator;
    const target = filter.expression.args[0].term.value;
    const value = filter.expression.args[1].term.value;
    const valueDatatype = filter.expression.args[1].term.datatype.value;

    const filterFunction = this.selectFilters(
      valueDatatype,
      operator,
      target,
      value,
    );
    if (typeof filterFunction === 'undefined') {
      return { filters: new Map() };
    }

    return { filters: new Map([[ target, [ filterFunction ]]]) };
  }

  private selectFilters(
    valueDatatype: string,
    operatorFilter: any,
    target: any,
    valueFilter: any,
  ): LinkTraversalOptimizationLinkFilter | undefined {
    switch (valueDatatype) {
      case ActorOptimizeLinkTraversalFilterTreeLinks.dateTimeDataType: {
        return this.timeFilter(operatorFilter, target, valueFilter);
      }
    }
    return undefined;
  }

  private timeFilter(operatorFilter: any, target: any, valueFilter: any):
  LinkTraversalOptimizationLinkFilter | undefined {
    return this.generateFilterFunction(operatorFilter,
      target,
      valueFilter,
      (variable: any) => new Date(variable).getTime());
  }

  private findFilterOperation(action: IActionOptimizeLinkTraversal): Algebra.Operation | undefined {
    let nestedOperation = action.operations;
    while ('input' in nestedOperation) {
      if (nestedOperation.type === Algebra.types.FILTER) {
        return nestedOperation;
      }
      nestedOperation = nestedOperation.input;
    }
    return undefined;
  }

  private generateFilterFunction(operatorFilter: any,
    target: any,
    valueFilter: any,
    modifierFunction: any): LinkTraversalOptimizationLinkFilter | undefined {
    switch (operatorFilter) {
      case '>': {
        return (_subject: string,
          value: any,
          _operator: LinkTraversalFilterOperator) => modifierFunction(value) > modifierFunction(valueFilter);
      }
      case '<': {
        return (_subject: string,
          value: any,
          _operator: LinkTraversalFilterOperator) => modifierFunction(value) < modifierFunction(valueFilter);
      }
      case '<=': {
        return (_subject: string,
          value: any,
          _operator: LinkTraversalFilterOperator) => modifierFunction(value) <= modifierFunction(valueFilter);
      }
      case '>=': {
        return (_subject: string,
          value: any,
          _operator: LinkTraversalFilterOperator) => modifierFunction(value) >= modifierFunction(valueFilter);
      }
      case '==': {
        return (_subject: string,
          value: any,
          _operator: LinkTraversalFilterOperator) => modifierFunction(value) === modifierFunction(valueFilter);
      }
    }
  }
}

