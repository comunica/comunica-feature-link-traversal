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
  Variable, SolverExpressionRange, SparqlOperandDataTypesReversed
} from './solverInterfaces';
import { LastLogicalOperator } from './solverInterfaces';

export function isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable }: {
  relation: ITreeRelation,
  filterExpression: Algebra.Expression,
  variable: Variable
}): boolean {
  LinkOperator.resetIdCount();
  const relationsolverExpressions = convertTreeRelationToSolverExpression(relation, variable);
  // the relation doesn't have a value or a type, so we accept it
  if (!relationsolverExpressions) {
    return true;
  }
  const filtersolverExpressions = recursifFilterExpressionToSolverExpression(filterExpression, [], [], variable);
  // the type are not compatible no evaluation is possible SPARQLEE will later return an error
  if (!areTypesCompatible(filtersolverExpressions.concat(relationsolverExpressions))) {
    return true;
  }

  const relationSolutionRange = getSolutionRange(relationsolverExpressions.valueAsNumber, relationsolverExpressions.operator);
  // the relation is invalid so we filter it
  if (!relationSolutionRange) {
    return false;
  }
  const equationSystemFirstEquation = createEquationSystem(filtersolverExpressions);

  // cannot create the equation system we don't filter the relation in case the error is internal to not
  // loss results
  if (!equationSystemFirstEquation) {
    return true
  }

  const [equationSystem, firstEquationToResolved] = equationSystemFirstEquation;

  // we check if the filter expression itself has a solution
  let solutionDomain = resolveEquationSystem(equationSystem, firstEquationToResolved);

  // don't pass the relation if the filter cannot be resolved
  if (solutionDomain.isDomainEmpty()) {
    return false;
  }

  solutionDomain = solutionDomain.add({ range: relationSolutionRange, operator: LogicOperator.And });

  // if there is a possible solution we don't filter the link
  return !solutionDomain.isDomainEmpty();
}

export function recursifFilterExpressionToSolverExpression(expression: Algebra.Expression, filterExpressionList: SolverExpression[], linksOperator: LinkOperator[], variable: Variable): SolverExpression[] {
  if (
    expression.args[0].expressionType === Algebra.expressionTypes.TERM
  ) {
    const rawOperator = expression.operator;
    const operator = filterOperatorToRelationOperator(rawOperator)
    if (operator) {
      const solverExpression = resolveAFilterTerm(expression, operator, new Array(...linksOperator), variable);
      if (solverExpression) {
        filterExpressionList.push(solverExpression);
        return filterExpressionList;
      }
    }
  } else {
    const logicOperator = LogicOperatorReversed.get(expression.operator);
    if (logicOperator) {
      const operator = new LinkOperator(logicOperator);
      for (const arg of expression.args) {
        recursifFilterExpressionToSolverExpression(arg, filterExpressionList, linksOperator.concat(operator), variable);
      }
    }

  }
  return filterExpressionList;
}

export function resolveAFilterTerm(expression: Algebra.Expression, operator: SparqlRelationOperator, linksOperator: LinkOperator[], variable: Variable): SolverExpression | undefined {
  let rawValue: string | undefined;
  let valueType: SparqlOperandDataTypes | undefined;
  let valueAsNumber: number | undefined;
  let hasVariable = false;

  for (const arg of expression.args) {
    if ('term' in arg && arg.term.termType === 'Variable') {
      if(arg.term.value !== variable){
        return undefined;
      }else{
        hasVariable = true;
      }
    } else if ('term' in arg && arg.term.termType === 'Literal') {
      rawValue = arg.term.value;
      valueType = SparqlOperandDataTypesReversed.get(arg.term.datatype.value);
      if (valueType) {
        valueAsNumber = castSparqlRdfTermIntoNumber(rawValue!, valueType);
      }
    }
  }
  if (hasVariable && rawValue && valueType && valueAsNumber) {
    return {
      variable,
      rawValue,
      valueType,
      valueAsNumber,
      operator,
      chainOperator: linksOperator,
    }
  }
}

export function resolveEquationSystem(equationSystem: SolverEquationSystem, firstEquation: [SolverExpressionRange, SolverExpressionRange]): SolutionDomain {
  let domain: SolutionDomain = SolutionDomain.newWithInitialValue(firstEquation[0].solutionDomain);
  let idx: string = "";
  // safety for no infinite loop
  let i = 0;
  let currentEquation: SolverExpressionRange | undefined = firstEquation[1];

  do {
    const resp = resolveEquation(currentEquation, domain);
    if (!resp) {
      throw new Error(`unable to resolve the equation ${currentEquation}`)
    }
    [domain, idx] = resp;

    currentEquation = equationSystem.get(idx);
    i++
  } while (currentEquation && i != equationSystem.size + 1)

  return domain;
}

export function createEquationSystem(expressions: SolverExpression[]): [SolverEquationSystem, [SolverExpressionRange, SolverExpressionRange]] | undefined {
  const system: SolverEquationSystem = new Map();
  let firstEquationToEvaluate: [SolverExpressionRange, SolverExpressionRange] | undefined = undefined;
  let firstEquationLastOperator: string = "";

  for (const expression of expressions) {
    const lastOperator = expression.chainOperator.slice(-1).toString();
    const solutionRange = getSolutionRange(expression.valueAsNumber, expression.operator);
    if (!solutionRange) {
      return undefined;
    }
    const equation: SolverExpressionRange = {
      chainOperator: expression.chainOperator,
      solutionDomain: solutionRange
    };
    const lastEquation = system.get(lastOperator);
    if (lastEquation) {
      if (firstEquationLastOperator !== "") {
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

export function resolveEquation(equation: SolverExpressionRange, domain: SolutionDomain): [SolutionDomain, LastLogicalOperator] | undefined {
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
