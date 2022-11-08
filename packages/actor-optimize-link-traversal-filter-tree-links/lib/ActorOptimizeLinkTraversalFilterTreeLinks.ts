import { BindingsFactory } from '@comunica/bindings-factory';
import type {
  IActorOptimizeLinkTraversalArgs,
  IActionOptimizeLinkTraversal,
  IActorOptimizeLinkTraversalOutput,
} from '@comunica/bus-optimize-link-traversal';
import { ActorOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import { KeysInitQuery } from '@comunica/context-entries';
import type { IActorTest } from '@comunica/core';
import type { Bindings } from '@comunica/types';
import type { IRelation } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { stringToTerm } from 'rdf-string';
import { Algebra } from 'sparqlalgebrajs';
import { AsyncEvaluator } from 'sparqlee';

/**
 * A comunica Link traversal optimizer that filter link of document
 * following the [TREE specification](https://treecg.github.io/specification/)
 */

export class ActorOptimizeLinkTraversalFilterTreeLinks extends ActorOptimizeLinkTraversal {
  public constructor(args: IActorOptimizeLinkTraversalArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeLinkTraversal): Promise<IActorTest> {
    const query: Algebra.Operation = action.context.get(KeysInitQuery.query)!;
    const relations: IRelation[] = (() => {
      if (typeof action.treeMetadata !== 'undefined') {
        return typeof action.treeMetadata.relation !== 'undefined' ? action.treeMetadata.relation : [];
      }
      return [];
    })();
    const filterExist: boolean = this.doesNodeExist(query, Algebra.types.FILTER);
    return filterExist && relations.length > 0 ?
      Promise.resolve(true) :
      Promise.reject(new Error(
        'the action must contain TREE relation and the query must contain at least a filter',
      ));
  }

  public async run(action: IActionOptimizeLinkTraversal): Promise<IActorOptimizeLinkTraversalOutput> {
    const filterMap: Map<string, boolean> = new Map();
    const filterOperation: Algebra.Expression = JSON.parse(JSON.stringify(action.context.get(KeysInitQuery.query)))
      .input.expression;
    const queryBody: RDF.Quad[] = this.findBgp(action.context.get(KeysInitQuery.query)!);
    if (queryBody.length === 0) {
      return { filters: filterMap };
    }
    const relations: IRelation[] = (() => {
      if (typeof action.treeMetadata !== 'undefined') {
        // If the test pass the relation are defined, it's for the lint
        /* istanbul ignore next */
        return typeof action.treeMetadata.relation !== 'undefined' ? action.treeMetadata.relation : [];
        /* istanbul ignore next */
      }
      return [];
    })();
    for (const relation of relations) {
      if (typeof relation.path === 'undefined' || typeof relation.value === 'undefined') {
        filterMap.set(relation.node, true);
        continue;
      }
      const relevantQuads = this.findRelavantQuad(queryBody, relation.path.value);
      if (relevantQuads.length === 0) {
        filterMap.set(relation.node, true);
        continue;
      }
      const bindings = this.createBinding(relevantQuads, relation.value.quad);
      const filterExpression: Algebra.Operation = this.deleteUnrelevantFilter(filterOperation, bindings);
      if (filterExpression.args.length === 0) {
        filterMap.set(relation.node, true);
        continue;
      }
      const evaluator = new AsyncEvaluator(filterExpression);
      const result: boolean = await evaluator.evaluateAsEBV(bindings);
      filterMap.set(relation.node, result);
    }
    return { filters: filterMap };
  }

  private findRelavantQuad(queryBody: RDF.Quad[], path: string): RDF.Quad[] {
    const resp: RDF.Quad[] = [];
    for (const quad of queryBody) {
      if (quad.predicate.value === path && quad.object.termType === 'Variable') {
        resp.push(quad);
      }
    }
    return resp;
  }

  private deleteUnrelevantFilter(filterExpression: Algebra.Expression, binding: Bindings): Algebra.Expression {
    if ('operator' in filterExpression.args[0]) {
      filterExpression.args = (<Algebra.Expression[]>filterExpression.args).filter(expression => {
        for (const arg of expression.args) {
          if ('term' in arg && arg.term.termType === 'Variable') {
            return binding.has(arg.term.value);
          }
        }
        return false;
      });
      if (filterExpression.args.length === 1) {
        filterExpression = filterExpression.args[0];
      }
    } else {
      for (const arg of (<Algebra.Expression[]>filterExpression.args)) {
        if ('term' in arg && arg.term.termType === 'Variable' && !binding.has(arg.term.value)) {
          filterExpression.args = [];
          break;
        }
      }
    }
    return filterExpression;
  }

  private createBinding(relevantQuad: RDF.Quad[], relationValue: RDF.Quad): Bindings {
    let binding: Bindings = new BindingsFactory().bindings();
    for (const quad of relevantQuad) {
      const object = quad.object.value;
      const value =
        `"${relationValue.object.value}"^^${(<RDF.Literal>relationValue.object).datatype.value}`;
      binding = binding.set(object, stringToTerm(value));
    }
    return binding;
  }

  private findBgp(query: Algebra.Operation): RDF.Quad[] {
    let currentNode = query.input;
    do {
      if (currentNode.type === 'join') {
        return this.formatBgp(currentNode.input);
      }
      if ('input' in currentNode) {
        currentNode = currentNode.input;
      }
    } while ('input' in currentNode);
    return [];
  }

  private formatBgp(joins: any): RDF.Quad[] {
    const bgp: RDF.Quad[] = [];
    if (!('input' in joins[0])) {
      return joins;
    }
    for (const join of joins) {
      bgp.push(join.input[0]);
    }
    return bgp;
  }

  private doesNodeExist(query: Algebra.Operation, node: string): boolean {
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

