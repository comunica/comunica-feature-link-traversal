import { InvalidExpressionSystem, MissMatchVariableError } from './error';
import { And } from './LogicOperator';
import type { SolutionDomain } from './SolutionDomain';
import type { SolutionInterval } from './SolutionInterval';
import type { ISolverInput } from './solverInterfaces';

const AND = new And();
export type SatisfactionChecker = (inputs: ISolverInput[]) => boolean;
/**
 * Check if it is possible to satify the combination of the boolean expression of the TREE relations
 * and the SPARQL filter. Will Throw if there is no or more than one SPARQL filter which is identify
 * with the ResolvedType Domain
 * @param {ISolverInput[]} inputs - The solver input, must countain one ResolvedType Domain
 * @returns {boolean} Whether the expression can be satify
 */
export function isBooleanExpressionTreeRelationFilterSolvable(inputs: ISolverInput[]): boolean {
  let domain: SolutionDomain | undefined;
  const intervals: (SolutionInterval | [SolutionInterval, SolutionInterval])[] = [];
  if (inputs.length === 0) {
    return true;
  }
  const variable = inputs[0].variable;

  for (const input of inputs) {
    if (variable !== input.variable) {
      throw new MissMatchVariableError('the variable are not matching');
    }

    if ('getDomain' in input.domain && domain !== undefined) {
      throw new InvalidExpressionSystem('there is more than one filter expression');
    } else if ('getDomain' in input.domain) {
      domain = input.domain;
    } else {
      intervals.push(input.domain);
    }
  }

  if (!domain) {
    throw new InvalidExpressionSystem('there should be a filter expression');
  }

  if (intervals.length === 0) {
    throw new InvalidExpressionSystem('there should be at least one TREE relation to resolved');
  }

  for (const interval of intervals) {
    domain = AND.apply({ interval, domain });
  }

  return !domain.isDomainEmpty();
}
