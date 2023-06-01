import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import {
  MisformatedExpressionError,
  UnsupportedDataTypeError,
} from '../lib/error';
import { SolutionDomain } from '../lib/SolutionDomain';
import { SolutionInterval } from '../lib/SolutionInterval';
import {
  TreeRelationSolverInput,
  SparlFilterExpressionSolverInput,
} from '../lib/SolverInput';
import type {
  ISolverExpression,
} from '../lib/solverInterfaces';
import {
  SparqlOperandDataTypes,
} from '../lib/solverInterfaces';
import * as UtilSolver from '../lib/solverUtil';
import type { ITreeRelation } from '../lib/TreeMetadata';
import { SparqlRelationOperator } from '../lib/TreeMetadata';

const DF = new DataFactory<RDF.BaseQuad>();

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('SolverInput', () => {
  describe('TreeRelationSolverInput', () => {
    describe('constructor', () => {
      afterEach(() => {
        jest.spyOn(TreeRelationSolverInput, 'convertTreeRelationToSolverExpression')
          .mockRestore();
        jest.spyOn(UtilSolver, 'getSolutionInterval')
          .mockRestore();
      });

      it('should return an infinite domain when we cannot convert the TREE into a solver expression', () => {
        const expectedSolutionDomain =
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]);

        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '5',
            term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        jest.spyOn(TreeRelationSolverInput, 'convertTreeRelationToSolverExpression')
          .mockImplementation((): undefined => { return undefined; });
        const input = new TreeRelationSolverInput(relation, variable);

        expect(input.domain).toStrictEqual(expectedSolutionDomain);
        expect(input.variable).toBe('x');
        expect(input.treeRelation).toStrictEqual(relation);
      });

      it('should return an infinite domain when we cannot get the interval of the solver expression', () => {
        const expectedSolutionDomain =
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]);

        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '5',
            term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        jest.spyOn(UtilSolver, 'getSolutionInterval')
          .mockImplementation((): undefined => { return undefined; });
        const input = new TreeRelationSolverInput(relation, variable);

        expect(input.domain).toStrictEqual(expectedSolutionDomain);
        expect(input.variable).toBe('x');
        expect(input.treeRelation).toStrictEqual(relation);
      });

      it(`should return the right solver expression given a 
      well formated TREE relation with a supported type and operator`, () => {
        const expectedSolutionDomain =
          new SolutionInterval([ 5, 5 ]);

        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '5',
            term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        const input = new TreeRelationSolverInput(relation, variable);

        expect(input.domain).toStrictEqual(expectedSolutionDomain);
        expect(input.variable).toBe('x');
        expect(input.treeRelation).toStrictEqual(relation);
      });
    });

    describe('convertTreeRelationToSolverExpression', () => {
      it('given a TREE relation with all the parameters should return a valid expression', () => {
        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '5',
            term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        const expectedExpression: ISolverExpression = {
          variable,
          rawValue: '5',
          valueType: SparqlOperandDataTypes.Integer,
          valueAsNumber: 5,

          operator: SparqlRelationOperator.EqualThanRelation,
        };

        expect(TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable))
          .toStrictEqual(expectedExpression);
      });

      it('should return undefined given a relation witn a value term containing an unknowed value type', () => {
        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '5',
            term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#foo')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        expect(TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
      });

      it(`should return undefined given a relation with 
              a term containing an incompatible value in relation to its value type`, () => {
        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: 'a',
            term: DF.literal('a', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        expect(TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
      });

      it('should return undefined given a relation without a value and a type', () => {
        const relation: ITreeRelation = {
          remainingItems: 10,
          path: 'ex:path',
          node: 'https://www.example.be',
        };
        const variable = 'x';

        expect(TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
      });

      it('should return undefined given a relation without a value', () => {
        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          node: 'https://www.example.be',
        };
        const variable = 'x';

        expect(TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
      });

      it('should return undefined given a relation without a type', () => {
        const relation: ITreeRelation = {
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: 'a',
            term: DF.literal('a', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };
        const variable = 'x';

        expect(TreeRelationSolverInput.convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
      });
    });
  });

  describe('SparlFilterExpressionSolverInput', () => {
    describe('constructor', () => {
      afterEach(() => {
        jest.spyOn(SparlFilterExpressionSolverInput, 'recursifResolve')
          .mockRestore();
      });
      it('should return the solution domain if it is valid', () => {
        const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(
          new SolutionInterval([ 0, 1 ]),
        );
        jest.spyOn(SparlFilterExpressionSolverInput, 'recursifResolve')
          .mockReturnValue(expectedSolutionDomain);

        const expression = translate(`
                  SELECT * WHERE { ?x ?y ?z 
                  FILTER( ?x=2)
                  }`).input.expression;

        const input = new SparlFilterExpressionSolverInput(expression, 'x');

        expect(input.domain).toStrictEqual(expectedSolutionDomain);
        expect(input.variable).toBe('x');
        expect(input.filterExpression).toStrictEqual(expression);
      });

      it('should return an infinite domain if there is a misformated expression', () => {
        const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]),
        );

        jest.spyOn(SparlFilterExpressionSolverInput, 'recursifResolve')
          .mockImplementation(() => {
            throw new MisformatedExpressionError('foo');
          });

        const expression = translate(`
                  SELECT * WHERE { ?x ?y ?z 
                  FILTER( ?x=2)
                  }`).input.expression;

        const input = new SparlFilterExpressionSolverInput(expression, 'x');

        expect(input.domain).toStrictEqual(expectedSolutionDomain);
        expect(input.variable).toBe('x');
        expect(input.filterExpression).toStrictEqual(expression);
      });

      it('should return an infinite domain if there is a unsupported data type', () => {
        const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]),
        );

        jest.spyOn(SparlFilterExpressionSolverInput, 'recursifResolve')
          .mockImplementation(() => {
            throw new UnsupportedDataTypeError('foo');
          });

        const expression = translate(`
                  SELECT * WHERE { ?x ?y ?z 
                  FILTER( ?x=2)
                  }`).input.expression;

        const input = new SparlFilterExpressionSolverInput(expression, 'x');

        expect(input.domain).toStrictEqual(expectedSolutionDomain);
        expect(input.variable).toBe('x');
        expect(input.filterExpression).toStrictEqual(expression);
      });

      it(`should throw an error if there is an error that is not 
      cause by an unsupported datatype or a misformated expression`, () => {
        const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]),
        );

        jest.spyOn(SparlFilterExpressionSolverInput, 'recursifResolve')
          .mockImplementation(() => {
            throw new TypeError('foo');
          });

        const expression = translate(`
                  SELECT * WHERE { ?x ?y ?z 
                  FILTER( ?x=2)
                  }`).input.expression;

        expect(() => new SparlFilterExpressionSolverInput(expression, 'x')).toThrow();
      });
    });

    describe('resolveAFilterTerm', () => {
      it('given an algebra expression with all the solver expression parameters should return a valid expression',
        () => {
          const expression: Algebra.Expression = {
            type: Algebra.types.EXPRESSION,
            expressionType: Algebra.expressionTypes.OPERATOR,
            operator: '=',
            args: [
              {
                type: Algebra.types.EXPRESSION,
                expressionType: Algebra.expressionTypes.TERM,
                term: DF.variable('x'),
              },
              {
                type: Algebra.types.EXPRESSION,
                expressionType: Algebra.expressionTypes.TERM,
                term: DF.literal('6', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
            ],
          };
          const operator = SparqlRelationOperator.EqualThanRelation;
          const variable = 'x';
          const expectedSolverExpression: ISolverExpression = {
            variable,
            rawValue: '6',
            valueType: SparqlOperandDataTypes.Integer,
            valueAsNumber: 6,
            operator,
          };

          const resp = SparlFilterExpressionSolverInput
            .resolveAFilterTerm(expression, operator, variable);

          if (resp) {
            expect(resp).toStrictEqual(expectedSolverExpression);
          } else {
            expect(resp).toBeDefined();
          }
        });

      it('given an algebra expression without a variable than should return an misformated error', () => {
        const expression: Algebra.Expression = {
          type: Algebra.types.EXPRESSION,
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          args: [
            {
              type: Algebra.types.EXPRESSION,
              expressionType: Algebra.expressionTypes.TERM,
              term: DF.literal('6', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            },
          ],
        };
        const operator = SparqlRelationOperator.EqualThanRelation;

        expect(SparlFilterExpressionSolverInput.resolveAFilterTerm(expression, operator, 'x'))
          .toBeInstanceOf(MisformatedExpressionError);
      });

      it('given an algebra expression without a litteral than should return an misformated error', () => {
        const variable = 'x';
        const expression: Algebra.Expression = {
          type: Algebra.types.EXPRESSION,
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          args: [
            {
              type: Algebra.types.EXPRESSION,
              expressionType: Algebra.expressionTypes.TERM,
              term: DF.variable(variable),
            },
          ],
        };
        const operator = SparqlRelationOperator.EqualThanRelation;

        expect(SparlFilterExpressionSolverInput
          .resolveAFilterTerm(expression, operator, variable))
          .toBeInstanceOf(MisformatedExpressionError);
      });

      it('given an algebra expression without args than should return a misformated error', () => {
        const expression: Algebra.Expression = {
          type: Algebra.types.EXPRESSION,
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          args: [],
        };
        const operator = SparqlRelationOperator.EqualThanRelation;

        expect(SparlFilterExpressionSolverInput
          .resolveAFilterTerm(expression, operator, 'x'))
          .toBeInstanceOf(MisformatedExpressionError);
      });

      it(`given an algebra expression with a litteral containing an invalid datatype than 
              should return an unsupported datatype error`,
      () => {
        const variable = 'x';
        const expression: Algebra.Expression = {
          type: Algebra.types.EXPRESSION,
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          args: [
            {
              type: Algebra.types.EXPRESSION,
              expressionType: Algebra.expressionTypes.TERM,
              term: DF.variable(variable),
            },
            {
              type: Algebra.types.EXPRESSION,
              expressionType: Algebra.expressionTypes.TERM,
              term: DF.literal('6', DF.namedNode('http://www.w3.org/2001/XMLSchema#foo')),
            },
          ],
        };
        const operator = SparqlRelationOperator.EqualThanRelation;

        expect(SparlFilterExpressionSolverInput
          .resolveAFilterTerm(expression, operator, variable))
          .toBeInstanceOf(UnsupportedDataTypeError);
      });

      it(`given an algebra expression with a litteral containing a 
              literal that cannot be converted into number should return an unsupported datatype error`, () => {
        const variable = 'x';
        const expression: Algebra.Expression = {
          type: Algebra.types.EXPRESSION,
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          args: [
            {
              type: Algebra.types.EXPRESSION,
              expressionType: Algebra.expressionTypes.TERM,
              term: DF.variable(variable),
            },
            {
              type: Algebra.types.EXPRESSION,
              expressionType: Algebra.expressionTypes.TERM,
              term: DF.literal('6', DF.namedNode('http://www.w3.org/2001/XMLSchema#string')),
            },
          ],
        };
        const operator = SparqlRelationOperator.EqualThanRelation;

        expect(SparlFilterExpressionSolverInput
          .resolveAFilterTerm(expression, operator, variable))
          .toBeInstanceOf(UnsupportedDataTypeError);
      });
    });

    describe('recursifResolve', () => {
      it('given an algebra expression with an unsupported logic operator should throw an error', () => {
        const mock = jest.spyOn(UtilSolver, 'getSolutionInterval');
        mock.mockImplementation((): undefined => { return undefined; });

        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( ?x=2)
                }`).input.expression;

        expect(() => SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        )).toThrow();
        mock.mockRestore();
      });

      it('given an algebra expression with two logicals operators should return the valid solution domain', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( ?x=2 && ?x<5)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 2, 2 ]));

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it('given an algebra expression with one logical operators should return the valid solution domain', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(?x=2)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 2, 2 ]));

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it('given an algebra with a true statement should return an infinite domain', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(true)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]),
        );

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it('given an algebra with a false statement should return an empty domain', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(false)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        expect(resp.isDomainEmpty()).toBe(true);
      });

      it('given an algebra with a not true statement should return an empty domain', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(!true)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        expect(resp.isDomainEmpty()).toBe(true);
      });

      it('given an algebra with a not false statement should return an infinite domain', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(!false)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(
          new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]),
        );

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it('given an algebra expression with one not equal logical operators should return the valid solution domain',
        () => {
          const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(?x!=2)
                }`).input.expression;

          const resp = SparlFilterExpressionSolverInput.recursifResolve(
            expression,
            'x',
          );

          const expectedDomain = SolutionDomain.newWithInitialIntervals([
            new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(2) ]),
            new SolutionInterval([ nextUp(2), Number.POSITIVE_INFINITY ]),
          ]);

          expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
        });

      it(`given an algebra expression with two logicals operators with a double negation should 
              return the valid solution domain`, () => {
        const expression = translate(`
                  SELECT * WHERE { ?x ?y ?z 
                  FILTER( !(!(?x=2)) && ?x<5)
                  }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,

          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 2, 2 ]));

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it('given an algebra expression with a double negation it should cancel it', () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER(!(!(?x=2 && ?x<5)))
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,

          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 2, 2 ]));

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it(`given an algebra expression with two logicals operators 
              that cannot be satified should return an empty domain`, () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( ?x=2 && ?x>5)
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,

          'x',
        );

        expect(resp.isDomainEmpty()).toBe(true);
      });

      it(`given an algebra expression with two logicals operators that are negated
               should return the valid solution domain`, () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( !(?x=2 && ?x<5))
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,

          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(
          [ new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(2) ]),
            new SolutionInterval([ nextUp(2), Number.POSITIVE_INFINITY ]) ],
        );

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it(`given an algebra expression with two logicals operators that are triple negated
               should return the valid solution domain`, () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( !(!(!(?x=2 && ?x<5))))
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,

          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals(
          [ new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(2) ]),
            new SolutionInterval([ nextUp(2), Number.POSITIVE_INFINITY ]) ],
        );

        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it(`given an algebra expression with three logicals operators where the priority of operation should start with the not operator than 
              should return the valid solution domain`, () => {
        const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( ?x=2 && ?x>=1 || !(?x=3))
                }`).input.expression;

        const resp = SparlFilterExpressionSolverInput.recursifResolve(
          expression,
          'x',
        );

        const expectedDomain = SolutionDomain.newWithInitialIntervals([
          new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(3) ]),
          new SolutionInterval([ nextUp(3), Number.POSITIVE_INFINITY ]),
        ]);
        expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });
    });
  });
});
