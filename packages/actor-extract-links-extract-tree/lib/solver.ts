import { RelationOperator } from '@comunica/types-link-traversal';
import type { ITreeRelation } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import type { Algebra } from 'sparqlalgebrajs';

export function solveRelationWithFilter() {

}

function convertTreeRelationToSolverExpression(expression: ITreeRelation, variable: string): SolverExpression | undefined {
  if (expression.value && expression.type) {
    const valueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>expression.value.term).datatype.value);
    if (!valueType) {
      return undefined;
    }
    const valueNumber = castSparqlRdfTermIntoJs(expression.value.value, valueType);
    if (!valueNumber) {
      return undefined;
    }

    return {
      variable,
      rawValue: expression.value.value,
      valueType,
      valueAsNumber: valueNumber,

      operator: expression.type,
    };
  }
}

function convertFilterExpressionToSolverExpression(expression: Algebra.OperatorExpression, variable: string): SolverExpression[] | undefined {
  const solverExpressionSeries: SolverExpressionSeries = new Map();
  // Check if there is one filter or multiple.
  if ('operator' in expression.args[0]) {
    const currentSerieOperator = expression.operator;
    expression.args.forEach(currentExpression => {
      let variable: string | undefined;
      let rawValue: string | undefined;
      let valueType: SparqlOperandDataTypes | undefined;
      let valueAsNumber: number | undefined;
      for (const arg of currentExpression.args) {
        if ('term' in arg && arg.term.termType === 'Variable') {
          variable = arg.term.value;
        } else if ('term' in arg && arg.term.termType === 'Literal') {
          rawValue = arg.term.value;
          valueType = SparqlOperandDataTypesReversed.get(arg.term.datatype.value);
          if (valueType) {
            valueAsNumber = castSparqlRdfTermIntoJs(rawValue!, valueType);
          }
        }
      }
      if (variable && rawValue && valueType && valueAsNumber) {

      }
    });
  }

  return undefined;
}

function areTypeCompatible(relation: ITreeRelation, filterValue: RDF.Term): boolean {
  const filterValueType = SparqlOperandDataTypesReversed.get((<RDF.Literal> filterValue).datatype.value);
  const relationValueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>relation.value?.term).datatype.value);
  // Unvalid type we will let sparqlee handle the error.
  if (!filterValueType || !relationValueType) {
    return false;
  }
  // The type doesn't match we let sparqlee handle the error
  if (filterValueType !== relationValueType &&
      !(isSparqlOperandNumberType(filterValueType) && isSparqlOperandNumberType(relationValueType))) {
    return false;
  }
  return true;
}

function convertValueToNumber() {

}

function evaluateRange() {

}

function checkIfRangeOverlap() {

}

function evaluateRelationType(relation: ITreeRelation, filterValue: RDF.Term, filterVariable: string): void {
  const filterValueType = SparqlOperandDataTypesReversed.get((<RDF.Literal> filterValue).datatype.value);
  const relationValueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>relation.value?.term).datatype.value);
  // Unvalid type we will let sparqlee handle the error.
  if (!filterValueType || !relationValueType) {
    return;
  }
  // The type doesn't match we let sparqlee handle the error
  if (filterValueType !== relationValueType &&
      !(isSparqlOperandNumberType(filterValueType) && isSparqlOperandNumberType(relationValueType))) {
    return;
  }

  const filterValueAsNumber = castSparqlRdfTermIntoJs(filterValue.value, filterValueType);
}

function getPossibleRangeOfExpression(value: number, operator: RelationOperator): [number, number] | undefined {
  switch (operator) {
    case RelationOperator.GreaterThanRelation:
      return [ value + Number.EPSILON, Number.POSITIVE_INFINITY ];
    case RelationOperator.GreaterThanOrEqualToRelation:
      return [ value, Number.POSITIVE_INFINITY ];
    case RelationOperator.EqualThanRelation:
      return [ value, value ];
    case RelationOperator.LessThanRelation:
      return [ Number.NEGATIVE_INFINITY, value - Number.EPSILON ];
    case RelationOperator.LessThanOrEqualToRelation:
      return [ Number.NEGATIVE_INFINITY, value ];
    default:
      break;
  }
}

function castSparqlRdfTermIntoJs(rdfTermValue: string, rdfTermType: SparqlOperandDataTypes): number | undefined {
  let jsValue: number | undefined;
  if (
    isSparqlOperandNumberType(rdfTermType)
  ) {
    jsValue = Number.parseInt(rdfTermValue, 10);
  } else if (
    rdfTermType === SparqlOperandDataTypes.Decimal ||
        rdfTermType === SparqlOperandDataTypes.Float ||
        rdfTermType === SparqlOperandDataTypes.Double
  ) {
    jsValue = Number.parseFloat(rdfTermValue);
  } else if (rdfTermType === SparqlOperandDataTypes.DateTime) {
    jsValue = new Date(rdfTermValue).getTime();
  }
  return jsValue;
}

/**
 * Valid SPARQL data type for operation.
 */
enum SparqlOperandDataTypes{
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

enum LinkOperator{
  And = '&&',
  Or = '||',
}

function isSparqlOperandNumberType(rdfTermType: SparqlOperandDataTypes): boolean {
  return rdfTermType === SparqlOperandDataTypes.Integer ||
   rdfTermType === SparqlOperandDataTypes.NonPositiveInteger ||
   rdfTermType === SparqlOperandDataTypes.NegativeInteger ||
   rdfTermType === SparqlOperandDataTypes.Long ||
   rdfTermType === SparqlOperandDataTypes.Short ||
   rdfTermType === SparqlOperandDataTypes.NonNegativeInteger ||
   rdfTermType === SparqlOperandDataTypes.UnsignedLong ||
   rdfTermType === SparqlOperandDataTypes.UnsignedInt ||
   rdfTermType === SparqlOperandDataTypes.UnsignedShort ||
   rdfTermType === SparqlOperandDataTypes.PositiveInteger;
}

/**
   * A map to access the value of the enum SparqlOperandDataTypesReversed by it's value in O(1).
   */
const SparqlOperandDataTypesReversed: Map<string, SparqlOperandDataTypes> =
   new Map(Object.values(SparqlOperandDataTypes).map(value => [ value, value ]));

function filterOperatorToRelationOperator(filterOperator: string): RelationOperator | undefined {
  switch (filterOperator) {
    case '=':
      return RelationOperator.EqualThanRelation;
    case '<':
      return RelationOperator.LessThanRelation;
    case '<=':
      return RelationOperator.LessThanOrEqualToRelation;
    case '>':
      return RelationOperator.GreaterThanRelation;
    case '>=':
      return RelationOperator.GreaterThanOrEqualToRelation;
    default:
      return undefined;
  }
}

interface SolverExpression{
  variable: Variable;

  rawValue: string;
  valueType: SparqlOperandDataTypes;
  valueAsNumber: number;

  operator: RelationOperator;

  expressionRange?: [number, number];
}
  type Variable = string;
interface ExpressionLinked {
  expression: SolverExpression; link: LinkOperator;
}
  type SolverExpressionSeries = Map<Variable, ExpressionLinked[]>;
