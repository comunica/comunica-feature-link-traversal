import { BindingsFactory } from '@comunica/bindings-factory';
import { KeysInitQuery } from '@comunica/context-entries';
import type { Bindings, IActionContext } from '@comunica/types';
import type { ITreeRelation, ITreeNode } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { Algebra, Factory as AlgebraFactory } from 'sparqlalgebrajs';
import { AsyncEvaluator } from 'sparqlee';

const AF = new AlgebraFactory();
const BF = new BindingsFactory();

/**
 * A class to apply [SPAQL filters](https://www.w3.org/TR/sparql11-query/#evaluation)
 * to the [TREE specification](https://treecg.github.io/specification/).
 * It use [sparqlee](https://github.com/comunica/sparqlee) to evaluate the filter where
 * the binding are remplace by the [value of TREE relation](https://treecg.github.io/specification/#traversing)
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
    if (!FilterNode.findNode(query, Algebra.types.FILTER)) {
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
      return FilterNode.findNode(query, Algebra.types.FILTER).expression;
    })();

    // Extract the bgp of the query
    const queryBody: RDF.Quad[] = FilterNode.findBgp(context.get(KeysInitQuery.query)!);
    if (queryBody.length === 0) {
      return new Map();
    }
    // Capture the relation from the function argument
    const relations: ITreeRelation[] = node.relation!;

    for (const relation of relations) {
      // Accept the relation if the relation does't specify a condition
      if (typeof relation.path === 'undefined' || typeof relation.value === 'undefined') {
        filterMap.set(relation.node, true);
        continue;
      }
      // Find the quad from the bgp that are related to the TREE relation
      const relevantQuads = FilterNode.findRelevantQuad(queryBody, relation.path.value);

      // Accept the relation if no quad are linked with the relation
      if (relevantQuads.length === 0) {
        filterMap.set(relation.node, true);
        continue;
      }

      // Create the binding from the relevant quad in association with the TREE relation
      const bindings = FilterNode.createBinding(relevantQuads, relation.value.quad);
      const filterExpression: Algebra.Operation = FilterNode.generateTreeRelationFilter(filterOperation, bindings);

      // Accept the relation if no filter are associated with the relation
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
   * Find the quad that match the predicate defined by the TREE:path from a TREE relation.
   *  The subject can be anyting.
   * @param {RDF.Quad[]} queryBody - the body of the query
   * @param {string} path - TREE path
   * @returns {RDF.Quad[]} the quad that contain the TREE path as predicate and a variable as object
   */
  private static findRelevantQuad(queryBody: RDF.Quad[], path: string): RDF.Quad[] {
    const resp: RDF.Quad[] = [];
    for (const quad of queryBody) {
      if (quad.predicate.value === path && quad.object.termType === 'Variable') {
        resp.push(quad);
      }
    }
    return resp;
  }

  /**
   * Delete the filters that are not related to the TREE relation
   * @param {Algebra.Expression} filterExpression - the expression of the filter taken from the original query
   * @param {Bindings} binding - binding that the resulting filter should contain
   * @returns {Algebra.Expression} the resulting filter expression contain only filter related to the TREE relation
   */
  private static generateTreeRelationFilter(filterExpression: Algebra.Expression,
    binding: Bindings): Algebra.Expression {
    // Generate an empty filter algebra
    let newFilterExpression: Algebra.Expression = AF.createOperatorExpression(filterExpression.operator, []);

    // Check if there is one filter or multiple
    if ('operator' in filterExpression.args[0]) {
      // Add the argument into the empty the new filter
      newFilterExpression.args = (<Algebra.Expression[]>filterExpression.args).filter(expression => {
        for (const arg of expression.args) {
          if ('term' in arg && arg.term.termType === 'Variable') {
            // Check if the argument of the filter is present into the binding
            return binding.has(arg.term.value);
          }
        }
        return false;
      });

      // If the filter has now a size of 1 change the form to respect the algebra specification
      if (newFilterExpression.args.length === 1) {
        newFilterExpression = newFilterExpression.args[0];
      }
    } else {
      // Add the argument into the empty the new filter
      for (const arg of (<Algebra.Expression[]>filterExpression.args)) {
        // Check if the argument of the filter is present into the binding
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
   * Create the binding from quad related to the TREE:path that will be used with sparqlee
   * for filtering of relation
   * @param {RDF.Quad[]} relevantQuad - the quads related to the TREE relation
   * @param {RDF.Quad} relationValue - the quad related to the TREE path
   * @returns {Bindings} the resulting binding
   */
  private static createBinding(relevantQuad: RDF.Quad[], relationValue: RDF.Quad): Bindings {
    let binding: Bindings = BF.bindings();
    for (const quad of relevantQuad) {
      const object = quad.object.value;
      binding = binding.set(object, relationValue.object);
    }
    return binding;
  }

  /**
 * Find the bgp of the original query of the user
 * @param {Algebra.Operation} query - the original query
 * @returns { RDF.Quad[]} the bgp of the query
 */
  private static findBgp(query: Algebra.Operation): RDF.Quad[] {
    let currentNode: any = query;
    let bgp: RDF.Quad[] = [];
    do {
      if (currentNode.type === Algebra.types.JOIN) {
        const currentBgp = this.formatBgp(currentNode.input);
        bgp = this.appendBgp(bgp, currentBgp);
      } else if (currentNode.type === Algebra.types.CONSTRUCT &&
        'template' in currentNode) {
        // When it's a contruct query the where state
        const currentBgp = this.formatBgp(currentNode.template);
        bgp = this.appendBgp(bgp, currentBgp);
      }

      if ('input' in currentNode) {
        currentNode = currentNode.input;
      }
      // If the node is an array
      if (Array.isArray(currentNode)) {
        for (const node of currentNode) {
          if ('input' in node) {
            currentNode = node.input;
            break;
          }
        }
      }
    } while ('input' in currentNode);
    return bgp;
  }

  /**
   * Format the section of the algebra graph contain a part of the bgp into an array of quad
   * @param {any} joins - the join operation containing a part of the bgp
   * @returns {RDF.Quad[]} the bgp in the form of an array of quad
   */
  private static formatBgp(joins: any): RDF.Quad[] {
    const bgp = [];
    if (joins.length === 0) {
      return [];
    }
    for (const join of joins) {
      if (!('input' in join)) {
        bgp.push(join);
      }
    }
    return bgp;
  }

  /**
   * Append the bgp of the query
   * @param {RDF.Quad[]} bgp - the whole bgp
   * @param {RDF.Quad[]} currentBgp - the bgp collected in the current node
   * @returns {RDF.Quad[]} the bgp updated
   */
  private static appendBgp(bgp: RDF.Quad[], currentBgp: RDF.Quad[]): RDF.Quad[] {
    if (Array.isArray(currentBgp)) {
      bgp = bgp.concat(currentBgp);
    }
    return bgp;
  }

  /**
   * Find the first node of type `nodeType`, if it doesn't exist
   * it return undefined
   * @param {Algebra.Operation} query - the original query
   * @param {string} nodeType - the tyoe of node requested
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
