import { BindingsFactory } from '@comunica/bindings-factory';
import { KeysInitQuery } from '@comunica/context-entries';
import type { IActionContext } from '@comunica/types';
import { Algebra, Factory as AlgebraFactory, Util } from 'sparqlalgebrajs';
import { isBooleanExpressionTreeRelationFilterSolvable } from './solver';
import type { Variable } from './solverInterfaces';
import type { ITreeRelation, ITreeNode } from './TreeMetadata';

const AF = new AlgebraFactory();
const BF = new BindingsFactory();

/**
 * A class to apply [SPAQL filters](https://www.w3.org/TR/sparql11-query/#evaluation)
 * to the [TREE specification](https://treecg.github.io/specification/).
 * It use [sparqlee](https://github.com/comunica/sparqlee) to evaluate the filter where
 * the binding are remplace by the [value of TREE relation](https://treecg.github.io/specification/#traversing).
 */
export class FilterNode {
  /**
   * Return the filter expression if the TREE node has relations
   * @param {ITreeNode} node - The current TREE node
   * @param {IActionContext} context - The context
   * @returns {Algebra.Expression | undefined} The filter expression or undefined if the TREE node has no relations
   */
  public getFilterExpressionIfTreeNodeHasConstraint(node: ITreeNode,
    context: IActionContext): Algebra.Expression | undefined {
    if (!node.relation) {
      return undefined;
    }

    if (node.relation.length === 0) {
      return undefined;
    }

    const query: Algebra.Operation = context.get(KeysInitQuery.query)!;
    const filterExpression = FilterNode.findNode(query, Algebra.types.FILTER);
    if (!filterExpression) {
      return undefined;
    }

    return filterExpression.expression;
  }

  /**
   * Analyze if the tree:relation(s) of a tree:Node should be followed and return a map
   * where if the value of the key representing the URL to follow is true than the link must be followed
   * if it is false then it should be ignored.
   * @param {ITreeNode} node - The current TREE node
   * @param {IActionContext} context - The context
   * @returns {Promise<Map<string, boolean>>} A map of the indicating if a tree:relation should be follow
   */
  public async run(node: ITreeNode, context: IActionContext): Promise<Map<string, boolean>> {
    const filterMap: Map<string, boolean> = new Map();

    const filterOperation: Algebra.Expression | undefined =
      this.getFilterExpressionIfTreeNodeHasConstraint(node, context);

    if (!filterOperation) {
      return new Map();
    }

    // Extract the bgp of the query.
    const queryBody: Algebra.Operation = context.get(KeysInitQuery.query)!;

    // Capture the relation from the function argument.
    const relations: ITreeRelation[] = node.relation!;

    for (const relation of relations) {
      // Accept the relation if the relation does't specify a condition.
      if (!relation.path || !relation.value) {
        filterMap.set(relation.node, true);
        continue;
      }
      // Find the quad from the bgp that are related to the TREE relation.
      const variables = FilterNode.findRelevantVariableFromBgp(queryBody, relation.path);

      // Accept the relation if no variable are linked with the relation.
      if (variables.length === 0) {
        filterMap.set(relation.node, true);
        continue;
      }
      let filtered = false;
      // For all the variable check if one is has a possible solutions.
      for (const variable of variables) {
        filtered = filtered || isBooleanExpressionTreeRelationFilterSolvable(
          { relation, filterExpression: filterOperation, variable },
        );
      }

      filterMap.set(relation.node, filtered);
    }
    return filterMap;
  }

  /**
   * Find the variables from the BGP that match the predicate defined by the TREE:path from a TREE relation.
   *  The subject can be anyting.
   * @param {Algebra.Operation} queryBody - the body of the query
   * @param {string} path - TREE path
   * @returns {Variable[]} the variables of the Quad objects that contain the TREE path as predicate
   */
  private static findRelevantVariableFromBgp(queryBody: Algebra.Operation, path: string): Variable[] {
    const resp: Variable[] = [];
    const addVariable = (quad: any): boolean => {
      if (quad.predicate.value === path && quad.object.termType === 'Variable') {
        resp.push(quad.object.value);
      }
      return true;
    };

    Util.recurseOperation(queryBody, {
      [Algebra.types.PATH]: addVariable,
      [Algebra.types.PATTERN]: addVariable,

    });
    return resp;
  }

  /**
   * Find the first node of type `nodeType`, if it doesn't exist
   * it return undefined.
   * @param {Algebra.Operation} query - the original query
   * @param {string} nodeType - the type of node requested
   * @returns {any}
   */
  private static findNode(query: Algebra.Operation, nodeType: string): any {
    let currentNode = query;
    do {
      if (currentNode.type === nodeType) {
        return currentNode;
      }
      if ('input' in currentNode) {
        currentNode = currentNode.input;
      }
    } while ('input' in currentNode);
    return undefined;
  }
}

