import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import { InvalidExpressionSystem, MissMatchVariableError } from '../lib/error';
import { SolutionInterval } from '../lib/SolutionInterval';
import {
  isBooleanExpressionTreeRelationFilterSolvable,
} from '../lib/solver';
import {
  TreeRelationSolverInput,
  SparlFilterExpressionSolverInput,
} from '../lib/SolverInput';
import { LogicOperatorSymbol, SparqlOperandDataTypes } from '../lib/solverInterfaces';
import type {
  ISolverExpression,
} from '../lib/solverInterfaces';
import {
  areTypesCompatible,
  castSparqlRdfTermIntoNumber,
  filterOperatorToSparqlRelationOperator,
  getSolutionInterval,
  isSparqlOperandNumberType,
  reverseRawLogicOperator,
  reverseRawOperator,
  reverseSparqlOperator,
} from '../lib/solverUtil';
import { SparqlRelationOperator } from '../lib/TreeMetadata';
import type { ITreeRelation } from '../lib/TreeMetadata';
const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

const DF = new DataFactory<RDF.BaseQuad>();

describe('solver function', () => {
  describe('filterOperatorToSparqlRelationOperator', () => {
    it('should return the RelationOperator given a string representation', () => {
      const testTable: [string, SparqlRelationOperator][] = [
        [ '=', SparqlRelationOperator.EqualThanRelation ],
        [ '<', SparqlRelationOperator.LessThanRelation ],
        [ '<=', SparqlRelationOperator.LessThanOrEqualToRelation ],
        [ '>', SparqlRelationOperator.GreaterThanRelation ],
        [ '>=', SparqlRelationOperator.GreaterThanOrEqualToRelation ],
      ];

      for (const [ value, expectedAnswer ] of testTable) {
        expect(filterOperatorToSparqlRelationOperator(value)).toBe(expectedAnswer);
      }
    });
    it('should return undefined given a string not representing a RelationOperator', () => {
      expect(filterOperatorToSparqlRelationOperator('foo')).toBeUndefined();
    });
  });

  describe('isSparqlOperandNumberType', () => {
    it('should return true when a SparqlOperandDataTypes is a number type', () => {
      const testTable: SparqlOperandDataTypes[] = [
        SparqlOperandDataTypes.Integer,
        SparqlOperandDataTypes.NonPositiveInteger,
        SparqlOperandDataTypes.NegativeInteger,
        SparqlOperandDataTypes.Long,
        SparqlOperandDataTypes.Short,
        SparqlOperandDataTypes.NonNegativeInteger,
        SparqlOperandDataTypes.UnsignedLong,
        SparqlOperandDataTypes.UnsignedInt,
        SparqlOperandDataTypes.UnsignedShort,
        SparqlOperandDataTypes.PositiveInteger,
        SparqlOperandDataTypes.Double,
        SparqlOperandDataTypes.Float,
        SparqlOperandDataTypes.Decimal,
      ];

      for (const value of testTable) {
        expect(isSparqlOperandNumberType(value)).toBe(true);
      }
    });

    it('should return false when a SparqlOperandDataTypes is not a number', () => {
      const testTable: SparqlOperandDataTypes[] = [
        SparqlOperandDataTypes.String,
        SparqlOperandDataTypes.Boolean,
        SparqlOperandDataTypes.DateTime,
        SparqlOperandDataTypes.Byte,
      ];

      for (const value of testTable) {
        expect(isSparqlOperandNumberType(value)).toBe(false);
      }
    });
  });

  describe('castSparqlRdfTermIntoNumber', () => {
    it('should return the expected number when given an integer', () => {
      const testTable: [string, SparqlOperandDataTypes, number][] = [
        [ '19273', SparqlOperandDataTypes.Integer, 19_273 ],
        [ '0', SparqlOperandDataTypes.NonPositiveInteger, 0 ],
        [ '-12313459', SparqlOperandDataTypes.NegativeInteger, -12_313_459 ],
        [ '121312321321321', SparqlOperandDataTypes.Long, 121_312_321_321_321 ],
        [ '1213123213213213', SparqlOperandDataTypes.Short, 1_213_123_213_213_213 ],
        [ '283', SparqlOperandDataTypes.NonNegativeInteger, 283 ],
        [ '-12131293912831', SparqlOperandDataTypes.UnsignedLong, -12_131_293_912_831 ],
        [ '-1234', SparqlOperandDataTypes.UnsignedInt, -1_234 ],
        [ '-123341231231234', SparqlOperandDataTypes.UnsignedShort, -123_341_231_231_234 ],
        [ '1234', SparqlOperandDataTypes.PositiveInteger, 1_234 ],
      ];

      for (const [ value, valueType, expectedNumber ] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBe(expectedNumber);
      }
    });

    it('should return undefined if a non integer is pass with SparqlOperandDataTypes integer compatible type', () => {
      const testTable: [string, SparqlOperandDataTypes][] = [
        [ 'asbd', SparqlOperandDataTypes.PositiveInteger ],
        [ '', SparqlOperandDataTypes.NegativeInteger ],
      ];

      for (const [ value, valueType ] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBeUndefined();
      }
    });

    it('should return undefined if a non fraction is pass with SparqlOperandDataTypes fraction compatible type', () => {
      const testTable: [string, SparqlOperandDataTypes][] = [
        [ 'asbd', SparqlOperandDataTypes.Double ],
        [ '', SparqlOperandDataTypes.Float ],
      ];

      for (const [ value, valueType ] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBeUndefined();
      }
    });

    it('should return the expected number when given an decimal', () => {
      const testTable: [string, SparqlOperandDataTypes, number][] = [
        [ '1.1', SparqlOperandDataTypes.Decimal, 1.1 ],
        [ '2132131.121321321', SparqlOperandDataTypes.Float, 2_132_131.121_321_321 ],
        [ '1234.123', SparqlOperandDataTypes.Double, 1_234.123 ],
      ];

      for (const [ value, valueType, expectedNumber ] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBe(expectedNumber);
      }
    });

    it('should return the expected number given a boolean', () => {
      const testTable: [string, number][] = [
        [ 'true', 1 ],
        [ 'false', 0 ],
      ];

      for (const [ value, expectedNumber ] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, SparqlOperandDataTypes.Boolean)).toBe(expectedNumber);
      }
    });

    it('should return undefined if the boolean string is not "true" or "false"', () => {
      expect(castSparqlRdfTermIntoNumber('abc', SparqlOperandDataTypes.Boolean)).toBeUndefined();
    });

    it('should return the expected unix time given a date time', () => {
      const value = '1994-11-05T13:15:30Z';
      const expectedUnixTime = 784_041_330_000;

      expect(castSparqlRdfTermIntoNumber(
        value,
        SparqlOperandDataTypes.DateTime,
      )).toBe(expectedUnixTime);
    });

    it('should return undefined given a non date time', () => {
      const value = '1994-11-T13:15:30';

      expect(castSparqlRdfTermIntoNumber(
        value,
        SparqlOperandDataTypes.DateTime,
      )).toBeUndefined();
    });
  });

  describe('getSolutionInterval', () => {
    it('given a number compatible RelationOperator and a value should return a valid SolutionInterval', () => {
      const value = -1;
      const testTable: [SparqlRelationOperator, SolutionInterval][] = [
        [
          SparqlRelationOperator.GreaterThanRelation,
          new SolutionInterval([ nextUp(value), Number.POSITIVE_INFINITY ]),
        ],
        [
          SparqlRelationOperator.GreaterThanOrEqualToRelation,
          new SolutionInterval([ value, Number.POSITIVE_INFINITY ]),
        ],
        [
          SparqlRelationOperator.EqualThanRelation,
          new SolutionInterval([ value, value ]),
        ],
        [
          SparqlRelationOperator.LessThanRelation,
          new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(value) ]),
        ],
        [
          SparqlRelationOperator.LessThanOrEqualToRelation,
          new SolutionInterval([ Number.NEGATIVE_INFINITY, value ]),
        ],
      ];

      for (const [ operator, expectedinterval ] of testTable) {
        expect(getSolutionInterval(value, operator)).toStrictEqual(expectedinterval);
      }
    });

    it('should return undefined given an RelationOperator that is not boolean compatible', () => {
      const value = -1;
      const operator = SparqlRelationOperator.PrefixRelation;

      expect(getSolutionInterval(value, operator)).toBeUndefined();
    });
  });

  describe('areTypesCompatible', () => {
    it('given expression with identical value type should return true', () => {
      const expressions: ISolverExpression[] = [
        {
          variable: 'a',
          rawValue: 'true',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 1,
          operator: SparqlRelationOperator.EqualThanRelation,
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
        },
      ];

      expect(areTypesCompatible(expressions)).toBe(true);
    });

    it('should return true when all the types are numbers', () => {
      const expressions: ISolverExpression[] = [
        {
          variable: 'a',
          rawValue: 'true',
          valueType: SparqlOperandDataTypes.Int,
          valueAsNumber: 1,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.NonNegativeInteger,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Decimal,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
      ];

      expect(areTypesCompatible(expressions)).toBe(true);
    });

    it('should return false when one type is not identical', () => {
      const expressions: ISolverExpression[] = [
        {
          variable: 'a',
          rawValue: 'true',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 1,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Byte,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
      ];

      expect(areTypesCompatible(expressions)).toBe(false);
    });

    it('should return false when one type is not identical and the others are number', () => {
      const expressions: ISolverExpression[] = [
        {
          variable: 'a',
          rawValue: 'true',
          valueType: SparqlOperandDataTypes.UnsignedInt,
          valueAsNumber: 1,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Float,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Byte,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,

        },
      ];

      expect(areTypesCompatible(expressions)).toBe(false);
    });
  });

  describe('isBooleanExpressionTreeRelationFilterSolvable', () => {
    it('given a relation that is not able to be converted into a solverExpression should return true', () => {
      const relation: ITreeRelation = {
        node: 'https://www.example.com',
        value: {
          value: 'abc',
          term: DF.literal('abc', DF.namedNode('foo')),
        },
      };

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];
      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should return true given a relation and a filter operation where types are not compatible', () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.EqualThanRelation,
        remainingItems: 10,
        path: 'ex:path',
        value: {
          value: '5',
          term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#string')),
        },
        node: 'https://www.example.be',
      };

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';

      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should return true when the solution interval of the relation is not valid', () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.GeospatiallyContainsRelation,
        remainingItems: 10,
        path: 'ex:path',
        value: {
          value: '5',
          term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
        },
        node: 'https://www.example.be',
      };

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';

      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should return true when the equation system is not valid', () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.GeospatiallyContainsRelation,
        remainingItems: 10,
        path: 'ex:path',
        value: {
          value: '5',
          term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#string')),
        },
        node: 'https://www.example.be',
      };

      const filterExpression: Algebra.Expression = {
        type: Algebra.types.EXPRESSION,
        expressionType: Algebra.expressionTypes.OPERATOR,
        operator: '&&',
        args: [
          {
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
                term: DF.literal('2', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
            ],
          },
        ],
      };

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should return true when there is a solution for the filter expression and the relation', () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should return false when the filter expression has no solution', () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( ?x = 2 && ?x > 5 && ?x > 88.3)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(false);
    });

    it(`should return false when the filter has a possible 
    solution but the addition of the relation produce no possible solution`, () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.EqualThanRelation,
        remainingItems: 10,
        path: 'ex:path',
        value: {
          value: '100',
          term: DF.literal('100', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
        },
        node: 'https://www.example.be',
      };

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( !(?x=100 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(false);
    });

    it('should return true when there is a solution for the filter expression with one expression and the relation',
      () => {
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

        const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(?x>=5)
            }`).input.expression;

        const variable = 'x';
        const inputs = [
          new TreeRelationSolverInput(relation, variable),
          new SparlFilterExpressionSolverInput(filterExpression, variable),
        ];

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          inputs,
        ))
          .toBe(true);
      });

    it('should return false when there is no solution for the filter expression with one expression and the relation',
      () => {
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

        const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(?x>=6)
            }`).input.expression;

        const variable = 'x';
        const inputs = [
          new TreeRelationSolverInput(relation, variable),
          new SparlFilterExpressionSolverInput(filterExpression, variable),
        ];

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          inputs,
        ))
          .toBe(false);
      });

    it(`should return false when there is no solution for the filter
     expression with two expressions and a relation`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(?x>=6 && ?x>= 7)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(false);
    });

    it(`should return true when there is a solution for 
    the filter expression with one expression and the relation`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(?x>=5 && ?x>=-1)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should accept the link if the data type of the filter is unsupported', () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( ?x = 2 && ?x > "a" && ?x > 88.3)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should accept the link if a filter term with no args is not a boolean', () => {
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

      const filterExpression: Algebra.Expression =
      {
        type: Algebra.types.EXPRESSION,
        expressionType: Algebra.expressionTypes.TERM,
        term: DF.variable('x'),
      };

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should accept the link with a solvable simple filter',
      () => {
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

        const filterExpression = translate(`
          SELECT * WHERE { ?x ?y ?z 
          FILTER(?x>5)
          }`).input.expression;

        const variable = 'x';
        const inputs = [
          new TreeRelationSolverInput(relation, variable),
          new SparlFilterExpressionSolverInput(filterExpression, variable),
        ];

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          inputs,
        ))
          .toBe(false);
      });

    it('should refuse the link with an unsatisfiable bounded TREE node',
      () => {
        const relation: ITreeRelation = {
          type: SparqlRelationOperator.GreaterThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '10',
            term: DF.literal('10', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };

        const relationBound: ITreeRelation = {
          type: SparqlRelationOperator.LessThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '20',
            term: DF.literal('20', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };

        const filterExpression = translate(`
          SELECT * WHERE { ?x ?y ?z 
          FILTER(?x>30)
          }`).input.expression;

        const variable = 'x';
        const inputs = [
          new TreeRelationSolverInput(relation, variable),
          new TreeRelationSolverInput(relationBound, variable),
          new SparlFilterExpressionSolverInput(filterExpression, variable),
        ];

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          inputs,
        ))
          .toBe(false);
      });

    it('should refuse the link with an unsolvable simple filter',
      () => {
        const relation: ITreeRelation = {
          type: SparqlRelationOperator.EqualThanRelation,
          remainingItems: 10,
          path: 'ex:path',
          value: {
            value: '4.999',
            term: DF.literal('4.999', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
          },
          node: 'https://www.example.be',
        };

        const filterExpression = translate(`
          SELECT * WHERE { ?x ?y ?z 
          FILTER(?x>=5)
          }`).input.expression;

        const variable = 'x';
        const inputs = [
          new TreeRelationSolverInput(relation, variable),
          new SparlFilterExpressionSolverInput(filterExpression, variable),
        ];
        expect(isBooleanExpressionTreeRelationFilterSolvable(
          inputs,
        ))
          .toBe(false);
      });

    it(`should accept the link with a solvable boolean expression with a true boolean statement`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(!(?x<-1 || ?x<5) || true)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it(`should accept the link with a solvable boolean expression and a false boolean statement linked with an OR operator`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(!(?x<-1 || ?x<5) || false)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it(`should accept the link with a solvable simple boolean expression with a true boolean statement`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(?x = 5 || true)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it(`should accept the link with a solvable simple boolean and an and operator linked with a not expression inside a parenthesis`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER((?x > 2 && ?x<10) && !(?x>3 && ?x<4))
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it(`Should ignore the SPARQL function when prunning links`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER((?x = 5 && NOW() = true && false) || (false && NOW() = true))
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(false);
    });

    it(`Should ignore the SPARQL function when prunning links with complex filter expression`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER((?x = 5 && NOW() = true && false) || (?x = 5 && (NOW() = true || ?x >= 5)))
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it(`should prune a false filter expression`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(false)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(false);
    });

    it(`should keep a true filter expression`, () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(true)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should throw an error when there is two filter expressions', () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(true)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(() => isBooleanExpressionTreeRelationFilterSolvable(inputs)).toThrow(InvalidExpressionSystem);
    });

    it('should throw an error if there is no filter expression', () => {
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
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
      ];

      expect(() => isBooleanExpressionTreeRelationFilterSolvable(inputs)).toThrow(InvalidExpressionSystem);
    });

    it('should throw an error if there is no tree:Relation', () => {
      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(true)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new SparlFilterExpressionSolverInput(filterExpression, variable),
      ];

      expect(() => isBooleanExpressionTreeRelationFilterSolvable(inputs)).toThrow(InvalidExpressionSystem);
    });

    it('should return true if there is no inputs', () => {
      const inputs = [];

      expect(isBooleanExpressionTreeRelationFilterSolvable(inputs)).toBe(true);
    });

    it('should throw an error when there are multiple variables', () => {
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

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER(true)
            }`).input.expression;

      const variable = 'x';
      const inputs = [
        new TreeRelationSolverInput(relation, variable),
        new SparlFilterExpressionSolverInput(filterExpression, 'y'),
      ];

      expect(() => isBooleanExpressionTreeRelationFilterSolvable(inputs)).toThrow(MissMatchVariableError);
    });
  });

  describe('reverseRawLogicOperator', () => {
    it('given an non existing operator should return undefined', () => {
      expect(reverseRawLogicOperator('foo')).toBeUndefined();
    });

    it('given an existing operator should return an operator', () => {
      for (const operator in LogicOperatorSymbol) {
        expect(reverseRawLogicOperator(LogicOperatorSymbol[operator])).toBeDefined();
      }
    });
  });

  describe('reverseRawOperator', () => {
    it('given an invalid operator should return undefined', () => {
      expect(reverseRawOperator('')).toBeUndefined();
    });

    it('given a valid operator should return an operator', () => {
      for (const operator of [ '=', '!=', '<', '<=', '>', '>=' ]) {
        expect(reverseRawOperator(operator)).toBeDefined();
      }
    });
  });

  describe('reverseSparqlOperator', () => {
    it('given an unsupported operator should return undefined', () => {
      for (const operator of [
        SparqlRelationOperator.GeospatiallyContainsRelation,
        SparqlRelationOperator.SubstringRelation,
        SparqlRelationOperator.PrefixRelation,
      ]) {
        expect(reverseSparqlOperator(operator)).toBeUndefined();
      }
    });

    it('given a supported operator should return an operator', () => {
      for (const operator of [
        SparqlRelationOperator.LessThanRelation,
        SparqlRelationOperator.LessThanOrEqualToRelation,
        SparqlRelationOperator.GreaterThanRelation,
        SparqlRelationOperator.GreaterThanOrEqualToRelation,
        SparqlRelationOperator.EqualThanRelation,
        SparqlRelationOperator.NotEqualThanRelation,
      ]) {
        expect(reverseSparqlOperator(operator)).toBeDefined();
      }
    });
  });
});
