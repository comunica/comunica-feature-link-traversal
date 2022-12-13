import { SparqlRelationOperator } from '@comunica/types-link-traversal';
import type { ITreeRelation } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import { SolutionDomain } from './SolutionDomain';
import { SolutionRange } from './SolutionRange';
import { LinkOperator } from './LinkOperator';
import {
  SparqlOperandDataTypes, SolverEquationSystem,
  LogicOperatorReversed, LogicOperator, SolverExpression,
  Variable, SolverEquation, SparqlOperandDataTypesReversed
} from './solverInterfaces';
import { LastLogicalOperator } from './solverInterfaces';

export function solveRelationWithFilter({ relation, filterExpression, variable }: {
  relation: ITreeRelation,
  filterExpression: Algebra.Expression,
  variable: Variable
}): boolean {
  LinkOperator.resetIdCount();
  const relationsolverExpressions = convertTreeRelationToSolverExpression(relation, variable);
  // the relation doesn't have a value or a type, so we accept it
  if (typeof relationsolverExpressions === 'undefined') {
    return true;
  }
  const filtersolverExpressions = convertFilterExpressionToSolverExpression(filterExpression, [], []);
  // the type are not compatible no evaluation is possible SPARQLEE will later return an error
  if (!areTypesCompatible(filtersolverExpressions.concat(relationsolverExpressions))) {
    return false;
  }
  const filterEquationSystem = createEquationSystem(filtersolverExpressions);

  return true
}

export function resolveAFilterTerm(expression: Algebra.Expression, operator: SparqlRelationOperator, linksOperator: LinkOperator[]): SolverExpression | undefined {
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
        valueAsNumber = castSparqlRdfTermIntoNumber(rawValue!, valueType);
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

export function convertFilterExpressionToSolverExpression(expression: Algebra.Expression, filterExpressionList: SolverExpression[], linksOperator: LinkOperator[]): SolverExpression[] {

  if (
    expression.args[0].expressionType === Algebra.expressionTypes.TERM
  ) {
    const rawOperator = expression.operator;
    const operator = filterOperatorToRelationOperator(rawOperator)
    if (typeof operator !== 'undefined') {
      const solverExpression = resolveAFilterTerm(expression, operator, new Array(...linksOperator));
      if (typeof solverExpression !== 'undefined') {
        filterExpressionList.push(solverExpression);
        return filterExpressionList;
      }
    }
  } else {
    const logicOperator = LogicOperatorReversed.get(expression.operator);
    if (typeof logicOperator !== 'undefined') {
      const operator = new LinkOperator(logicOperator);
      linksOperator.push(operator);
      for (const arg of expression.args) {
        convertFilterExpressionToSolverExpression(arg, filterExpressionList, linksOperator);
      }
    }

  }
  return filterExpressionList;
}

export function resolveEquationSystem(equationSystem: SolverEquationSystem, firstEquation: [SolverEquation, SolverEquation]): SolutionDomain | undefined {
  const localEquationSystem = new Map(equationSystem);
  const localFistEquation = new Array(...firstEquation);
  let domain: SolutionDomain = SolutionDomain.newWithInitialValue(localFistEquation[0].solutionDomain);
  let idx: string = "";
  let currentEquation: SolverEquation | undefined = localFistEquation[1];

  do {
    const resp = resolveEquation(currentEquation, domain);
    if (!resp) {
      return undefined;
    }
    [domain, idx] = resp;

    currentEquation = localEquationSystem.get(idx);

  } while (currentEquation)

  return domain;
}

export function createEquationSystem(expressions: SolverExpression[]): [SolverEquationSystem, [SolverEquation, SolverEquation]] | undefined {
  const system: SolverEquationSystem = new Map();
  let firstEquationToEvaluate: [SolverEquation, SolverEquation] | undefined = undefined;
  let firstEquationLastOperator: string = "";

  for (const expression of expressions) {
    const lastOperator = expression.chainOperator.slice(-1).toString();
    const solutionRange = getSolutionRange(expression.valueAsNumber, expression.operator);
    if (!solutionRange) {
      return undefined;
    }
    const equation: SolverEquation = {
      chainOperator: expression.chainOperator,
      solutionDomain: solutionRange
    };
    const lastEquation = system.get(lastOperator);
    if (lastEquation) {
      if(firstEquationLastOperator !== ""){
        return undefined;
      }
      firstEquationToEvaluate = [lastEquation, equation];
      firstEquationLastOperator = lastOperator;
    } else {
      system.set(lastOperator, equation);
    }
  }

  if (!firstEquationToEvaluate) {
    return undefined;
  }
  system.delete(firstEquationLastOperator);

  return [system, firstEquationToEvaluate];
}

export function resolveEquation(equation: SolverEquation, domain: SolutionDomain): [SolutionDomain, LastLogicalOperator] | undefined {
  let localDomain = domain.clone();
  let i = -1;
  let currentLastOperator = equation.chainOperator.at(i);
  if (!currentLastOperator) {
    return undefined;
  }
  i--;
  localDomain = localDomain.add({ range: equation.solutionDomain, operator: currentLastOperator?.operator });

  currentLastOperator = equation.chainOperator.at(i);
  if (!currentLastOperator) {
    return [localDomain, ""];
  }
  while (currentLastOperator?.operator === LogicOperator.Not) {
    localDomain = localDomain.add({ operator: currentLastOperator?.operator });
    i--;
    currentLastOperator = equation.chainOperator.at(i);
    if (!currentLastOperator?.operator) {
      return [localDomain, ""];
    }
  }

  return [localDomain, currentLastOperator.toString()]
}

export function convertTreeRelationToSolverExpression(expression: ITreeRelation, variable: string): SolverExpression | undefined {
  if (expression.value && expression.type) {
    const valueType = SparqlOperandDataTypesReversed.get((<RDF.Literal>expression.value.term).datatype.value);
    if (!valueType) {
      return undefined;
    }
    const valueNumber = castSparqlRdfTermIntoNumber(expression.value.value, valueType);
    if (!valueNumber) {
      return undefined;
    }

    return {
      variable,
      rawValue: expression.value.value,
      valueType,
      valueAsNumber: valueNumber,
      chainOperator: [],

      operator: expression.type,
    };
  }
}

export function areTypesCompatible(expressions: SolverExpression[]): boolean {
  const firstType = expressions[0].valueType;
  for (const expression of expressions) {

    const areIdentical = expression.valueType === firstType;
    const areNumbers = isSparqlOperandNumberType(firstType) &&
      isSparqlOperandNumberType(expression.valueType);

    if (!(areIdentical || areNumbers)) {
      return false
    }
  }
  return true
}

export function getSolutionRange(value: number, operator: SparqlRelationOperator): SolutionRange | undefined {
  switch (operator) {
    case SparqlRelationOperator.GreaterThanRelation:
      return new SolutionRange([value + Number.EPSILON, Number.POSITIVE_INFINITY]);
    case SparqlRelationOperator.GreaterThanOrEqualToRelation:
      return new SolutionRange([value, Number.POSITIVE_INFINITY]);
    case SparqlRelationOperator.EqualThanRelation:
      return new SolutionRange([value, value]);
    case SparqlRelationOperator.LessThanRelation:
      return new SolutionRange([Number.NEGATIVE_INFINITY, value - Number.EPSILON]);
    case SparqlRelationOperator.LessThanOrEqualToRelation:
      return new SolutionRange([Number.NEGATIVE_INFINITY, value]);
    default:
      break;
  }
}

export function castSparqlRdfTermIntoNumber(rdfTermValue: string, rdfTermType: SparqlOperandDataTypes): number | undefined {
  if (
    rdfTermType === SparqlOperandDataTypes.Decimal ||
    rdfTermType === SparqlOperandDataTypes.Float ||
    rdfTermType === SparqlOperandDataTypes.Double
  ) {
    const val = Number.parseFloat(rdfTermValue)
    return Number.isNaN(val) ? undefined : val;
  } else if (
    isSparqlOperandNumberType(rdfTermType) && !rdfTermValue.includes('.')
  ) {
    const val = Number.parseInt(rdfTermValue, 10)
    return Number.isNaN(val) ? undefined : val;
  } else if (rdfTermType === SparqlOperandDataTypes.DateTime) {
    const val = new Date(rdfTermValue).getTime()
    return Number.isNaN(val) ? undefined : val;
  }
  return undefined;
}

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

export function filterOperatorToRelationOperator(filterOperator: string): SparqlRelationOperator | undefined {
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
    default:
      return undefined;
  }
}
