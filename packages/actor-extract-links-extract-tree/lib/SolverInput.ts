import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import {
  MissMatchVariableError,
  MisformatedExpressionError,
  UnsupportedDataTypeError,
} from './error';
import type { ILogicOperator } from './LogicOperator';
import { Or, operatorFactory } from './LogicOperator';
import { SolutionDomain } from './SolutionDomain';
import { SolutionInterval } from './SolutionInterval';
import { LogicOperatorReversed,
  LogicOperatorSymbol,
  SparqlOperandDataTypesReversed } from './solverInterfaces';
import type { ISolverInput,
  ISolverExpression,
  Variable,
  SparqlOperandDataTypes } from './solverInterfaces';
import {
  castSparqlRdfTermIntoNumber,
  filterOperatorToSparqlRelationOperator,
  getSolutionInterval,
  inverseFilter,
} from './solverUtil';
import type { ITreeRelation, SparqlRelationOperator } from './TreeMetadata';

const A_TRUE_EXPRESSION: SolutionInterval = new SolutionInterval(
  [ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ],
);
const A_FALSE_EXPRESSION: SolutionInterval = new SolutionInterval([]);

/**
 * The representation in the solver domain of a SPARQL filter expression
 */
export class SparlFilterExpressionSolverInput implements ISolverInput {
  public readonly filterExpression: Algebra.Expression;
  public readonly variable: Variable;
  public readonly domain: SolutionDomain;

  public constructor(filterExpression: Algebra.Expression, variable: Variable) {
    this.filterExpression = filterExpression;
    this.variable = variable;
    try {
      this.domain = SparlFilterExpressionSolverInput.recursifResolve(this.filterExpression, variable);
    } catch (error: unknown) {
      // A filter term was missformed we let the query engine return an error to the user and by precaution
      // we accept the link in case the error is from the solver and not the filter expression
      if (error instanceof MisformatedExpressionError) {
        this.domain = SolutionDomain.newWithInitialIntervals(A_TRUE_EXPRESSION);
      } else if (error instanceof UnsupportedDataTypeError) {
        // We don't support the data type so we will let the node be explored
        this.domain = SolutionDomain.newWithInitialIntervals(A_TRUE_EXPRESSION);
      } else {
        /* istanbul ignore next */
        // If it's unexpected error we throw it
        throw error;
      }
    } finally {
      this.freeze();
    }
  }

  private freeze(): void {
    Object.freeze(this);
    Object.freeze(this.domain);
    Object.freeze(this.variable);
  }

  /**
 * Recursively traverse the filter expression and calculate the domain until it get to the current expression.
 * It will thrown an error if the expression is badly formated or
 * if it's impossible to get the {@link SolutionInterval}.
 * @param {Algebra.Expression} filterExpression -
 * The current filter expression that we are traversing
 * @param {Variable} variable - The variable targeted inside the filter expression
 * @param {SolutionDomain} domain - The current resultant solution domain
 * @param {LogicOperatorSymbol} logicOperator
 * - The current logic operator that we have to apply to the boolean expression
 * @returns {SolutionDomain} The solution domain of the whole expression
 */
  public static recursifResolve(
    filterExpression: Algebra.Expression,
    variable: Variable,
    domain: SolutionDomain = new SolutionDomain(),
    logicOperator: ILogicOperator = new Or(),
  ): SolutionDomain {
    if (filterExpression.expressionType === Algebra.expressionTypes.TERM
    ) {
      // In that case we are confronted with a boolean expression
      if (filterExpression.term.value === 'false') {
        domain = logicOperator.apply({ interval: A_FALSE_EXPRESSION, domain });
      } else {
        domain = logicOperator.apply({ interval: A_TRUE_EXPRESSION, domain });
      }
    } else if (
    // If it's an array of terms then we should be able to create a solver expression.
      filterExpression.args[0].expressionType === Algebra.expressionTypes.TERM &&
            filterExpression.args.length === 2
    ) {
      const rawOperator = filterExpression.operator;
      const operator = filterOperatorToSparqlRelationOperator(rawOperator);
      if (operator && logicOperator.operatorName() !== LogicOperatorSymbol.Not) {
        const solverExpression = SparlFilterExpressionSolverInput
          .resolveAFilterTerm(filterExpression, operator, variable);
        let solutionInterval: SolutionInterval | [SolutionInterval, SolutionInterval] | undefined;
        if (solverExpression instanceof MissMatchVariableError) {
          solutionInterval = A_TRUE_EXPRESSION;
        } else if (solverExpression instanceof Error) {
          throw solverExpression;
        } else {
          solutionInterval = getSolutionInterval(solverExpression.valueAsNumber, solverExpression.operator);
          if (!solutionInterval) {
            throw new UnsupportedDataTypeError('The operator is not supported');
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
          // To solve the not operation we rewrite the path of the filter expression to reverse every operation
          // e.g, = : != ; > : <=
          if (logicOperatorSymbol === LogicOperatorSymbol.Not) {
            inverseFilter(arg);
            domain = this.recursifResolve(arg, variable, domain, logicOperator);
          } else {
            const newLogicOperator = operatorFactory(logicOperatorSymbol);
            domain = this.recursifResolve(arg, variable, domain, newLogicOperator);
          }
        }
      }
    }
    return domain;
  }

  /**
 * From an Algebra expression return an solver expression if possible.
 * @param {Algebra.Expression} expression - {@link Algebra} expression containing the a variable and a litteral
 * @param {SparqlRelationOperator} operator - the SPARQL operator defining the expression.
 * @param {Variable} variable - the variable the expression should have to be part of a system of equation
 * @returns {ISolverExpression | undefined} Return a {@link ISolverExpression} if it can be satisfy
 */
  public static resolveAFilterTerm(expression: Algebra.Expression,
    operator: SparqlRelationOperator,
    variable: Variable):
    ISolverExpression | Error {
    let rawValue: string | undefined;
    let valueType: SparqlOperandDataTypes | undefined;
    let valueAsNumber: number | undefined;
    let hasVariable = false;

    // Find the constituent element of the solver expression
    for (const arg of expression.args) {
      if ('term' in arg && arg.term.termType === 'Variable') {
        // Check if the expression has the same variable as the one of the solver
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
    // Return if a fully form solver expression
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

    return new MisformatedExpressionError(`the filter expressions doesn't have the term ${missingTerm.toString()}`);
  }
}

/**
 * The representation in the solver domain of a tree:Relation
 */
export class TreeRelationSolverInput implements ISolverInput {
  public readonly domain: SolutionInterval | [SolutionInterval, SolutionInterval];
  public readonly treeRelation: ITreeRelation;
  public readonly variable: Variable;

  public constructor(relation: ITreeRelation, variable: Variable) {
    this.treeRelation = relation;
    this.variable = variable;

    const relationsolverExpressions = TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable);
    // The relation doesn't have a value or a type, so we follow the link
    if (!relationsolverExpressions) {
      this.domain = A_TRUE_EXPRESSION;
      this.freeze();
      return;
    }

    const relationSolutionInterval = getSolutionInterval(
      relationsolverExpressions.valueAsNumber,
      relationsolverExpressions.operator,
    );
    // We don't prune the relation because we do not implement yet the solution range for this expression
    if (!relationSolutionInterval) {
      this.domain = A_TRUE_EXPRESSION;
      this.freeze();
      return;
    }
    this.domain = relationSolutionInterval;

    this.freeze();
  }

  private freeze(): void {
    Object.freeze(this);
    Object.freeze(this.domain);
    Object.freeze(this.variable);
    Object.freeze(this.treeRelation);
  }

  /**
 * Convert a TREE relation into a {@link ISolverExpression}.
 * @param {ITreeRelation} relation - TREE relation
 * @param {Variable} variable - variable of the SPARQL query associated with the tree:path of the relation
 * @returns {ISolverExpression | undefined} Resulting {@link ISolverExpression} if the data type is supported by SPARQL
 * and the value can be cast into a number
 */
  public static convertTreeRelationToSolverExpression(relation: ITreeRelation,
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
}
