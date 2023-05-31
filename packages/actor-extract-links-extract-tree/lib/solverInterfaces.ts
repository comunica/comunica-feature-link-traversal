import { SolutionDomain } from './SolutionDomain';
import { SolutionInterval } from './SolutionInterval';
import type { SparqlRelationOperator } from './TreeMetadata';
/**
 * Valid SPARQL data type for operation.
 * reference: https://www.w3.org/TR/sparql11-query/#operandDataTypes
 */
export enum SparqlOperandDataTypes {
  Integer = 'http://www.w3.org/2001/XMLSchema#integer',
  Decimal = 'http://www.w3.org/2001/XMLSchema#decimal',
  Float = 'http://www.w3.org/2001/XMLSchema#float',
  Double = 'http://www.w3.org/2001/XMLSchema#double',
  String = 'http://www.w3.org/2001/XMLSchema#string',
  Boolean = 'http://www.w3.org/2001/XMLSchema#boolean',
  DateTime = 'http://www.w3.org/2001/XMLSchema#dateTime',

  NonPositiveInteger = 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
  NegativeInteger = 'http://www.w3.org/2001/XMLSchema#negativeInteger',
  Long = 'http://www.w3.org/2001/XMLSchema#long',
  Int = 'http://www.w3.org/2001/XMLSchema#int',
  Short = 'http://www.w3.org/2001/XMLSchema#short',
  Byte = 'http://www.w3.org/2001/XMLSchema#byte',
  NonNegativeInteger = 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
  UnsignedLong = 'http://www.w3.org/2001/XMLSchema#nunsignedLong',
  UnsignedInt = 'http://www.w3.org/2001/XMLSchema#unsignedInt',
  UnsignedShort = 'http://www.w3.org/2001/XMLSchema#unsignedShort',
  UnsignedByte = 'http://www.w3.org/2001/XMLSchema#unsignedByte',
  PositiveInteger = 'http://www.w3.org/2001/XMLSchema#positiveInteger'
}

/**
 * A map to access the value of the enum SparqlOperandDataTypesReversed by it's value in O(1) time complexity.
*/
export const SparqlOperandDataTypesReversed: Map<string, SparqlOperandDataTypes> =
    new Map(Object.values(SparqlOperandDataTypes).map(value => [ value, value ]));

/**
 * Logical operator that linked logical expression together.
 */
export enum LogicOperatorSymbol {
  And = '&&',
  Or = '||',
  Not = '!',
  Exist = 'E'
}

/**
 * A map to access the value of the enum LogicOperator by it's value in O(1) time complexity.
 */
export const LogicOperatorReversed: Map<string, LogicOperatorSymbol> =
    new Map(Object.values(LogicOperatorSymbol).map(value => [ value, value ]));

/**
 * A variable to be solved by the solver.
 */
export type Variable = string;
/**
 * An expression of the solver containing also the chain of operation attached to it.
 * eg: x>=5.5 chained with &&, ||, !
 */
export interface ISolverExpression {
  /**
     * The variable of the expression
     */
  variable: Variable;
  /**
     * The constant value attached to the expression as a String.
     */
  rawValue: string;
  /**
     * The data type of the constant value.
     */
  valueType: SparqlOperandDataTypes;
  /**
     * The value repressented as a number
     */
  valueAsNumber: number;
  /**
     * The operator binding the value and the variable.
     */
  operator: SparqlRelationOperator;
}
/**
 * An input for the solve.
 * It must be able to be resolved into a domain or an interval
 */
export interface ISolverInput {
   domain: SolutionInterval|[SolutionInterval, SolutionInterval]|SolutionDomain,
}

