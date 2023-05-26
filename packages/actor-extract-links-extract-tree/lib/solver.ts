import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import {
  MissMatchVariableError,
  MisformatedFilterTermError,
  UnsupportedDataTypeError,
} from './error';
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
import { And, LogicOperator, Or, operatorFactory } from './LogicOperator';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

const A_TRUE_EXPRESSION: SolutionInterval = new SolutionInterval(
  [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
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
      solutionDomain,
      new Or(),
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
  solutionDomain = new And().apply({ interval: relationSolutionInterval, domain: solutionDomain })

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
  variable: Variable,
):
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
  domain: SolutionDomain,
  logicOperator: LogicOperator = new Or(),
  variable: Variable,
): SolutionDomain {

  if (filterExpression.expressionType === Algebra.expressionTypes.TERM
  ) {
    // In that case we are confronted with a boolean expression
    // add the associated interval into the domain in relation to
    // the logic operator.
    if (filterExpression.term.value === 'false') {
      domain = logicOperator.apply({ interval: A_FALSE_EXPRESSION, domain });
    } else if (filterExpression.term.value === 'true') {
      domain = logicOperator.apply({ interval: A_TRUE_EXPRESSION, domain });
    } else {
      throw new MisformatedFilterTermError(`The term sent is not a boolean but is this value {${filterExpression.term.value}}`);
    }
  } else if (
    // If it's an array of terms then we should be able to create a solver expression.
    // Given the resulting solver expression we can calculate a solution interval 
    // that we will add to the domain with regards to the logic operator.
    filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM &&
    filterExpression.args.length === 2
  ) {
    const rawOperator = filterExpression.operator;
    let operator = filterOperatorToSparqlRelationOperator(rawOperator);
    if (operator && logicOperator.operatorName()!= LogicOperatorSymbol.Not) {
      const solverExpression = resolveAFilterTerm(filterExpression, operator, variable);
      let solutionInterval: SolutionInterval | [SolutionInterval, SolutionInterval]|undefined;
      if (solverExpression instanceof MissMatchVariableError) {
        solutionInterval = A_TRUE_EXPRESSION;
      } else if (solverExpression instanceof Error) {
        throw solverExpression;
      } else {
        solutionInterval = getSolutionInterval(solverExpression.valueAsNumber, solverExpression.operator);
        if (!solutionInterval){
          throw TypeError('The operator is not supported');
        }
      }
      domain = logicOperator.apply({ interval: solutionInterval, domain });
    }
  } else if (
    filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM &&
    filterExpression.args.length === 1
  ) {
    // We consider that if we only have one term in an array then it is a malformed expression, because
    // we don't support functions
    throw new MisformatedFilterTermError(`The expression should have a variable and a value, but is {${filterExpression.args}}`);
  } else {
    // In that case we are traversing the filter expression TREE.
    // We prepare the next recursion and we compute the accumulation of results.
    const logicOperatorSymbol = LogicOperatorReversed.get(filterExpression.operator);
    if (logicOperatorSymbol) {
      for (const arg of filterExpression.args) {
        console.log(arg)
        if (logicOperatorSymbol === LogicOperatorSymbol.Not) {
          inverseFilter(arg);
          domain = recursifResolve(arg, domain, logicOperator, variable);
        }else{
          const logicOperator = operatorFactory(logicOperatorSymbol);
          domain = recursifResolve(arg, domain, logicOperator, variable);
        }
      }
      
    }
  }
  return domain;
}
/**
 * Convert a TREE relation into a solver expression.
 * @param {ITreeRelation} relation - TREE relation.
 * @param {Variable} variable - variable of the SPARQL query associated with the tree:path of the relation.
 * @returns {ISolverExpression | undefined} Resulting solver expression if the data type is supported by SPARQL
 * and the value can be cast into a number.
 */
export function convertTreeRelationToSolverExpression(relation: ITreeRelation,
  variable: Variable):
  ISolverExpression | undefined {
  if (relation.value && relation.type) {
    const valueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>relation.value.term).datatype.value);
    if (!valueType) {
      return undefined;
    }
    const valueNumber = castSparqlRdfTermIntoNumber(relation.value.value, valueType);
    if (!valueNumber && valueNumber !== 0) {
      return undefined;
    }

    return {
      variable,
      rawValue: relation.value.value,
      valueType,
      valueAsNumber: valueNumber,

      operator: relation.type,
    };
  }
}
/**
 * Check if all the expression provided have a SparqlOperandDataTypes compatible type
 * it is considered that all number types are compatible between them.
 * @param {ISolverExpression[]} expressions - The subject expression.
 * @returns {boolean} Return true if the type are compatible.
 */
export function areTypesCompatible(expressions: ISolverExpression[]): boolean {
  const firstType = expressions[0].valueType;
  for (const expression of expressions) {
    const areIdentical = expression.valueType === firstType;
    const areNumbers = isSparqlOperandNumberType(firstType) &&
      isSparqlOperandNumberType(expression.valueType);

    if (!(areIdentical || areNumbers)) {
      return false;
    }
  }
  return true;
}
/**
 * Find the solution range of a value and operator which is analogue to an expression.
 * @param {number} value
 * @param {SparqlRelationOperator} operator
 * @returns {SolutionInterval | undefined} The solution range associated with the value and the operator.
 */
export function getSolutionInterval(value: number, operator: SparqlRelationOperator): SolutionInterval | [SolutionInterval, SolutionInterval]| undefined {
  switch (operator) {
    case SparqlRelationOperator.GreaterThanRelation:
      return new SolutionInterval([nextUp(value), Number.POSITIVE_INFINITY]);
    case SparqlRelationOperator.GreaterThanOrEqualToRelation:
      return new SolutionInterval([value, Number.POSITIVE_INFINITY]);
    case SparqlRelationOperator.EqualThanRelation:
      return new SolutionInterval([value, value]);
    case SparqlRelationOperator.LessThanRelation:
      return new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(value)]);
    case SparqlRelationOperator.LessThanOrEqualToRelation:
      return new SolutionInterval([Number.NEGATIVE_INFINITY, value]);
    case SparqlRelationOperator.NotEqualThanRelation:
        return [
          new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(value)]),
          new SolutionInterval([nextUp(value),Number.POSITIVE_INFINITY])
        ];
    default:
      // Not an operator that is compatible with number.
      break;
  }
}
/**
 * Convert a RDF value into a number.
 * @param {string} rdfTermValue - The raw value
 * @param {SparqlOperandDataTypes} rdfTermType - The type of the value
 * @returns {number | undefined} The resulting number or undefined if the convertion is not possible.
 */
export function castSparqlRdfTermIntoNumber(rdfTermValue: string,
  rdfTermType: SparqlOperandDataTypes):
  number | undefined {
  if (
    rdfTermType === SparqlOperandDataTypes.Decimal ||
    rdfTermType === SparqlOperandDataTypes.Float ||
    rdfTermType === SparqlOperandDataTypes.Double
  ) {
    const val = Number.parseFloat(rdfTermValue);
    return Number.isNaN(val) ? undefined : val;
  }

  if (rdfTermType === SparqlOperandDataTypes.Boolean) {
    if (rdfTermValue === 'true') {
      return 1;
    }

    if (rdfTermValue === 'false') {
      return 0;
    }

    return undefined;
  }

  if (
    isSparqlOperandNumberType(rdfTermType)
  ) {
    const val = Number.parseInt(rdfTermValue, 10);
    return Number.isNaN(val) ? undefined : val;
  }

  if (rdfTermType === SparqlOperandDataTypes.DateTime) {
    const val = new Date(rdfTermValue).getTime();
    return Number.isNaN(val) ? undefined : val;
  }

  return undefined;
}
/**
 * Determine if the type is a number.
 * @param {SparqlOperandDataTypes} rdfTermType - The subject type
 * @returns {boolean} Return true if the type is a number.
 */
export function isSparqlOperandNumberType(rdfTermType: SparqlOperandDataTypes): boolean {
  return rdfTermType === SparqlOperandDataTypes.Integer ||
    rdfTermType === SparqlOperandDataTypes.NonPositiveInteger ||
    rdfTermType === SparqlOperandDataTypes.NegativeInteger ||
    rdfTermType === SparqlOperandDataTypes.Long ||
    rdfTermType === SparqlOperandDataTypes.Short ||
    rdfTermType === SparqlOperandDataTypes.NonNegativeInteger ||
    rdfTermType === SparqlOperandDataTypes.UnsignedLong ||
    rdfTermType === SparqlOperandDataTypes.UnsignedInt ||
    rdfTermType === SparqlOperandDataTypes.UnsignedShort ||
    rdfTermType === SparqlOperandDataTypes.PositiveInteger ||
    rdfTermType === SparqlOperandDataTypes.Float ||
    rdfTermType === SparqlOperandDataTypes.Double ||
    rdfTermType === SparqlOperandDataTypes.Decimal ||
    rdfTermType === SparqlOperandDataTypes.Int;
}
/**
 * Convert a filter operator to SparqlRelationOperator.
 * @param {string} filterOperator - The filter operator.
 * @returns {SparqlRelationOperator | undefined} The SparqlRelationOperator corresponding to the filter operator
 */
export function filterOperatorToSparqlRelationOperator(filterOperator: string): SparqlRelationOperator | undefined {
  switch (filterOperator) {
    case '=':
      return SparqlRelationOperator.EqualThanRelation;
    case '<':
      return SparqlRelationOperator.LessThanRelation;
    case '<=':
      return SparqlRelationOperator.LessThanOrEqualToRelation;
    case '>':
      return SparqlRelationOperator.GreaterThanRelation;
    case '>=':
      return SparqlRelationOperator.GreaterThanOrEqualToRelation;
    case '!=':
        return SparqlRelationOperator.NotEqualThanRelation;
    default:
      return undefined;
  }
}

export function reverseRawLogicOperator(logicOperator: string) :string|undefined{
  switch(logicOperator){
    case '&&':
      return '||'
    case '||':
        return '&&'
    case '!':
        return undefined;
    default:
      return undefined
  }
}

export function reverseRawOperator(filterOperator: string): string | undefined {
  switch (filterOperator) {
    case '=':
      return '!='
    case '<':
      return '>='
    case '<=':
      return '>'
    case '>':
      return '<='
    case '>=':
      return '<'
    default:
      return undefined;
  }
}

export function reverseOperator(operator: SparqlRelationOperator): SparqlRelationOperator | undefined {
  switch (operator) {
    case SparqlRelationOperator.LessThanRelation:
      return SparqlRelationOperator.GreaterThanOrEqualToRelation
    case SparqlRelationOperator.LessThanOrEqualToRelation:
      return SparqlRelationOperator.GreaterThanRelation
    case SparqlRelationOperator.GreaterThanRelation:
      return SparqlRelationOperator.LessThanOrEqualToRelation
    case SparqlRelationOperator.GreaterThanOrEqualToRelation:
      return SparqlRelationOperator.LessThanRelation
    case SparqlRelationOperator.EqualThanRelation:
      return SparqlRelationOperator.NotEqualThanRelation
    case SparqlRelationOperator.NotEqualThanRelation:
      return SparqlRelationOperator.EqualThanRelation

    default:
      return undefined
  }
}

export function reverseLogicOperator(operator: LogicOperator): LogicOperator | undefined {
  switch (operator.operatorName()) {
    case LogicOperatorSymbol.And:
      return new Or()
    case LogicOperatorSymbol.Or:
      return new And()
    // the reverse is making an assetion and this operator is useless
    case LogicOperatorSymbol.Not:
      return undefined
  }
}

export function inverseFilter(filterExpression: Algebra.Expression){
  if (filterExpression.expressionType === Algebra.expressionTypes.TERM
    ) {
      if (filterExpression.term.value === 'false') {
        filterExpression.term.value = 'true';
      } else if (filterExpression.term.value === 'true') {
        filterExpression.term.value = 'false';
      } else {
        throw new MisformatedFilterTermError(`The term sent is not a boolean but is this value {${filterExpression.term.value}}`);
      }
    }else if (
      // If it's an array of terms then we should be able to create a solver expression.
      // Given the resulting solver expression we can calculate a solution interval 
      // that we will add to the domain with regards to the logic operator.
      filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM &&
      filterExpression.args.length === 2
    ) {
      filterExpression.operator = reverseRawOperator(filterExpression.operator)

    }else{
      for (const arg of filterExpression.args) {
        const reversedOperator = reverseRawLogicOperator(filterExpression.operator);
        if(reversedOperator){
          filterExpression.operator = reversedOperator;
        }
        inverseFilter(arg);
      }
    }
  
}