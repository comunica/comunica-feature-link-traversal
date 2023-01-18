import type { ITreeRelation } from '@comunica/types-link-traversal';
import { SparqlRelationOperator } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import { LinkOperator } from '../lib/LinkOperator';
import { SolutionDomain } from '../lib/SolutionDomain';
import { SolutionRange } from '../lib/SolutionRange';
import {
  filterOperatorToSparqlRelationOperator,
  isSparqlOperandNumberType,
  castSparqlRdfTermIntoNumber,
  getSolutionRange,
  areTypesCompatible,
  convertTreeRelationToSolverExpression,
  resolveSolutionDomainWithAnExpression,
  createEquationSystem,
  resolveSolutionDomainEquationSystem,
  resolveAFilterTerm,
  recursifFilterExpressionToSolverExpression,
  isRelationFilterExpressionDomainEmpty,
} from '../lib/solver';
import { SparqlOperandDataTypes, LogicOperator } from '../lib/solverInterfaces';
import type { ISolverExpression,
  ISolverExpressionRange,
  SolverEquationSystem,
  Variable } from '../lib/solverInterfaces';

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
        [ '1.6751', SparqlOperandDataTypes.Integer ],
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

  describe('getSolutionRange', () => {
    it('given a boolean compatible RelationOperator and a value should return a valid SolutionRange', () => {
      const value = -1;
      const testTable: [SparqlRelationOperator, SolutionRange][] = [
        [
          SparqlRelationOperator.GreaterThanRelation,
          new SolutionRange([ value + Number.EPSILON, Number.POSITIVE_INFINITY ]),
        ],
        [
          SparqlRelationOperator.GreaterThanOrEqualToRelation,
          new SolutionRange([ value, Number.POSITIVE_INFINITY ]),
        ],
        [
          SparqlRelationOperator.EqualThanRelation,
          new SolutionRange([ value, value ]),
        ],
        [
          SparqlRelationOperator.LessThanRelation,
          new SolutionRange([ Number.NEGATIVE_INFINITY, value - Number.EPSILON ]),
        ],
        [
          SparqlRelationOperator.LessThanOrEqualToRelation,
          new SolutionRange([ Number.NEGATIVE_INFINITY, value ]),
        ],
      ];

      for (const [ operator, expectedRange ] of testTable) {
        expect(getSolutionRange(value, operator)).toStrictEqual(expectedRange);
      }
    });

    it('should return undefined given an RelationOperator that is not boolean compatible', () => {
      const value = -1;
      const operator = SparqlRelationOperator.PrefixRelation;

      expect(getSolutionRange(value, operator)).toBeUndefined();
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
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
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
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.NonNegativeInteger,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Decimal,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
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
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Boolean,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Byte,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
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
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Float,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
        },
        {
          variable: 'a',
          rawValue: 'false',
          valueType: SparqlOperandDataTypes.Byte,
          valueAsNumber: 0,
          operator: SparqlRelationOperator.EqualThanRelation,
          chainOperator: [],
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
        chainOperator: [],
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

  describe('resolveSolutionDomainWithAnExpression', () => {
    it(`given an empty domain and an equation with 2 operation chained 
    that are not "NOT" should return a valid new domain and the last chained operator`, () => {
      const domain = new SolutionDomain();
      const equation: ISolverExpressionRange = {
        chainOperator: [
          new LinkOperator(LogicOperator.And),
          new LinkOperator(LogicOperator.Or),
        ],
        solutionDomain: new SolutionRange([ 0, 1 ]),
      };

      const expectedDomain = SolutionDomain.newWithInitialValue(equation.solutionDomain);
      const expectedLastLogicalOperator = equation.chainOperator[equation.chainOperator.length - 2].toString();

      const resp = resolveSolutionDomainWithAnExpression(equation, domain);
      if (resp) {
        const [ respDomain, respLastLogicalOperator ] = resp;
        expect(respDomain.get_domain()).toStrictEqual(expectedDomain.get_domain());
        expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it(`given a domain and an equation with multiple chained that are 
    not "NOT" should return a valid new domain and the next chained operator`, () => {
      const domain = SolutionDomain.newWithInitialValue(new SolutionRange([ 0, 1 ]));
      const equation: ISolverExpressionRange = {
        chainOperator: [
          new LinkOperator(LogicOperator.And),
          new LinkOperator(LogicOperator.Or),
          new LinkOperator(LogicOperator.Or),
          new LinkOperator(LogicOperator.And),
          new LinkOperator(LogicOperator.Or),
        ],
        solutionDomain: new SolutionRange([ 100, 221.3 ]),
      };
      const expectedOperator = equation.chainOperator[equation.chainOperator.length - 1];
      if (!expectedOperator) {
        fail('should be able to get the expected operator check the test implementation');
      }
      const expectedDomain = domain.add(
        {
          range: equation.solutionDomain,
          operator: expectedOperator.operator,
        },
      );
      const expectedLastLogicalOperator = equation.chainOperator[equation.chainOperator.length - 2].toString();

      const resp = resolveSolutionDomainWithAnExpression(equation, domain);
      if (resp) {
        const [ respDomain, respLastLogicalOperator ] = resp;
        expect(respDomain.get_domain()).toStrictEqual(expectedDomain.get_domain());
        expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it(`given a domain and an equation one chained operation 
    should return a valid new domain and an empty string has the next chained operator`, () => {
      const domain = SolutionDomain.newWithInitialValue(new SolutionRange([ 0, 1 ]));
      const equation: ISolverExpressionRange = {
        chainOperator: [
          new LinkOperator(LogicOperator.Or),
        ],
        solutionDomain: new SolutionRange([ 100, 221.3 ]),
      };

      const expectedOperator = equation.chainOperator[equation.chainOperator.length - 1];
      if (!expectedOperator) {
        fail('should be able to get the expected operator check the test implementation');
      }

      const expectedDomain = domain.add(
        {
          range: equation.solutionDomain,
          operator: expectedOperator.operator,
        },
      );
      const expectedLastLogicalOperator = '';

      const resp = resolveSolutionDomainWithAnExpression(equation, domain);
      if (resp) {
        const [ respDomain, respLastLogicalOperator ] = resp;
        expect(respDomain.get_domain()).toStrictEqual(expectedDomain.get_domain());
        expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it(`given a domain and an equation with multiple chainned operator where the later elements 
    are "NOT" operators and the last element an "AND"
     operator should return a valid domain and the next last operator`, () => {
      const domain = SolutionDomain.newWithInitialValue(new SolutionRange([ 0, 1 ]));
      const equation: ISolverExpressionRange = {
        chainOperator: [
          new LinkOperator(LogicOperator.And),
          new LinkOperator(LogicOperator.Not),
          new LinkOperator(LogicOperator.Not),
          new LinkOperator(LogicOperator.Or),
        ],
        solutionDomain: new SolutionRange([ 100, 221.3 ]),
      };

      const expectedOperator = equation.chainOperator[equation.chainOperator.length - 1];
      if (!expectedOperator) {
        fail('should be able to get the expected operator check the test implementation');
      }

      let expectedDomain = domain.add(
        {
          range: equation.solutionDomain,
          operator: expectedOperator.operator,
        },
      );
      expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });
      expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });

      const expectedLastLogicalOperator = equation.chainOperator[0].toString();

      const resp = resolveSolutionDomainWithAnExpression(equation, domain);
      if (resp) {
        const [ respDomain, respLastLogicalOperator ] = resp;
        expect(respDomain).toStrictEqual(expectedDomain);
        expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it(`given a domain and an equation with multiple chainned operator 
    where the last elements are "NOT" operators should 
    return a valid domain and an empty string as the next operator`, () => {
      const domain = SolutionDomain.newWithInitialValue(new SolutionRange([ 0, 1 ]));
      const equation: ISolverExpressionRange = {
        chainOperator: [
          new LinkOperator(LogicOperator.Not),
          new LinkOperator(LogicOperator.Not),
          new LinkOperator(LogicOperator.Or),
        ],
        solutionDomain: new SolutionRange([ 100, 221.3 ]),
      };

      const expectedOperator = equation.chainOperator[equation.chainOperator.length - 1];
      if (!expectedOperator) {
        fail('should be able to get the expected operator check the test implementation');
      }

      let expectedDomain = domain.add(
        {
          range: equation.solutionDomain,
          operator: expectedOperator.operator,
        },
      );
      expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });
      expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });

      const expectedLastLogicalOperator = '';

      const resp = resolveSolutionDomainWithAnExpression(equation, domain);
      if (resp) {
        const [ respDomain, respLastLogicalOperator ] = resp;
        expect(respDomain).toStrictEqual(expectedDomain);
        expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it('given an empty domain and an equation with no chained operation should return undefined', () => {
      const domain = new SolutionDomain();
      const equation: ISolverExpressionRange = {
        chainOperator: [],
        solutionDomain: new SolutionRange([ 0, 1 ]),
      };

      expect(resolveSolutionDomainWithAnExpression(equation, domain)).toBeUndefined();
    });
  });

  describe('createEquationSystem', () => {
    it(`given multiple equations that are consistent with one
     and another should return a valid equation system and the first equation to resolve`, () => {
      const lastOperator = new LinkOperator(LogicOperator.And);
      const firstOperator = new LinkOperator(LogicOperator.Or);
      const secondOperator = new LinkOperator(LogicOperator.Or);
      const thirdOperator = new LinkOperator(LogicOperator.Not);
      const aVariable = 'x';
      const aRawValue = '1';
      const aValueType = SparqlOperandDataTypes.Int;
      const avalueAsNumber = 1;
      const anOperator = SparqlRelationOperator.EqualThanRelation;

      const operationTemplate = (c: LinkOperator[]): ISolverExpression => {
        return {
          variable: aVariable,
          rawValue: aRawValue,
          valueType: aValueType,
          valueAsNumber: avalueAsNumber,
          operator: anOperator,
          chainOperator: c,
        };
      };

      const firstOperation = operationTemplate([ firstOperator ]);
      const firstEquation: ISolverExpressionRange = {
        chainOperator: firstOperation.chainOperator,
        solutionDomain: new SolutionRange([ 1, 1 ]),
      };
      const secondOperation = operationTemplate([ firstOperator, secondOperator ]);
      const secondEquation: ISolverExpressionRange = {
        chainOperator: secondOperation.chainOperator,
        solutionDomain: new SolutionRange([ 1, 1 ]),
      };
      const thirdOperation = operationTemplate([ firstOperator, secondOperator, thirdOperator ]);
      const thirdEquation: ISolverExpressionRange = {
        chainOperator: thirdOperation.chainOperator,
        solutionDomain: new SolutionRange([ 1, 1 ]),
      };
      const lastOperation1 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);
      const expectedFirstEquation1: ISolverExpressionRange = {
        chainOperator: lastOperation1.chainOperator,
        solutionDomain: new SolutionRange([ 1, 1 ]),
      };
      const lastOperation2 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);
      const expectedFirstEquation2: ISolverExpressionRange = {
        chainOperator: lastOperation2.chainOperator,
        solutionDomain: new SolutionRange([ 1, 1 ]),
      };

      const equations: ISolverExpression[] = [
        firstOperation,
        secondOperation,
        thirdOperation,
        lastOperation1,
        lastOperation2,
      ];
      equations.sort(() => Math.random() - 0.5);

      const expectedEquationSystem: SolverEquationSystem = new Map([
        [ firstOperator.toString(), firstEquation ],
        [ secondOperator.toString(), secondEquation ],
        [ thirdOperator.toString(), thirdEquation ],
      ]);

      const resp = createEquationSystem(equations);
      if (!Array.isArray(resp)) {
        fail('should return an array');
      }
      else if (resp) {
        const [ respEquationSystem, [ respFirstEquation1, respFirstEquation2 ]] = resp;
        expect(respEquationSystem).toStrictEqual(expectedEquationSystem);
        expect(respFirstEquation1).toStrictEqual(expectedFirstEquation1);
        expect(respFirstEquation2).toStrictEqual(expectedFirstEquation2);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it(`given multiples equations where it is not possible to 
    get the solution range of an equation it should return undefined`, () => {
      const lastOperator = new LinkOperator(LogicOperator.And);
      const firstOperator = new LinkOperator(LogicOperator.Or);
      const secondOperator = new LinkOperator(LogicOperator.Or);
      const thirdOperator = new LinkOperator(LogicOperator.Not);
      const aVariable = 'x';
      const aRawValue = '1';
      const aValueType = SparqlOperandDataTypes.Int;
      const avalueAsNumber = 1;
      const anOperator = SparqlRelationOperator.EqualThanRelation;

      const operationTemplate = (c: LinkOperator[]): ISolverExpression => {
        return {
          variable: aVariable,
          rawValue: aRawValue,
          valueType: aValueType,
          valueAsNumber: avalueAsNumber,
          operator: anOperator,
          chainOperator: c,
        };
      };

      const firstOperation = {
        variable: aVariable,
        rawValue: aRawValue,
        valueType: aValueType,
        valueAsNumber: avalueAsNumber,
        operator: SparqlRelationOperator.GeospatiallyContainsRelation,
        chainOperator: [ firstOperator ],
      };
      const secondOperation = operationTemplate([ firstOperator, secondOperator ]);
      const thirdOperation = operationTemplate([ firstOperator, secondOperator, thirdOperator ]);
      const lastOperation1 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);
      const lastOperation2 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);

      const equations: ISolverExpression[] = [
        firstOperation,
        secondOperation,
        thirdOperation,
        lastOperation1,
        lastOperation2,
      ];
      equations.sort(() => Math.random() - 0.5);

      expect(createEquationSystem(equations)).toBeUndefined();
    });

    it(`given multiples equations where there is multiple equation 
    that could be the first equation to be resolved it should return undefined`, () => {
      const lastOperator = new LinkOperator(LogicOperator.And);
      const firstOperator = new LinkOperator(LogicOperator.Or);
      const secondOperator = new LinkOperator(LogicOperator.Or);
      const thirdOperator = new LinkOperator(LogicOperator.Not);
      const aVariable = 'x';
      const aRawValue = '1';
      const aValueType = SparqlOperandDataTypes.Int;
      const avalueAsNumber = 1;
      const anOperator = SparqlRelationOperator.EqualThanRelation;

      const operationTemplate = (c: LinkOperator[]): ISolverExpression => {
        return {
          variable: aVariable,
          rawValue: aRawValue,
          valueType: aValueType,
          valueAsNumber: avalueAsNumber,
          operator: anOperator,
          chainOperator: c,
        };
      };

      const firstOperation = operationTemplate([ firstOperator ]);
      const secondOperation = operationTemplate([ firstOperator, secondOperator ]);
      const thirdOperation = operationTemplate([ firstOperator, secondOperator, thirdOperator ]);
      const lastOperation1 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);
      const lastOperation2 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);
      const lastOperation3 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);

      const equations: ISolverExpression[] = [
        firstOperation,
        secondOperation,
        thirdOperation,
        lastOperation1,
        lastOperation2,
        lastOperation3,
      ];
      equations.sort(() => Math.random() - 0.5);

      expect(createEquationSystem(equations)).toBeUndefined();
    });

    it('given multiples equations where there is no first equation to be resolved should return undefined', () => {
      const lastOperator = new LinkOperator(LogicOperator.And);
      const firstOperator = new LinkOperator(LogicOperator.Or);
      const secondOperator = new LinkOperator(LogicOperator.Or);
      const thirdOperator = new LinkOperator(LogicOperator.Not);
      const aVariable = 'x';
      const aRawValue = '1';
      const aValueType = SparqlOperandDataTypes.Int;
      const avalueAsNumber = 1;
      const anOperator = SparqlRelationOperator.EqualThanRelation;

      const operationTemplate = (c: LinkOperator[]): ISolverExpression => {
        return {
          variable: aVariable,
          rawValue: aRawValue,
          valueType: aValueType,
          valueAsNumber: avalueAsNumber,
          operator: anOperator,
          chainOperator: c,
        };
      };

      const firstOperation = {
        variable: aVariable,
        rawValue: aRawValue,
        valueType: aValueType,
        valueAsNumber: avalueAsNumber,
        operator: SparqlRelationOperator.GeospatiallyContainsRelation,
        chainOperator: [ firstOperator ],
      };
      const secondOperation = operationTemplate([ firstOperator, secondOperator ]);
      const thirdOperation = operationTemplate([ firstOperator, secondOperator, thirdOperator ]);
      const lastOperation1 = operationTemplate([ firstOperator, secondOperator, thirdOperator, lastOperator ]);

      const equations: ISolverExpression[] = [
        firstOperation,
        secondOperation,
        thirdOperation,
        lastOperation1,
      ];
      equations.sort(() => Math.random() - 0.5);

      expect(createEquationSystem(equations)).toBeUndefined();
    });

    it('given an equation should return a valid system of equation', () => {
      const equation: ISolverExpression[] = [
        {
          chainOperator: [],
          operator: SparqlRelationOperator.EqualThanRelation,
          rawValue: '88',
          valueAsNumber: 88,
          valueType: SparqlOperandDataTypes.Int,
          variable: 'x',
        },
      ];

      const expectedEquationSystem: ISolverExpressionRange = {
        chainOperator: [],
        solutionDomain: new SolutionRange([ 88, 88 ]),
      };

      const resp = createEquationSystem(equation);
      if (Array.isArray(resp)) {
        fail('should not return an array');
      }
      else if (resp && !Array.isArray(resp)) {
        expect(resp).toStrictEqual(expectedEquationSystem);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it('given two equations should return a valid system of equation', () => {
      const lastOperator = new LinkOperator(LogicOperator.And);

      const equation: ISolverExpression[] = [
        {
          chainOperator: [ lastOperator ],
          operator: SparqlRelationOperator.EqualThanRelation,
          rawValue: '88',
          valueAsNumber: 88,
          valueType: SparqlOperandDataTypes.Int,
          variable: 'x',
        },
        {
          chainOperator: [ lastOperator ],
          operator: SparqlRelationOperator.EqualThanRelation,
          rawValue: '33',
          valueAsNumber: 33,
          valueType: SparqlOperandDataTypes.Int,
          variable: 'x',
        },
      ];

      const expectedFirstEquation1: ISolverExpressionRange = {
        chainOperator: [ lastOperator ],
        solutionDomain: new SolutionRange([ 88, 88 ]),
      };
      const expectedFirstEquation2: ISolverExpressionRange = {
        chainOperator: [ lastOperator ],
        solutionDomain: new SolutionRange([ 33, 33 ]),
      };

      const resp = createEquationSystem(equation);
      if (!Array.isArray(resp)) {
        fail('should return an array');
      }
      else if (resp && Array.isArray(resp)) {
        const [ respEquationSystem, [ respFirstEquation1, respFirstEquation2 ]] = resp;
        expect(respEquationSystem.size).toBe(0);
        expect(respFirstEquation1).toStrictEqual(expectedFirstEquation1);
        expect(respFirstEquation2).toStrictEqual(expectedFirstEquation2);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it('given one equation where one we cannot derived a solution range should return undefined', () => {
      const lastOperator = new LinkOperator(LogicOperator.And);

      const equation: ISolverExpression[] = [
        {
          chainOperator: [ lastOperator ],
          operator: SparqlRelationOperator.GeospatiallyContainsRelation,
          rawValue: '88',
          valueAsNumber: 88,
          valueType: SparqlOperandDataTypes.Int,
          variable: 'x',
        },
      ];

      const resp = createEquationSystem(equation);

      expect(resp).toBeUndefined();
    });
  });

  describe('resolveSolutionDomainEquationSystem', () => {
    it('should return a valid domain given a valid equation system', () => {
      const firstOperator = new LinkOperator(LogicOperator.Or);
      const secondOperator = new LinkOperator(LogicOperator.And);
      const thirdOperator = new LinkOperator(LogicOperator.Not);
      const forthOperator = new LinkOperator(LogicOperator.Or);
      const fifthOperator = new LinkOperator(LogicOperator.And);
      const firstEquation: ISolverExpressionRange = {
        solutionDomain: new SolutionRange([ Number.NEGATIVE_INFINITY, 33 ]),
        chainOperator: [
          firstOperator,
        ],
      };

      const secondEquation: ISolverExpressionRange = {
        solutionDomain: new SolutionRange([ 75, 75 ]),
        chainOperator: [
          firstOperator,
          secondOperator,
        ],
      };

      const thirdEquation: ISolverExpressionRange = {
        solutionDomain: new SolutionRange([ 100, Number.POSITIVE_INFINITY ]),
        chainOperator: [
          firstOperator,
          secondOperator,
          thirdOperator,
          forthOperator,
        ],
      };
      const lastOperatorFirstEquation = firstEquation.chainOperator[firstEquation.chainOperator.length - 1];
      const lastOperatorSecondEquation = secondEquation.chainOperator[secondEquation.chainOperator.length - 1];
      const lastOperatorThirdEquation = thirdEquation.chainOperator[thirdEquation.chainOperator.length - 1];
      if (
        !(lastOperatorFirstEquation &&
        lastOperatorSecondEquation &&
        lastOperatorThirdEquation)
      ) {
        fail('should be able to retrieved the last chain operator of the equation check the test implementation');
      }
      const equationSystem: SolverEquationSystem = new Map([
        [ lastOperatorFirstEquation.toString(), firstEquation ],
        [ lastOperatorSecondEquation.toString(), secondEquation ],
        [ lastOperatorThirdEquation.toString(), thirdEquation ],
      ]);

      const firstEquationToSolve: [ISolverExpressionRange, ISolverExpressionRange] = [
        {
          solutionDomain: new SolutionRange([ 1_000, Number.POSITIVE_INFINITY ]),
          chainOperator: [
            firstOperator,
            secondOperator,
            thirdOperator,
            forthOperator,
            fifthOperator,
          ],
        },
        {
          solutionDomain: new SolutionRange([ Number.NEGATIVE_INFINITY, 33 + Number.EPSILON ]),
          chainOperator: [
            firstOperator,
            secondOperator,
            thirdOperator,
            forthOperator,
            fifthOperator,
          ],
        },
      ];
      // Nothing => [100, infinity] =>[-infinity, 100- epsilon] => [75,75]=> [75, 75], [-infinity, 33]
      const expectedDomain: SolutionRange[] = [
        new SolutionRange([ Number.NEGATIVE_INFINITY, 33 ]),
        new SolutionRange([ 75, 75 ]),
      ];

      const resp = resolveSolutionDomainEquationSystem(equationSystem, firstEquationToSolve);

      if (resp) {
        expect(resp.get_domain()).toStrictEqual(expectedDomain);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it('should return undefined an equation system where the chain of operator is inconsistent', () => {
      const firstOperator = new LinkOperator(LogicOperator.Or);
      const secondOperator = new LinkOperator(LogicOperator.And);
      const thirdOperator = new LinkOperator(LogicOperator.Not);
      const forthOperator = new LinkOperator(LogicOperator.Or);
      const fifthOperator = new LinkOperator(LogicOperator.And);
      const firstEquation: ISolverExpressionRange = {
        solutionDomain: new SolutionRange([ Number.NEGATIVE_INFINITY, 33 ]),
        chainOperator: [
          firstOperator,
        ],
      };

      const secondEquation: ISolverExpressionRange = {
        solutionDomain: new SolutionRange([ 75, 75 ]),
        chainOperator: [
          firstOperator,
          secondOperator,
        ],
      };

      const thirdEquation: ISolverExpressionRange = {
        solutionDomain: new SolutionRange([ 100, Number.POSITIVE_INFINITY ]),
        chainOperator: [
        ],
      };
      const lastOperatorFirstEquation = firstEquation.chainOperator[firstEquation.chainOperator.length - 1];
      const lastOperatorSecondEquation = secondEquation.chainOperator[secondEquation.chainOperator.length - 1];
      if (
        !(lastOperatorFirstEquation &&
        lastOperatorSecondEquation)
      ) {
        fail('should be able to retrieved the last chain operator of the equation check the test implementation');
      }
      const equationSystem: SolverEquationSystem = new Map([
        [ lastOperatorFirstEquation.toString(), firstEquation ],
        [ lastOperatorSecondEquation.toString(), secondEquation ],
        [ forthOperator.toString(), thirdEquation ],
      ]);

      const firstEquationToSolve: [ISolverExpressionRange, ISolverExpressionRange] = [
        {
          solutionDomain: new SolutionRange([ 1_000, Number.POSITIVE_INFINITY ]),
          chainOperator: [
            firstOperator,
            secondOperator,
            thirdOperator,
            forthOperator,
            fifthOperator,
          ],
        },
        {
          solutionDomain: new SolutionRange([ Number.NEGATIVE_INFINITY, 33 + Number.EPSILON ]),
          chainOperator: [
            firstOperator,
            secondOperator,
            thirdOperator,
            forthOperator,
            fifthOperator,
          ],
        },
      ];

      expect(() => { resolveSolutionDomainEquationSystem(equationSystem, firstEquationToSolve); }).toThrow();
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
      const linksOperator: LinkOperator[] = [ new LinkOperator(LogicOperator.And), new LinkOperator(LogicOperator.Or) ];
      const variable = 'x';
      const expectedSolverExpression: ISolverExpression = {
        variable,
        rawValue: '6',
        valueType: SparqlOperandDataTypes.Integer,
        valueAsNumber: 6,
        operator,
        chainOperator: linksOperator,
      };

      const resp = resolveAFilterTerm(expression, operator, linksOperator, variable);

      if (resp) {
        expect(resp).toStrictEqual(expectedSolverExpression);
      } else {
        expect(resp).toBeDefined();
      }
    });

    it('given an algebra expression without a variable than should return undefined', () => {
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
      const linksOperator: LinkOperator[] = [ new LinkOperator(LogicOperator.And), new LinkOperator(LogicOperator.Or) ];

      expect(resolveAFilterTerm(expression, operator, linksOperator, 'x')).toBeUndefined();
    });

    it('given an algebra expression without a litteral than should return undefined', () => {
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
      const linksOperator: LinkOperator[] = [ new LinkOperator(LogicOperator.And), new LinkOperator(LogicOperator.Or) ];

      expect(resolveAFilterTerm(expression, operator, linksOperator, variable)).toBeUndefined();
    });

    it('given an algebra expression without args than should return undefined', () => {
      const expression: Algebra.Expression = {
        type: Algebra.types.EXPRESSION,
        expressionType: Algebra.expressionTypes.OPERATOR,
        operator: '=',
        args: [],
      };
      const operator = SparqlRelationOperator.EqualThanRelation;
      const linksOperator: LinkOperator[] = [ new LinkOperator(LogicOperator.And), new LinkOperator(LogicOperator.Or) ];

      expect(resolveAFilterTerm(expression, operator, linksOperator, 'x')).toBeUndefined();
    });

    it('given an algebra expression with a litteral containing an invalid datatype than should return undefined',
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
        const linksOperator: LinkOperator[] = [
          new LinkOperator(LogicOperator.And),
          new LinkOperator(LogicOperator.Or),
        ];

        expect(resolveAFilterTerm(expression, operator, linksOperator, variable)).toBeUndefined();
      });

    it(`given an algebra expression with a litteral containing a 
    literal that cannot be converted into number should return undefined`, () => {
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
      const linksOperator: LinkOperator[] = [ new LinkOperator(LogicOperator.And), new LinkOperator(LogicOperator.Or) ];

      expect(resolveAFilterTerm(expression, operator, linksOperator, variable)).toBeUndefined();
    });
  });

  describe('recursifFilterExpressionToSolverExpression', () => {
    it('given an algebra expression with two logicals operators should return a list of solver expression', () => {
      const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( !(?x=2 && ?x>5))
                }`).input.expression;

      const buildSolverExpression = (
        variable: Variable,
        rawValue: string,
        valueType: SparqlOperandDataTypes,
        valueAsNumber: number,
        operator: SparqlRelationOperator,
        chainOperator: LinkOperator[],
      ): ISolverExpression => {
        return {
          rawValue,
          variable,
          valueType,
          valueAsNumber,
          operator,
          chainOperator,
        };
      };
      const variable = 'x';

      LinkOperator.resetIdCount();
      const notOperator = new LinkOperator(LogicOperator.Not);
      const andOperator = new LinkOperator(LogicOperator.And);

      const expectedEquation: ISolverExpression[] = [
        buildSolverExpression(
          variable,
          '2',
          SparqlOperandDataTypes.Integer,
          2,
          SparqlRelationOperator.EqualThanRelation,
          [ notOperator, andOperator ],
        ),

        buildSolverExpression(
          variable,
          '5',
          SparqlOperandDataTypes.Integer,
          5,
          SparqlRelationOperator.GreaterThanRelation,
          [ notOperator, andOperator ],
        ),
      ];

      LinkOperator.resetIdCount();
      expect(recursifFilterExpressionToSolverExpression(expression, [], [], variable)).toStrictEqual(expectedEquation);
    });

    it('given an algebra expression with tree logicals operators should return a list of solver expression', () => {
      const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
                }`).input.expression;

      const buildSolverExpression = (
        variable: Variable,
        rawValue: string,
        valueType: SparqlOperandDataTypes,
        valueAsNumber: number,
        operator: SparqlRelationOperator,
        chainOperator: LinkOperator[],
      ): ISolverExpression => {
        return {
          rawValue,
          variable,
          valueType,
          valueAsNumber,
          operator,
          chainOperator,
        };
      };
      const variable = 'x';

      LinkOperator.resetIdCount();
      const orOperator = new LinkOperator(LogicOperator.Or);
      const notOperator = new LinkOperator(LogicOperator.Not);
      const andOperator = new LinkOperator(LogicOperator.And);

      const expectedEquation: ISolverExpression[] = [
        buildSolverExpression(
          variable,
          '2',
          SparqlOperandDataTypes.Integer,
          2,
          SparqlRelationOperator.EqualThanRelation,
          [ orOperator, notOperator, andOperator ],
        ),

        buildSolverExpression(
          variable,
          '5',
          SparqlOperandDataTypes.Integer,
          5,
          SparqlRelationOperator.GreaterThanRelation,
          [ orOperator, notOperator, andOperator ],
        ),

        buildSolverExpression(
          variable,
          '88.3',
          SparqlOperandDataTypes.Decimal,
          88.3,
          SparqlRelationOperator.LessThanRelation,
          [ orOperator ],
        ),
      ];

      LinkOperator.resetIdCount();
      expect(recursifFilterExpressionToSolverExpression(expression, [], [], variable)).toStrictEqual(expectedEquation);
    });

    it('given an algebra expression with four logicals operators should return a list of solver expression', () => {
      const expression = translate(`
                SELECT * WHERE { ?x ?y ?z 
                FILTER( !(?x=2 && ?x>5 || ?x>6) || ?x < 88.3)
                }`).input.expression;

      const buildSolverExpression = (
        variable: Variable,
        rawValue: string,
        valueType: SparqlOperandDataTypes,
        valueAsNumber: number,
        operator: SparqlRelationOperator,
        chainOperator: LinkOperator[],
      ): ISolverExpression => {
        return {
          rawValue,
          variable,
          valueType,
          valueAsNumber,
          operator,
          chainOperator,
        };
      };
      const variable = 'x';

      LinkOperator.resetIdCount();
      const firstOrOperator = new LinkOperator(LogicOperator.Or);
      const notOperator = new LinkOperator(LogicOperator.Not);
      const secondOrOperator = new LinkOperator(LogicOperator.Or);
      const andOperator = new LinkOperator(LogicOperator.And);

      const expectedEquation: ISolverExpression[] = [
        buildSolverExpression(
          variable,
          '2',
          SparqlOperandDataTypes.Integer,
          2,
          SparqlRelationOperator.EqualThanRelation,
          [ firstOrOperator, notOperator, secondOrOperator, andOperator ],
        ),

        buildSolverExpression(
          variable,
          '5',
          SparqlOperandDataTypes.Integer,
          5,
          SparqlRelationOperator.GreaterThanRelation,
          [ firstOrOperator, notOperator, secondOrOperator, andOperator ],
        ),

        buildSolverExpression(
          variable,
          '6',
          SparqlOperandDataTypes.Integer,
          6,
          SparqlRelationOperator.GreaterThanRelation,
          [ firstOrOperator, notOperator, secondOrOperator ],
        ),

        buildSolverExpression(
          variable,
          '88.3',
          SparqlOperandDataTypes.Decimal,
          88.3,
          SparqlRelationOperator.LessThanRelation,
          [ firstOrOperator ],
        ),
      ];

      LinkOperator.resetIdCount();
      expect(recursifFilterExpressionToSolverExpression(expression, [], [], variable)).toStrictEqual(expectedEquation);
    });
  });

  describe('isRelationFilterExpressionDomainEmpty', () => {
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(false);
    });

    it(`should return false when the filter has a possible 
    solution but the addition of the relation produce no possible solution`, () => {
      const relation: ITreeRelation = {
        type: SparqlRelationOperator.GreaterThanOrEqualToRelation,
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
            FILTER( !(?x=2 && ?x>5) || ?x < 88.3)
            }`).input.expression;

      const variable = 'x';

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(false);
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

        expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
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

        expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(false);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(false);
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

      expect(isRelationFilterExpressionDomainEmpty({ relation, filterExpression, variable })).toBe(true);
    });
  });
});
