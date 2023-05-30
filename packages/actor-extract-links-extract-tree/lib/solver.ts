import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import {
  MissMatchVariableError,
  MisformatedFilterTermError,
  UnsupportedDataTypeError,
} from './error';
import type { LogicOperator } from './LogicOperator';
import { And, Or, operatorFactory } from './LogicOperator';
import { SolutionDomain } from './SolutionDomain';
import { SolutionInterval } from './SolutionInterval';
import {
  SparqlOperandDataTypes,
  LogicOperatorReversed, LogicOperatorSymbol, SparqlOperandDataTypesReversed,
} from './solverInterfaces';
import type {
  ISolverExpression,
  Variable,
} from './solverInterfaces';
import { SparqlRelationOperator } from './TreeMetadata';
import type { ITreeRelation } from './TreeMetadata';
import {convertTreeRelationToSolverExpression,
   castSparqlRdfTermIntoNumber,
   filterOperatorToSparqlRelationOperator,
   getSolutionInterval,
   inverseFilter
  } from './util-solver';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

const A_TRUE_EXPRESSION: SolutionInterval = new SolutionInterval(
  [ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ],
);
const A_FALSE_EXPRESSION: SolutionInterval = new SolutionInterval([]);

/**
 * Check if the solution domain of a system of equation compose of the expressions of the filter
 * expression and the relation is not empty.
 * @param {ITreeRelation} relation - The tree:relation that we wish to determine if there is a possible solution
 * when we combine it with a filter expression.
 * @param  {Algebra.Expression} filterExpression - The Algebra expression of the filter.
 * @param {variable} variable - The variable to be resolved.
 * @returns {boolean} Return true if the domain
 */
export function isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable }: {
  relation: ITreeRelation;
  filterExpression: Algebra.Expression;
  variable: Variable;
}): boolean {
  const relationsolverExpressions = convertTreeRelationToSolverExpression(relation, variable);
  // The relation doesn't have a value or a type, so we accept it
  if (!relationsolverExpressions) {
    return true;
  }

  const relationSolutionInterval = getSolutionInterval(
    relationsolverExpressions.valueAsNumber,
    relationsolverExpressions.operator,
  );
  // We don't prune the relation because we do not implement yet the solution range for this expression
  if (!relationSolutionInterval) {
    return true;
  }
  let solutionDomain: SolutionDomain = new SolutionDomain();
  try {
    solutionDomain = recursifResolve(
      filterExpression,
      variable,
    );
  } catch (error: unknown) {
    // A filter term was missformed we let the query engine return an error to the user and by precaution
    // we accept the link in case the error is from the solver and not the filter expression
    if (error instanceof MisformatedFilterTermError) {
      return true;
    }

    // We don't support the data type so let need to explore that link to not diminush the completness of the result
    if (error instanceof UnsupportedDataTypeError) {
      return true;
    }

    /* istanbul ignore next */
    // If it's unexpected error we throw it
    throw error;
  }

  // If the filter expression is false on it's own then it's impossible to find anything.
  // POSSIBLE OPTIMIZATION: reused solution domain of the filter when appropriate.
  if (solutionDomain.isDomainEmpty()) {
    return false;
  }

  // Evaluate the solution domain when adding the relation
  solutionDomain = new And().apply({ interval: relationSolutionInterval, domain: solutionDomain });

  // If there is a possible solution we don't filter the link
  return !solutionDomain.isDomainEmpty();
}

/**
 * From an Algebra expression return an solver expression if possible
 * @param {Algebra.Expression} expression - Algebra expression containing the a variable and a litteral.
 * @param {SparqlRelationOperator} operator - The SPARQL operator defining the expression.
 * @param {Variable} variable - The variable the expression should have to be part of a system of equation.
 * @returns {ISolverExpression | undefined} Return a solver expression if possible
 */
export function resolveAFilterTerm(expression: Algebra.Expression,
  operator: SparqlRelationOperator,
  variable: Variable):
  ISolverExpression | Error {
  let rawValue: string | undefined;
  let valueType: SparqlOperandDataTypes | undefined;
  let valueAsNumber: number | undefined;
  let hasVariable = false;

  // Find the constituant element of the solver expression
  for (const arg of expression.args) {
    if ('term' in arg && arg.term.termType === 'Variable') {
      // Check if the expression has the same variable as the one the solver try to resolved
      if (arg.term.value !== variable) {
        return new MissMatchVariableError(`the variable ${arg.term.value} is in the filter whereas we are looking for the varibale ${variable}`);
      }
      hasVariable = true;
    } else if ('term' in arg && arg.term.termType === 'Literal') {
      rawValue = arg.term.value;
      valueType = SparqlOperandDataTypesReversed.get(arg.term.datatype.value);
      if (valueType) {
        valueAsNumber = castSparqlRdfTermIntoNumber(rawValue!, valueType);
        if (!valueAsNumber) {
          return new UnsupportedDataTypeError(`we do not support the datatype "${valueType}" in the solver for the moment`);
        }
      } else {
        return new UnsupportedDataTypeError(`The datatype "${valueType}" is not supported by the SPARQL 1.1 Query Language W3C recommandation`);
      }
    }
  }
  // Return if a fully form solver expression can be created
  if (hasVariable && rawValue && valueType && valueAsNumber) {
    return {
      variable,
      rawValue,
      valueType,
      valueAsNumber,
      operator,
    };
  }
  const missingTerm = [];
  if (!hasVariable) {
    missingTerm.push('Variable');
  }
  if (!rawValue) {
    missingTerm.push('Litteral');
  }

  return new MisformatedFilterTermError(`the filter expressions doesn't have the term ${missingTerm.toString()}`);
}

/**
 * Recursively traverse the filter expression and calculate the domain until it get to the current expression.
 * It will thrown an error if the expression is badly formated or if it's impossible to get the solution range.
 * @param {Algebra.Expression} filterExpression - The current filter expression that we are traversing
 * @param {SolutionDomain} domain - The current resultant solution domain
 * @param {LogicOperatorSymbol} logicOperator - The current logic operator that we have to apply to the boolean expression
 * @param {Variable} variable - The variable targeted inside the filter expression
 * @param {boolean} notExpression
 * @returns {SolutionDomain} The solution domain of the whole expression
 */
export function recursifResolve(
  filterExpression: Algebra.Expression,
  variable: Variable,
  domain: SolutionDomain = new SolutionDomain(),
  logicOperator: LogicOperator = new Or(),
): SolutionDomain {
  if (filterExpression.expressionType === Algebra.expressionTypes.TERM
  ) {
    // In that case we are confronted with a boolean expression
    // add the associated interval into the domain in relation to
    // the logic operator.
    if (filterExpression.term.value === 'false') {
      domain = logicOperator.apply({ interval: A_FALSE_EXPRESSION, domain });
    } else {
      domain = logicOperator.apply({ interval: A_TRUE_EXPRESSION, domain });
    } 
  } else if (
    // If it's an array of terms then we should be able to create a solver expression.
    // Given the resulting solver expression we can calculate a solution interval
    // that we will add to the domain with regards to the logic operator.
    filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM &&
    filterExpression.args.length === 2
  ) {
    const rawOperator = filterExpression.operator;
    const operator = filterOperatorToSparqlRelationOperator(rawOperator);
    if (operator && logicOperator.operatorName() != LogicOperatorSymbol.Not) {
      const solverExpression = resolveAFilterTerm(filterExpression, operator, variable);
      let solutionInterval: SolutionInterval | [SolutionInterval, SolutionInterval] | undefined;
      if (solverExpression instanceof MissMatchVariableError) {
        solutionInterval = A_TRUE_EXPRESSION;
      } else if (solverExpression instanceof Error) {
        throw solverExpression;
      } else {
        solutionInterval = getSolutionInterval(solverExpression.valueAsNumber, solverExpression.operator);
        if (!solutionInterval) {
          throw new TypeError('The operator is not supported');
        }
      }
      domain = logicOperator.apply({ interval: solutionInterval, domain });
    }
  } else {
    // In that case we are traversing the filter expression TREE.
    // We prepare the next recursion and we compute the accumulation of results.
    const logicOperatorSymbol = LogicOperatorReversed.get(filterExpression.operator);
    if (logicOperatorSymbol) {
      for (const arg of filterExpression.args) {
        // To solve the not operation we rewrite the path of filter expression to reverse every operation
        // e.g, = : != ; > : <=
        if (logicOperatorSymbol === LogicOperatorSymbol.Not) {
          inverseFilter(arg);
          domain = recursifResolve(arg, variable, domain, logicOperator);
        } else {
          const logicOperator = operatorFactory(logicOperatorSymbol);
          domain = recursifResolve(arg, variable, domain, logicOperator);
        }
      }
    }
  }
  return domain;
}
