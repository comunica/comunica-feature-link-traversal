import { SparqlRelationOperator } from '@comunica/types-link-traversal';
import type { ITreeRelation } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import { LinkOperator } from './LinkOperator';
import { SolutionDomain } from './SolutionDomain';
import { SolutionRange } from './SolutionRange';
import {
  SparqlOperandDataTypes,
  LogicOperatorReversed, LogicOperator, SparqlOperandDataTypesReversed,
} from './solverInterfaces';
import type {
  LastLogicalOperator, SolverEquationSystem, ISolverExpression,
  Variable, ISolverExpressionRange,
} from './solverInterfaces';

/**
 * Check if the solution domain of a system of equation compose of the expressions of the filter
 * expression and the relation is not empty.
 * @param {ITreeRelation} relation - The tree:relation that we wish to determine if there is a possible solution
 * when we combine it with a filter expression.
 * @param  {Algebra.Expression} filterExpression - The Algebra expression of the filter.
 * @param {variable} variable - The variable to be resolved.
 * @returns {boolean} Return true if the domain
 */
export function isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable }: {
  relation: ITreeRelation;
  filterExpression: Algebra.Expression;
  variable: Variable;
}): boolean {
  LinkOperator.resetIdCount();
  const relationsolverExpressions = convertTreeRelationToSolverExpression(relation, variable);
  // The relation doesn't have a value or a type, so we accept it
  if (!relationsolverExpressions) {
    return true;
  }
  const filtersolverExpressions = recursifFilterExpressionToSolverExpression(filterExpression, [], [], variable);
  // The type are not compatible no evaluation is possible SPARQLEE will later return an error
  if (!areTypesCompatible(filtersolverExpressions.concat(relationsolverExpressions))) {
    return true;
  }

  const relationSolutionRange = getSolutionRange(
    relationsolverExpressions.valueAsNumber,
    relationsolverExpressions.operator,
  );
  // We don't prune the relation because we do not implement yet the solution range for this expression
  if (!relationSolutionRange) {
    return true;
  }
  const equationSystemFirstEquation = createEquationSystem(filtersolverExpressions);

  // Cannot create the equation system we don't filter the relation in case the error is internal to not
  // lose results
  if (!equationSystemFirstEquation) {
    return true;
  }

  let solutionDomain: SolutionDomain;

  // If the filter has multiple expression
  if (Array.isArray(equationSystemFirstEquation)) {
    const [ equationSystem, firstEquationToResolved ] = equationSystemFirstEquation;

    // We check if the filter expression itself has a solution
    solutionDomain = resolveSolutionDomainEquationSystem(equationSystem, firstEquationToResolved);

    // Don't pass the relation if the filter cannot be resolved
    if (solutionDomain.isDomainEmpty()) {
      return false;
    }
  } else {
    solutionDomain = SolutionDomain.newWithInitialValue(equationSystemFirstEquation.solutionDomain);
  }

  // Evaluate the solution domain when adding the relation
  solutionDomain = solutionDomain.add({ range: relationSolutionRange, operator: LogicOperator.And });

  // If there is a possible solution we don't filter the link
  return !solutionDomain.isDomainEmpty();
}

/**
 * A recursif function that traverse the Algebra expression to capture each boolean expression and there associated
 * chain of logical expression. On the first call the filterExpressionList and linksOperator must be empty, they serve
 * as states to build the expressions.
 * @param {Algebra.Expression} filterExpression - The expression of the filter.
 * @param {ISolverExpression[]} filterExpressionList - The solver expression acquire until then.
 * Should be empty on the first call.
 * @param {LinkOperator[]} linksOperator - The logical operator acquire until then.
 * Should be empty on the first call.
 * @param {Variable} variable  - The variable the solver expression must posses.
 * @returns {ISolverExpression[]} Return the solver expression converted from the filter expression
 */
export function recursifFilterExpressionToSolverExpression(filterExpression: Algebra.Expression,
  filterExpressionList: ISolverExpression[],
  linksOperator: LinkOperator[],
  variable: Variable):
  ISolverExpression[] {
  // If it's an array of term then we should be able to create a solver expression
  if (
    filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM
  ) {
    const rawOperator = filterExpression.operator;
    const operator = filterOperatorToSparqlRelationOperator(rawOperator);
    if (operator) {
      const solverExpression = resolveAFilterTerm(filterExpression, operator, new Array(...linksOperator), variable);
      if (solverExpression) {
        filterExpressionList.push(solverExpression);
        return filterExpressionList;
      }
    }
    // Else we store the logical operator an go deeper into the Algebra graph
  } else {
    const logicOperator = LogicOperatorReversed.get(filterExpression.operator);
    if (logicOperator) {
      const operator = new LinkOperator(logicOperator);
      for (const arg of filterExpression.args) {
        recursifFilterExpressionToSolverExpression(arg, filterExpressionList, linksOperator.concat(operator), variable);
      }
    }
  }
  return filterExpressionList;
}
/**
 * From an Algebra expression return an solver expression if possible
 * @param {Algebra.Expression} expression - Algebra expression containing the a variable and a litteral.
 * @param {SparqlRelationOperator} operator - The SPARQL operator defining the expression.
 * @param {LinkOperator[]} linksOperator - The logical operator prior to this expression.
 * @param {Variable} variable - The variable the expression should have to be part of a system of equation.
 * @returns {ISolverExpression | undefined} Return a solver expression if possible
 */
export function resolveAFilterTerm(expression: Algebra.Expression,
  operator: SparqlRelationOperator,
  linksOperator: LinkOperator[],
  variable: Variable):
  ISolverExpression | undefined {
  let rawValue: string | undefined;
  let valueType: SparqlOperandDataTypes | undefined;
  let valueAsNumber: number | undefined;
  let hasVariable = false;

  // Find the constituant element of the solver expression
  for (const arg of expression.args) {
    if ('term' in arg && arg.term.termType === 'Variable') {
      // Check if the expression has the same variable as the one the solver try to resolved
      if (arg.term.value !== variable) {
        return undefined;
      }
      hasVariable = true;
    } else if ('term' in arg && arg.term.termType === 'Literal') {
      rawValue = arg.term.value;
      valueType = SparqlOperandDataTypesReversed.get(arg.term.datatype.value);
      if (valueType) {
        valueAsNumber = castSparqlRdfTermIntoNumber(rawValue!, valueType);
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
      chainOperator: linksOperator,
    };
  }
}
/**
 * Find the domain of the possible solutions of a system of equations.
 * Will thrown an error if an equation cannot be resolved.
 * @param {SolverEquationSystem} equationSystem
 * @param {[ISolverExpressionRange, ISolverExpressionRange]} firstExpression - The first expression to evaluate.
 * @returns {SolutionDomain}
 */
export function resolveSolutionDomainEquationSystem(equationSystem: SolverEquationSystem,
  firstExpression: [ISolverExpressionRange,
    ISolverExpressionRange]):
  SolutionDomain {
  let domain: SolutionDomain = SolutionDomain.newWithInitialValue(firstExpression[0].solutionDomain);
  let idx = '';
  // Safety to avoid infinite loop
  let i = 0;
  let currentEquation: ISolverExpressionRange | undefined = firstExpression[1];

  do {
    const resp = resolveSolutionDomainWithAnExpression(currentEquation, domain);
    if (!resp) {
      throw new Error(`unable to resolve the equation ${currentEquation.chainOperator}`);
    }
    [ domain, idx ] = resp;

    currentEquation = equationSystem.get(idx);
    i++;
  } while (currentEquation && i !== equationSystem.size + 1);

  return domain;
}
/**
 * Create a system of equation from the provided expression and return separatly the first expression to evaluate.
 * @param {ISolverExpression[]} expressions - the expression composing the equation system
 * @returns {[SolverEquationSystem, [ISolverExpressionRange, ISolverExpressionRange]]
 * | undefined} if the expression form a possible system of equation return
 * the system of equation and the first expression to evaluate.
 */
export function createEquationSystem(expressions: ISolverExpression[]):
[SolverEquationSystem, [ISolverExpressionRange, ISolverExpressionRange]] | ISolverExpressionRange | undefined {
  if (expressions.length === 1) {
    const solutionRange = getSolutionRange(expressions[0].valueAsNumber, expressions[0].operator);
    if (!solutionRange) {
      return undefined;
    }
    return {
      chainOperator: [],
      solutionDomain: solutionRange,
    };
  }

  const system: SolverEquationSystem = new Map();
  // The first expression that has to be evaluated
  let firstEquationToEvaluate: [ISolverExpressionRange, ISolverExpressionRange] | undefined;
  // The last logical operator apply to the first expression to be evaluated
  // it is the one at the end of the chain of operation
  let firstEquationLastOperator = '';

  for (const expression of expressions) {
    const lastOperator = expression.chainOperator.slice(-1).toString();
    const solutionRange = getSolutionRange(expression.valueAsNumber, expression.operator);
    if (!solutionRange) {
      return undefined;
    }
    const equation: ISolverExpressionRange = {
      chainOperator: expression.chainOperator,
      solutionDomain: solutionRange,
    };
    const lastEquation = system.get(lastOperator);
    if (lastEquation) {
      // There cannot be two first equation to be evaluated
      if (firstEquationLastOperator !== '') {
        return undefined;
      }
      firstEquationToEvaluate = [ lastEquation, equation ];
      firstEquationLastOperator = lastOperator;
    } else {
      system.set(lastOperator, equation);
    }
  }
  // There should be a first expression to be evaluated
  if (!firstEquationToEvaluate) {
    return undefined;
  }
  // We delete the fist equation to be evaluated from the system of equation because it is a value returned
  system.delete(firstEquationLastOperator);

  return [ system, firstEquationToEvaluate ];
}
/**
 * Resolve the solution domain when we add a new expression and
 * returned the new domain with the next expression that has to be evaluated.
 * @param {ISolverExpressionRange} equation - Current solver expression.
 * @param {SolutionDomain} domain - Current solution domain of the system of equation.
 * @returns {[SolutionDomain, LastLogicalOperator] |
 *  undefined} If the equation can be solved returned the new domain and the next
 * indexed logical operator that has to be resolved.
 * The system of equation is indexed by their last logical operator hence
 * the next expression can be found using the returned operator.
 * An empty string is returned if it was the last expression instead of
 * undefined to simply implementation,
 * because the system of equation will retuned an undefined value with an empty string.
 */
export function resolveSolutionDomainWithAnExpression(equation: ISolverExpressionRange,
  domain: SolutionDomain):
  [SolutionDomain, LastLogicalOperator] | undefined {
  let localDomain = domain.clone();
  // To keep track of the last expression because we resolved all the not operator
  // next to the current last logical operator
  let i = equation.chainOperator.length - 1;
  // We find the last logical expression that has to be resolved
  let currentLastOperator = equation.chainOperator[i];
  if (!currentLastOperator) {
    return undefined;
  }
  i--;
  // Resolve the new domain
  localDomain = localDomain.add({ range: equation.solutionDomain, operator: currentLastOperator?.operator });

  currentLastOperator = equation.chainOperator[i];
  // If it was the last expression
  if (!currentLastOperator) {
    return [ localDomain, '' ];
  }
  // We solved all the NOT operator next to the last logical operator
  while (currentLastOperator?.operator === LogicOperator.Not) {
    localDomain = localDomain.add({ operator: currentLastOperator?.operator });
    i--;
    currentLastOperator = equation.chainOperator[i];
    // It the last operator was a NOT
    if (!currentLastOperator?.operator) {
      return [ localDomain, '' ];
    }
  }

  return [ localDomain, currentLastOperator.toString() ];
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
      chainOperator: [],

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
 * @returns {SolutionRange | undefined} The solution range associated with the value and the operator.
 */
export function getSolutionRange(value: number, operator: SparqlRelationOperator): SolutionRange | undefined {
  switch (operator) {
    case SparqlRelationOperator.GreaterThanRelation:
      return new SolutionRange([ value + Number.EPSILON, Number.POSITIVE_INFINITY ]);
    case SparqlRelationOperator.GreaterThanOrEqualToRelation:
      return new SolutionRange([ value, Number.POSITIVE_INFINITY ]);
    case SparqlRelationOperator.EqualThanRelation:
      return new SolutionRange([ value, value ]);
    case SparqlRelationOperator.LessThanRelation:
      return new SolutionRange([ Number.NEGATIVE_INFINITY, value - Number.EPSILON ]);
    case SparqlRelationOperator.LessThanOrEqualToRelation:
      return new SolutionRange([ Number.NEGATIVE_INFINITY, value ]);
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
    isSparqlOperandNumberType(rdfTermType) && !rdfTermValue.includes('.')
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
    default:
      return undefined;
  }
}
