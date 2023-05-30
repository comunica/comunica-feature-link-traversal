import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import {
  MisformatedFilterTermError,
  UnsupportedDataTypeError,
} from '../lib/error';
import { SolutionDomain } from '../lib/SolutionDomain';
import { SolutionInterval } from '../lib/SolutionInterval';
import {
  resolveAFilterTerm,
  isBooleanExpressionTreeRelationFilterSolvable,
  recursifResolve,
} from '../lib/solver';
import * as solverFunction from '../lib/solver';
import { LogicOperatorSymbol, SparqlOperandDataTypes } from '../lib/solverInterfaces';
import type {
  ISolverExpression,
} from '../lib/solverInterfaces';
import { SparqlRelationOperator } from '../lib/TreeMetadata';
import type { ITreeRelation } from '../lib/TreeMetadata';

import {
  convertTreeRelationToSolverExpression,
  areTypesCompatible,
  castSparqlRdfTermIntoNumber,
  filterOperatorToSparqlRelationOperator,
  getSolutionInterval,
  isSparqlOperandNumberType,
  reverseRawLogicOperator,
  reverseRawOperator,
  reverseSparqlOperator,
  inverseFilter
} from '../lib/util-solver';

import * as UtilSolver from '../lib/util-solver';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

const DF = new DataFactory<RDF.BaseQuad>();

describe('solver function', () => {
  describe('filterOperatorToSparqlRelationOperator', () => {
    it('should return the RelationOperator given a string representation', () => {
      const testTable: [string, SparqlRelationOperator][] = [
        ['=', SparqlRelationOperator.EqualThanRelation],
        ['<', SparqlRelationOperator.LessThanRelation],
        ['<=', SparqlRelationOperator.LessThanOrEqualToRelation],
        ['>', SparqlRelationOperator.GreaterThanRelation],
        ['>=', SparqlRelationOperator.GreaterThanOrEqualToRelation],
      ];

      for (const [value, expectedAnswer] of testTable) {
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
        ['19273', SparqlOperandDataTypes.Integer, 19_273],
        ['0', SparqlOperandDataTypes.NonPositiveInteger, 0],
        ['-12313459', SparqlOperandDataTypes.NegativeInteger, -12_313_459],
        ['121312321321321', SparqlOperandDataTypes.Long, 121_312_321_321_321],
        ['1213123213213213', SparqlOperandDataTypes.Short, 1_213_123_213_213_213],
        ['283', SparqlOperandDataTypes.NonNegativeInteger, 283],
        ['-12131293912831', SparqlOperandDataTypes.UnsignedLong, -12_131_293_912_831],
        ['-1234', SparqlOperandDataTypes.UnsignedInt, -1_234],
        ['-123341231231234', SparqlOperandDataTypes.UnsignedShort, -123_341_231_231_234],
        ['1234', SparqlOperandDataTypes.PositiveInteger, 1_234],
      ];

      for (const [value, valueType, expectedNumber] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBe(expectedNumber);
      }
    });

    it('should return undefined if a non integer is pass with SparqlOperandDataTypes integer compatible type', () => {
      const testTable: [string, SparqlOperandDataTypes][] = [
        ['asbd', SparqlOperandDataTypes.PositiveInteger],
        ['', SparqlOperandDataTypes.NegativeInteger],
      ];

      for (const [value, valueType] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBeUndefined();
      }
    });

    it('should return undefined if a non fraction is pass with SparqlOperandDataTypes fraction compatible type', () => {
      const testTable: [string, SparqlOperandDataTypes][] = [
        ['asbd', SparqlOperandDataTypes.Double],
        ['', SparqlOperandDataTypes.Float],
      ];

      for (const [value, valueType] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBeUndefined();
      }
    });

    it('should return the expected number when given an decimal', () => {
      const testTable: [string, SparqlOperandDataTypes, number][] = [
        ['1.1', SparqlOperandDataTypes.Decimal, 1.1],
        ['2132131.121321321', SparqlOperandDataTypes.Float, 2_132_131.121_321_321],
        ['1234.123', SparqlOperandDataTypes.Double, 1_234.123],
      ];

      for (const [value, valueType, expectedNumber] of testTable) {
        expect(castSparqlRdfTermIntoNumber(value, valueType)).toBe(expectedNumber);
      }
    });

    it('should return the expected number given a boolean', () => {
      const testTable: [string, number][] = [
        ['true', 1],
        ['false', 0],
      ];

      for (const [value, expectedNumber] of testTable) {
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

  describe('getSolutionRange', () => {
    it('given a boolean compatible RelationOperator and a value should return a valid SolutionRange', () => {
      const value = -1;
      const testTable: [SparqlRelationOperator, SolutionInterval][] = [
        [
          SparqlRelationOperator.GreaterThanRelation,
          new SolutionInterval([nextUp(value), Number.POSITIVE_INFINITY]),
        ],
        [
          SparqlRelationOperator.GreaterThanOrEqualToRelation,
          new SolutionInterval([value, Number.POSITIVE_INFINITY]),
        ],
        [
          SparqlRelationOperator.EqualThanRelation,
          new SolutionInterval([value, value]),
        ],
        [
          SparqlRelationOperator.LessThanRelation,
          new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(value)]),
        ],
        [
          SparqlRelationOperator.LessThanOrEqualToRelation,
          new SolutionInterval([Number.NEGATIVE_INFINITY, value]),
        ],
      ];

      for (const [operator, expectedRange] of testTable) {
        expect(getSolutionInterval(value, operator)).toStrictEqual(expectedRange);
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

    it('should return false when one type is not identical and the other are number', () => {
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

      expect(convertTreeRelationToSolverExpression(relation, variable)).toStrictEqual(expectedExpression);
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

      expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
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

      expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
    });

    it('should return undefined given a relation without a value and a type', () => {
      const relation: ITreeRelation = {
        remainingItems: 10,
        path: 'ex:path',
        node: 'https://www.example.be',
      };
      const variable = 'x';

      expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
    });

    it('should return undefined given a relation without a value', () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.EqualThanRelation,
        remainingItems: 10,
        path: 'ex:path',
        node: 'https://www.example.be',
      };
      const variable = 'x';

      expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
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

      expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
    });
  });

  describe('resolveAFilterTerm', () => {
    it('given an algebra expression with all the solver expression parameters should return a valid expression', () => {
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

      const resp = resolveAFilterTerm(expression, operator, variable);

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

      expect(resolveAFilterTerm(expression, operator, 'x')).toBeInstanceOf(MisformatedFilterTermError);
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

      expect(resolveAFilterTerm(expression, operator, variable))
        .toBeInstanceOf(MisformatedFilterTermError);
    });

    it('given an algebra expression without args than should return a misformated error', () => {
      const expression: Algebra.Expression = {
        type: Algebra.types.EXPRESSION,
        expressionType: Algebra.expressionTypes.OPERATOR,
        operator: '=',
        args: [],
      };
      const operator = SparqlRelationOperator.EqualThanRelation;

      expect(resolveAFilterTerm(expression, operator, 'x')).toBeInstanceOf(MisformatedFilterTermError);
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

        expect(resolveAFilterTerm(expression, operator, variable))
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

      expect(resolveAFilterTerm(expression, operator, variable))
        .toBeInstanceOf(UnsupportedDataTypeError);
    });
  });

  describe('recursifResolve', () => {

    it('given an algebra expression with an unsupported logic operator should throw an error', () => {
      const mock = jest.spyOn(UtilSolver, 'getSolutionInterval');
      mock.mockImplementation(() => undefined);

      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER( ?x=2)
      }`).input.expression;

      expect(() => recursifResolve(
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

      const resp = recursifResolve(
        expression,
        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([2, 2]));

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it('given an algebra expression with one logical operators should return the valid solution domain', () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER(?x=2)
      }`).input.expression;

      const resp = recursifResolve(
        expression,
        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([2, 2]));

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it('given an algebra with a true statement should return an infinite domain', () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER(true)
      }`).input.expression;

      const resp = recursifResolve(
        expression,
        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]));

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it('given an algebra with a false statement should return an empty domain', () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER(false)
      }`).input.expression;

      const resp = recursifResolve(
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

      const resp = recursifResolve(
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

      const resp = recursifResolve(
        expression,
        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]));

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it('given an algebra expression with one not equal logical operators should return the valid solution domain', () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER(?x!=2)
      }`).input.expression;

      const resp = recursifResolve(
        expression,
        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals([
        new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(2)]),
        new SolutionInterval([nextUp(2), Number.POSITIVE_INFINITY])
      ]);

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });


    it('given an algebra expression with two logicals operators with a double negation should return the valid solution domain', () => {
      const expression = translate(`
        SELECT * WHERE { ?x ?y ?z 
        FILTER( !(!(?x=2)) && ?x<5)
        }`).input.expression;

      const resp = recursifResolve(
        expression,

        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([2, 2]));

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it('given an algebra expression with a double negation it should cancel it', () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER(!(!(?x=2 && ?x<5)))
      }`).input.expression;

      const resp = recursifResolve(
        expression,

        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([2, 2]));

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it(`given an algebra expression with two logicals operators 
    that cannot be satified should return an empty domain`, () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER( ?x=2 && ?x>5)
      }`).input.expression;

      const resp = recursifResolve(
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

      const resp = recursifResolve(
        expression,

        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(
        [new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(2)]),
        new SolutionInterval([nextUp(2), Number.POSITIVE_INFINITY])],
      );

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it(`given an algebra expression with two logicals operators that are triple negated
     should return the valid solution domain`, () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER( !(!(!(?x=2 && ?x<5))))
      }`).input.expression;

      const resp = recursifResolve(
        expression,

        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals(
        [new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(2)]),
        new SolutionInterval([nextUp(2), Number.POSITIVE_INFINITY])],
      );

      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
    });

    it(`given an algebra expression with three logicals operators where the priority of operation should start with the not operator than 
    should return the valid solution domain`, () => {
      const expression = translate(`
      SELECT * WHERE { ?x ?y ?z 
      FILTER( ?x=2 && ?x>=1 || !(?x=3))
      }`).input.expression;

      const resp = recursifResolve(
        expression,
        'x',
      );

      const expectedDomain = SolutionDomain.newWithInitialIntervals([
        new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(3)]),
        new SolutionInterval([nextUp(3), Number.POSITIVE_INFINITY]),
      ]);
      expect(resp.getDomain()).toStrictEqual(expectedDomain.getDomain());
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });

    it('should return true given a relation and a filter operation where types are not compatible', () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.EqualThanRelation,
        remainingItems: 10,
        path: 'ex:path',
        value: {
          value: 'false',
          term: DF.literal('false', DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
        },
        node: 'https://www.example.be',
      };

      const filterExpression = translate(`
            SELECT * WHERE { ?x ?y ?z 
            FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });

    it('should return false given a relation and a filter operation where types are not compatible', () => {
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });

    it('should return true when the solution range is not valid of the relation', () => {
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });

    it('should return false when the filter expression has no solution ', () => {
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(false);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(false);
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

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          { relation, filterExpression, variable },
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

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          { relation, filterExpression, variable },
        ))
          .toBe(false);
      });

    it(`should return false when there is no solution for the filter
     expression with two expressions and the relation`, () => {
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(false);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });

    it('should accept the link given that recursifResolve return a SyntaxError', () => {
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(false);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

        expect(isBooleanExpressionTreeRelationFilterSolvable(
          { relation, filterExpression, variable },
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
        expect(isBooleanExpressionTreeRelationFilterSolvable(
          { relation, filterExpression, variable },
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });

    it(`should accept the link with a solvable boolean expression with a false boolean statement`, () => {
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(false);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(false);
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

      expect(isBooleanExpressionTreeRelationFilterSolvable({ relation, filterExpression, variable })).toBe(true);
    });
  });

  describe('reverseRawLogicOperator', () => {
    it('given an non existing operator should return undefined', () => {
      expect(reverseRawLogicOperator('foo')).toBeUndefined();
    });

    it('given an non existing operator should return undefined', () => {
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
      for (const operator of ['=', '!=', '<', '<=', '>', '>=']) {
        expect(reverseRawOperator(operator)).toBeDefined();
      }
    });
  });

  describe('reverseSparqlOperator',()=>{
    it('given an unsupported operator should return undefined',()=>{
      for(const operator of [
        SparqlRelationOperator.GeospatiallyContainsRelation,
        SparqlRelationOperator.SubstringRelation,
        SparqlRelationOperator.PrefixRelation
      ]){
        expect(reverseSparqlOperator(operator)).toBeUndefined();
      }
    });

    it('given a supported operator should return an operator',()=>{
      for(const operator of [
        SparqlRelationOperator.LessThanRelation,
        SparqlRelationOperator.LessThanOrEqualToRelation,
        SparqlRelationOperator.GreaterThanRelation,
        SparqlRelationOperator.GreaterThanOrEqualToRelation,
        SparqlRelationOperator.EqualThanRelation,
        SparqlRelationOperator.NotEqualThanRelation
      ]){
        expect(reverseSparqlOperator(operator)).toBeDefined();
      }
    });

  });
});
