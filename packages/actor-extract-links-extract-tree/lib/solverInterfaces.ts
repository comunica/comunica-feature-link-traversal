import type { SparqlRelationOperator } from '@comunica/types-link-traversal';
import type { LinkOperator } from './LinkOperator';
import type { SolutionRange } from './SolutionRange';
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
export enum LogicOperator {
  And = '&&',
  Or = '||',
  Not = '!',
}

/**
 * A map to access the value of the enum LogicOperator by it's value in O(1) time complexity.
 */
export const LogicOperatorReversed: Map<string, LogicOperator> =
    new Map(Object.values(LogicOperator).map(value => [ value, value ]));

/**
 * A range of a solver expression with his chain of logical operation.
 */
export interface ISolverExpressionRange {
  /**
     * The chain of operation attached to the expression.
     */
  chainOperator: LinkOperator[];
  /**
     * The domain of the solution of this expression.
     */
  solutionDomain: SolutionRange;
}

/**
 * A system of equation to be solved by the solver. It is indexed by the last logical operation that has to be apply
 * to the expression
 */
export type SolverEquationSystem = Map<LastLogicalOperator, ISolverExpressionRange>;

/**
 * A last logical expression of a chain of logical expression.
 */
export type LastLogicalOperator = string;
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
  /**
     * The chain of logical operator attached to the expression.
     */
  chainOperator: LinkOperator[];
}

