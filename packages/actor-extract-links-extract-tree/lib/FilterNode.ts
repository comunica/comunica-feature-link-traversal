import { BindingsFactory } from '@comunica/bindings-factory';
import { KeysInitQuery } from '@comunica/context-entries';
import type { Bindings, IActionContext } from '@comunica/types';
import type { ITreeRelation, ITreeNode } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import { AsyncEvaluator } from 'sparqlee';

const BF = new BindingsFactory();
/**
 * A comunica Link traversal optimizer that filter link of document
 * following the [TREE specification](https://treecg.github.io/specification/).
 * The actor apply the filter of a query into the TREE relation to determine if a
 * link should be follow or not
 */
export class FilterNode {
  public test(node: ITreeNode, context: IActionContext): boolean {
    if (!node.relation) {
      return false;
    }

    if (node.relation.length === 0) {
      return false;
    }

    const query: Algebra.Operation = context.get(KeysInitQuery.query)!;
    if (!FilterNode.doesNodeExist(query, Algebra.types.FILTER)) {
      return false;
    }

    return true;
  }

  public async run(node: ITreeNode, context: IActionContext): Promise<Map<string, boolean>> {
    const filterMap: Map<string, boolean> = new Map();

    if (!this.test(node, context)) {
      return new Map();
    }

    // Extract the filter expression
    const filterOperation: Algebra.Expression = (() => {
      const query: Algebra.Operation = context.get(KeysInitQuery.query)!;
      return query.input.expression;
    })();

    // Extract the bgp of the query
    const queryBody: RDF.Quad[] = FilterNode.findBgp(context.get(KeysInitQuery.query)!);
    if (queryBody.length === 0) {
      return new Map();
    }
    // Capture the relation from the input
    const relations: ITreeRelation[] = node.relation!;

    for (const relation of relations) {
      if (typeof relation.path === 'undefined' || typeof relation.value === 'undefined') {
        filterMap.set(relation.node, true);
        continue;
      }
      // Find the quad from the bgp that are related to the TREE relation
      const relevantQuads = FilterNode.findRelavantQuad(queryBody, relation.path.value);
      if (relevantQuads.length === 0) {
        filterMap.set(relation.node, true);
        continue;
      }

      // Create the binding in relation to the relevant quad
      const bindings = FilterNode.createBinding(relevantQuads, relation.value.quad);
      const filterExpression: Algebra.Operation = FilterNode.deleteUnrelevantFilter(filterOperation, bindings);
      if (filterExpression.args.length === 0) {
        filterMap.set(relation.node, true);
        continue;
      }
      const evaluator = new AsyncEvaluator(filterExpression);
      // Evaluate the filter with the relevant quad binding
      const result: boolean = await evaluator.evaluateAsEBV(bindings);
      filterMap.set(relation.node, result);
    }
    return filterMap;
  }

  /**
   *
   * @param queryBody
   * @param path
   * @returns RDF.Quad[]
   * find the quad that has as predicate a the TREE:path of a relation
   */
  private static findRelavantQuad(queryBody: RDF.Quad[], path: string): RDF.Quad[] {
    const resp: RDF.Quad[] = [];
    for (const quad of queryBody) {
      if (quad.predicate.value === path && quad.object.termType === 'Variable') {
        resp.push(quad);
      }
    }
    return resp;
  }

  /**
   * @param filterExpression
   * @param binding
   * @returns Algebra.Expression
   * delete the filters that are not related to TREE relation
   */
  private static deleteUnrelevantFilter(filterExpression: Algebra.Expression, binding: Bindings): Algebra.Expression {
    let newFilterExpression: Algebra.Expression = {
      expressionType: Algebra.expressionTypes.OPERATOR,
      operator: filterExpression.operator,
      type: Algebra.types.EXPRESSION,
      args: [],
    };

    if ('operator' in filterExpression.args[0]) {
      newFilterExpression.args = (<Algebra.Expression[]>filterExpression.args).filter(expression => {
        for (const arg of expression.args) {
          if ('term' in arg && arg.term.termType === 'Variable') {
            return binding.has(arg.term.value);
          }
        }
        return false;
      });
      if (newFilterExpression.args.length === 1) {
        newFilterExpression = newFilterExpression.args[0];
      }
    } else {
      for (const arg of (<Algebra.Expression[]>filterExpression.args)) {
        if ('term' in arg && arg.term.termType === 'Variable' && !binding.has(arg.term.value)) {
          newFilterExpression.args = [];
          break;
        }
        newFilterExpression.args.push(arg);
      }
    }
    return newFilterExpression;
  }

  /**
   *
   * @param relevantQuad
   * @param relationValue
   * @returns Bindings
   * create the binding from quad related to the TREE:path
   */
  private static createBinding(relevantQuad: RDF.Quad[], relationValue: RDF.Quad): Bindings {
    let binding: Bindings = BF.bindings();
    for (const quad of relevantQuad) {
      const object = quad.object.value;
      binding = binding.set(object, <RDF.Literal>relationValue.object);
    }
    return binding;
  }

  private static findBgp(query: Algebra.Operation): RDF.Quad[] {
    let currentNode = query.input;
    do {
      if (currentNode.type === Algebra.types.JOIN) {
        return this.formatBgp(currentNode.input);
      }
      if ('input' in currentNode) {
        currentNode = currentNode.input;
      }
    } while ('input' in currentNode);
    return [];
  }

  private static formatBgp(joins: any): RDF.Quad[] {
    const bgp: RDF.Quad[] = [];
    if (joins.length === 0) {
      return [];
    }
    if (!('input' in joins[0])) {
      return joins;
    }
    for (const join of joins) {
      bgp.push(join.input[0]);
    }
    return bgp;
  }

  private static doesNodeExist(query: Algebra.Operation, node: string): boolean {
    let currentNode = query;
    do {
      if (currentNode.type === node) {
        return true;
      }
      /* istanbul ignore next */
      if ('input' in currentNode) {
        currentNode = currentNode.input;
      }
      /* istanbul ignore next */
    } while ('input' in currentNode);
    return false;
  }
}
