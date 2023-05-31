import { BindingsFactory } from '@comunica/bindings-factory';
import { KeysInitQuery } from '@comunica/context-entries';
import type { IActionContext } from '@comunica/types';
import { Algebra, Factory as AlgebraFactory, Util } from 'sparqlalgebrajs';
import { SatisfactionChecker } from './solver';
import type { ISolverInput, Variable } from './solverInterfaces';
import type { ITreeRelation, ITreeNode } from './TreeMetadata';
import { SparlFilterExpressionSolverInput, TreeRelationSolverInput } from './SolverInput';

const AF = new AlgebraFactory();
const BF = new BindingsFactory();




  /**
   * Return the filter expression if the TREE node has relations
   * @param {ITreeNode} node - The current TREE node
   * @param {IActionContext} context - The context
   * @returns {Algebra.Expression | undefined} The filter expression or undefined if the TREE node has no relations
   */
  export function getFilterExpressionIfTreeNodeHasConstraint(node: ITreeNode,
    context: IActionContext): Algebra.Expression | undefined {
    if (!node.relation) {
      return undefined;
    }

    if (node.relation.length === 0) {
      return undefined;
    }

    const query: Algebra.Operation = context.get(KeysInitQuery.query)!;
    const filterExpression = findNode(query, Algebra.types.FILTER);
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
  export async function filterNode(node: ITreeNode, context: IActionContext, satisfactionChecker:SatisfactionChecker ): Promise<Map<string, boolean>> {
    const filterMap: Map<string, boolean> = new Map();

    const filterOperation: Algebra.Expression | undefined =
      getFilterExpressionIfTreeNodeHasConstraint(node, context);

    if (!filterOperation) {
      return new Map();
    }

    // Extract the bgp of the query.
    const queryBody: Algebra.Operation = context.get(KeysInitQuery.query)!;

    // Capture the relation from the function argument.
    const groupedRelations  = groupRelationByNode(node.relation!);

    //

    const calculatedFilterExpressions: Map<Variable, SparlFilterExpressionSolverInput> = new Map();
    for (const relations of groupedRelations) {
      // Accept the relation if the relation does't specify a condition.
      if (!relations[0].path || !relations[0].value) {
        filterMap.set(relations[0].node, true);
        continue;
      }
      // Find the quad from the bgp that are related to the TREE relation.
      const variables = findRelevantVariableFromBgp(queryBody, relations[0].path);

      // Accept the relation if no variable are linked with the relation.
      if (variables.length === 0) {
        filterMap.set(relations[0].node, true);
        continue;
      }
      let filtered = false;
      // For all the variable check if one is has a possible solutions.
      for (const variable of variables) {
        let inputFilterExpression = calculatedFilterExpressions.get(variable);
        if(!inputFilterExpression){
          inputFilterExpression = new SparlFilterExpressionSolverInput(
            structuredClone(filterOperation),
            variable);
        }
        const inputs:ISolverInput[] = relations.map((relation)=> new TreeRelationSolverInput(relation, variable));
        inputs.push(inputFilterExpression);
        filtered = filtered || satisfactionChecker(inputs)
      }
      let previousFilterValue = filterMap.get(relations[0].node);
      if(!previousFilterValue){
        filterMap.set(relations[0].node, filtered);
      }else{
        filterMap.set(relations[0].node, filtered || previousFilterValue);

      }
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
   export function findRelevantVariableFromBgp(queryBody: Algebra.Operation, path: string): Variable[] {
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

  function groupRelationByNode(relations: ITreeRelation[]):  ITreeRelation[][]{
    const collector:Map<string, Map<string, ITreeRelation[]>> = new Map();
    const resp:ITreeRelation[][] = [];
    for (const relation of relations){
      const path = relation.path!== undefined?relation.path:'';
      const nodeGroup = collector.get(relation.node);
      if(nodeGroup){
        const pathGroup = nodeGroup.get(path);
        if(pathGroup){
          pathGroup.push(relation);
        }else{
          nodeGroup.set(path, [relation]);
        }
      }else{
        collector.set(relation.node, new Map([[path, [relation]]]));
      }
    }

    for (const [_, pathGroup] of collector){
      for(const [_, relations] of pathGroup){
        resp.push(relations);
      }
    }
    return resp;
  }

  /**
   * Find the first node of type `nodeType`, if it doesn't exist
   * it return undefined.
   * @param {Algebra.Operation} query - the original query
   * @param {string} nodeType - the type of node requested
   * @returns {any}
   */
  function findNode(query: Algebra.Operation, nodeType: string): any {
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


