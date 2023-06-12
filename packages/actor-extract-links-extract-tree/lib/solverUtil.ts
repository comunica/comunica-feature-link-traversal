import { Algebra } from 'sparqlalgebrajs';

import { SolutionInterval } from './SolutionInterval';
import {
  SparqlOperandDataTypes, LogicOperatorSymbol,
} from './solverInterfaces';
import type {
  ISolverExpression,
} from './solverInterfaces';
import { SparqlRelationOperator } from './TreeMetadata';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

/**
   * Check if all the expression provided have a {@link SparqlOperandDataTypes} compatible type
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
   * Find the {@link SolutionInterval} of a value and operator which is analogue to an expression.
   * @param {number} value
   * @param {SparqlRelationOperator} operator
   * @returns {SolutionInterval | undefined} the {@link SolutionInterval} range
   *    associated with the value and the operator.
   */
export function getSolutionInterval(value: number, operator: SparqlRelationOperator):
SolutionInterval | [SolutionInterval, SolutionInterval] | undefined {
  switch (operator) {
    case SparqlRelationOperator.GreaterThanRelation:
      return new SolutionInterval([ nextUp(value), Number.POSITIVE_INFINITY ]);
    case SparqlRelationOperator.GreaterThanOrEqualToRelation:
      return new SolutionInterval([ value, Number.POSITIVE_INFINITY ]);
    case SparqlRelationOperator.EqualThanRelation:
      return new SolutionInterval([ value, value ]);
    case SparqlRelationOperator.LessThanRelation:
      return new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(value) ]);
    case SparqlRelationOperator.LessThanOrEqualToRelation:
      return new SolutionInterval([ Number.NEGATIVE_INFINITY, value ]);
    case SparqlRelationOperator.NotEqualThanRelation:
      return [
        new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(value) ]),
        new SolutionInterval([ nextUp(value), Number.POSITIVE_INFINITY ]),
      ];
    default:
      // Not an operator that is compatible with numbers.
      break;
  }
}
/**
   * Convert a RDF value into a {@link number}.
   * @param {string} rdfTermValue - The raw value
   * @param {SparqlOperandDataTypes} rdfTermType - The type of the value
   * @returns {number | undefined} The resulting {@link number} or {@link undefined} if the convertion is not possible.
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
   * @param {SparqlOperandDataTypes} rdfTermType - the subject type
   * @returns {boolean} return true if the type is a number.
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
   * Convert a filter operator to {@link SparqlRelationOperator}.
   * @param {string} filterOperator - the filter operator.
   * @returns {SparqlRelationOperator | undefined} the SparqlRelationOperator corresponding to the filter operator
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
/**
   * Reverse a logic operator.
   * @param {string} logicOperator - A string representation of a logic operator
   * @returns {string | undefined} The reversed logic operator or {@link undefined} if the input is not a valid operator
   */
export function reverseRawLogicOperator(logicOperator: string): string | undefined {
  switch (logicOperator) {
    case LogicOperatorSymbol.And:
      return LogicOperatorSymbol.Or;
    case LogicOperatorSymbol.Or:
      return LogicOperatorSymbol.And;
    case LogicOperatorSymbol.Not:
      return LogicOperatorSymbol.Exist;
    case LogicOperatorSymbol.Exist:
      return LogicOperatorSymbol.Not;
    default:
      return undefined;
  }
}

/**
   * Reverse a string operator.
   * @param {string} filterOperator - A string representation of an operator
   * @returns {string | undefined} The reverse operator or {@link undefined} if the input is not a valid operator
   */
export function reverseRawOperator(filterOperator: string): string | undefined {
  switch (filterOperator) {
    case '=':
      return '!=';
    case '!=':
      return '=';
    case '<':
      return '>=';
    case '<=':
      return '>';
    case '>':
      return '<=';
    case '>=':
      return '<';
    default:
      return undefined;
  }
}

/**
   * Reverse a {@link SparqlRelationOperator}.
   * @param {SparqlRelationOperator} operator - a Sparql operator
   * @returns {SparqlRelationOperator | undefined}
   * The reverse operator or {@link undefined} if the input is not a supported operator.
   */
export function reverseSparqlOperator(operator: SparqlRelationOperator): SparqlRelationOperator | undefined {
  switch (operator) {
    case SparqlRelationOperator.LessThanRelation:
      return SparqlRelationOperator.GreaterThanOrEqualToRelation;
    case SparqlRelationOperator.LessThanOrEqualToRelation:
      return SparqlRelationOperator.GreaterThanRelation;
    case SparqlRelationOperator.GreaterThanRelation:
      return SparqlRelationOperator.LessThanOrEqualToRelation;
    case SparqlRelationOperator.GreaterThanOrEqualToRelation:
      return SparqlRelationOperator.LessThanRelation;
    case SparqlRelationOperator.EqualThanRelation:
      return SparqlRelationOperator.NotEqualThanRelation;
    case SparqlRelationOperator.NotEqualThanRelation:
      return SparqlRelationOperator.EqualThanRelation;

    default:
      return undefined;
  }
}

/**
 * Traverse the filter expression tree and reverse each expression.
 * @param {Algebra.Expression} filterExpression - Filter expression
 */
export function inverseFilter(filterExpression: Algebra.Expression): void {
  if (filterExpression.expressionType === Algebra.expressionTypes.TERM
  ) {
    if (filterExpression.term.value === 'false') {
      filterExpression.term.value = 'true';
    } else if (filterExpression.term.value === 'true') {
      filterExpression.term.value = 'false';
    }
  } else if (
    filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM &&
    filterExpression.args.length === 2
  ) {
    filterExpression.operator = reverseRawOperator(filterExpression.operator);
  } else {
    const reversedOperator = reverseRawLogicOperator(filterExpression.operator);
    if (reversedOperator) {
      filterExpression.operator = reversedOperator;
    }
    if (filterExpression.args) {
      for (const arg of filterExpression.args) {
        const newReversedOperator = reverseRawLogicOperator(filterExpression.operator);
        if (newReversedOperator) {
          filterExpression.operator = newReversedOperator;
        }
        inverseFilter(arg);
      }
    }
  }
}
