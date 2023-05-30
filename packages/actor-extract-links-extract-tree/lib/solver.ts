import { Algebra } from 'sparqlalgebrajs';
import { And,} from './LogicOperator';
import { SolutionDomain } from './SolutionDomain';
import type { Variable  } from './solverInterfaces';
import type { ITreeRelation } from './TreeMetadata';
import type {ISolverInput} from './solverInterfaces';

export type SatisfactionChecker = (inputs: ISolverInput[]) => boolean;
/**
 * Check if the solution domain of a system of equation compose of the expressions of the filter
 * expression and the relation is not empty.
 * @param {ITreeRelation} relation - The tree:relation that we wish to determine if there is a possible solution
 * when we combine it with a filter expression.
 * @param  {Algebra.Expression} filterExpression - The Algebra expression of the filter.
 * @param {variable} variable - The variable to be resolved.
 * @returns {boolean} Return true if the domain
 */
export function isBooleanExpressionTreeRelationFilterSolvable(inputs: ISolverInput[]): boolean {
  return true;
}



