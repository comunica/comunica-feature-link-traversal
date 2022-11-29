import { RelationOperator } from '@comunica/types-link-traversal';
import type { ITreeRelation } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import { SparqlOperandDataTypes, LogicOperator, SolverExpression, LinkOperator, Variable } from './SolverType'; 





export function solveRelationWithFilter({relation, filterExpression}:{
  relation:ITreeRelation,
  filterExpression: Algebra.Expression,
  variables: Set<Variable>
}):boolean {
  return true
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


function resolveAFilterTerm(expression: Algebra.Expression, operator: RelationOperator, linksOperator: string[]): SolverExpression | undefined {
  let variable: string | undefined;
  let rawValue: string | undefined;
  let valueType: SparqlOperandDataTypes | undefined;
  let valueAsNumber: number | undefined;

  for (const arg of expression.args) {
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
    return {
      variable,
      rawValue,
      valueType,
      valueAsNumber,
      operator,
      chainOperator: linksOperator,
    }
  }
  return undefined
}

export function convertFilterExpressionToSolverExpression(expression: Algebra.Expression, filterExpressionList: SolverExpression[], linksOperator:string[]): SolverExpression[] {
  if (expression.args.length === 2 &&
    expression.args[0].expressionType === Algebra.expressionTypes.TERM
  ) {
    const rawOperator = expression.operator;
    const operator = filterOperatorToRelationOperator(rawOperator)
    if (typeof operator !== 'undefined') {
      const solverExpression = resolveAFilterTerm(expression, operator, new Array(...linksOperator));
      if(typeof solverExpression !== 'undefined') {
        filterExpressionList.push(solverExpression);
        return filterExpressionList;
      }
    }
  } else {
    linksOperator.push(expression.operator);
    for (const arg of expression.args) {
      convertFilterExpressionToSolverExpression(arg, filterExpressionList, linksOperator);
    }
  }

  return filterExpressionList;
}

function areTypeCompatible(relation: ITreeRelation, filterValue: RDF.Term): boolean {
  const filterValueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>filterValue).datatype.value);
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
  const filterValueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>filterValue).datatype.value);
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
      return [value + Number.EPSILON, Number.POSITIVE_INFINITY];
    case RelationOperator.GreaterThanOrEqualToRelation:
      return [value, Number.POSITIVE_INFINITY];
    case RelationOperator.EqualThanRelation:
      return [value, value];
    case RelationOperator.LessThanRelation:
      return [Number.NEGATIVE_INFINITY, value - Number.EPSILON];
    case RelationOperator.LessThanOrEqualToRelation:
      return [Number.NEGATIVE_INFINITY, value];
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
  new Map(Object.values(SparqlOperandDataTypes).map(value => [value, value]));

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


