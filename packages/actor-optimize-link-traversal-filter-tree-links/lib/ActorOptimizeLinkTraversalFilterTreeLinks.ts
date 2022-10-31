import type {
  IActorOptimizeLinkTraversalArgs,
  IActionOptimizeLinkTraversal,
  IActorOptimizeLinkTraversalOutput,
} from '@comunica/bus-optimize-link-traversal';
import { ActorOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import type { IActorTest } from '@comunica/core';
import { Algebra } from 'sparqlalgebrajs';
import { AsyncEvaluator, isExpressionError } from 'sparqlee';
import { Bindings } from '@comunica/types';
import { BindingsFactory } from '@comunica/bindings-factory';
import { KeysInitQuery } from '@comunica/context-entries';
import { IRelation } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { stringToTerm } from "rdf-string";
import { Literal } from 'rdf-data-factory';

/**
 * A comunica Link traversal optimizer that filter link of document
 * following the [TREE specification](https://treecg.github.io/specification/)
 */

export class ActorOptimizeLinkTraversalFilterTreeLinks extends ActorOptimizeLinkTraversal {
  public constructor(args: IActorOptimizeLinkTraversalArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeLinkTraversal): Promise<IActorTest> {
    const query = <Algebra.Operation>action.context.get(KeysInitQuery.query);
    const relations: IRelation[] = typeof action.treeMetadata !== 'undefined'? 
    (typeof action.treeMetadata.relation !== 'undefined'? action.treeMetadata.relation:[]):[]

    return query.type === Algebra.types.FILTER && relations.length !== 0;
  }

  public async run(action: IActionOptimizeLinkTraversal): Promise<IActorOptimizeLinkTraversalOutput> {
    const filterMap: Map<IRelation, boolean> = new Map();

    const filterExpression = (<Algebra.Operation> action.context.get(KeysInitQuery.query)).input.expression;
    const queryBody =  (<Algebra.Operation> action.context.get(KeysInitQuery.query)).input.input.input;
    const relations: IRelation[] = <IRelation[]> action.treeMetadata?.relation;

    for (const relation of relations ) {
      if (typeof relation.path !== 'undefined' && typeof relation.value !== 'undefined') {
        const evaluator = new AsyncEvaluator(filterExpression);
        const relevantQuads = this.findRelavantQuad(queryBody, relation.path.value);
        const bindings = this.createBinding(relevantQuads, relation.value.quad);
        const result: boolean = await evaluator.evaluateAsEBV(bindings);
        filterMap.set(relation, result);     
      }
    }
    return { filters: filterMap };
  }

  private findRelavantQuad(queryBody: RDF.Quad[], path: string): RDF.Quad[] {
    const resp: RDF.Quad[] = [];
    for (const quad of queryBody) {
      if( quad.predicate.value === path && quad.object.termType ==='Variable'){
        resp.push(quad);
      }
    }
    return resp;
  }

  private createBinding(relevantQuad: RDF.Quad[], relationValue: RDF.Quad): Bindings {
    let binding: Bindings = new BindingsFactory().bindings();
    for (const quad of relevantQuad ) {
      const object = quad.object.value;
      const value:string = relationValue.object.termType ==='Literal'?
      ((<RDF.Literal>relationValue.object).datatype.value !== ''?
       `${relationValue.object.value}^^${(<RDF.Literal>relationValue.object).datatype.value}`:relationValue.object.value):
       relationValue.object.value;

       binding = binding.set(`?${object}`, stringToTerm(value));
      
    }
    return binding;
  }
}

