import {
    filterOperatorToRelationOperator,
    isSparqlOperandNumberType,
    castSparqlRdfTermIntoNumber,
    getSolutionRange,
    areTypesCompatible,
    convertTreeRelationToSolverExpression
} from '../lib/solver';
import { SolutionRange } from '../lib/SolutionRange';
import { ITreeRelation, RelationOperator } from '@comunica/types-link-traversal';
import { SparqlOperandDataTypes, SolverExpression } from '../lib/solverInterfaces';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

const DF = new DataFactory<RDF.BaseQuad>();

describe('solver function', () => {
    describe('filterOperatorToRelationOperator', () => {
        it('should return the RelationOperator given a string representation', () => {
            const testTable: [string, RelationOperator][] = [
                ['=', RelationOperator.EqualThanRelation],
                ['<', RelationOperator.LessThanRelation],
                ['<=', RelationOperator.LessThanOrEqualToRelation],
                ['>', RelationOperator.GreaterThanRelation],
                ['>=', RelationOperator.GreaterThanOrEqualToRelation]
            ];

            for (const [value, expectedAnswer] of testTable) {
                expect(filterOperatorToRelationOperator(value)).toBe(expectedAnswer);
            }
        });
        it('should return undefined given a string not representing a RelationOperator', () => {
            expect(filterOperatorToRelationOperator("foo")).toBeUndefined();
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
                SparqlOperandDataTypes.Byte
            ];

            for (const value of testTable) {
                expect(isSparqlOperandNumberType(value)).toBe(false);
            }
        });

    });

    describe('castSparqlRdfTermIntoNumber', () => {
        it('should return the expected number when given an integer', () => {
            const testTable: [string, SparqlOperandDataTypes, number][] = [
                ['19273', SparqlOperandDataTypes.Integer, 19273],
                ['0', SparqlOperandDataTypes.NonPositiveInteger, 0],
                ['-12313459', SparqlOperandDataTypes.NegativeInteger, -12313459],
                ['121312321321321321', SparqlOperandDataTypes.Long, 121312321321321321],
                ['1213123213213213', SparqlOperandDataTypes.Short, 1213123213213213],
                ['283', SparqlOperandDataTypes.NonNegativeInteger, 283],
                ['-12131293912831', SparqlOperandDataTypes.UnsignedLong, -12131293912831],
                ['-1234', SparqlOperandDataTypes.UnsignedInt, -1234],
                ['-123341231231234', SparqlOperandDataTypes.UnsignedShort, -123341231231234],
                ['1234', SparqlOperandDataTypes.PositiveInteger, 1234]
            ];

            for (const [value, valueType, expectedNumber] of testTable) {
                expect(castSparqlRdfTermIntoNumber(value, valueType)).toBe(expectedNumber);
            }
        });

        it('should return undefined if a non integer is pass with SparqlOperandDataTypes integer compatible type', () => {
            const testTable: [string, SparqlOperandDataTypes][] = [
                ['1.6751', SparqlOperandDataTypes.Integer],
                ['asbd', SparqlOperandDataTypes.PositiveInteger],
                ['', SparqlOperandDataTypes.NegativeInteger]
            ];

            for (const [value, valueType] of testTable) {
                expect(castSparqlRdfTermIntoNumber(value, valueType)).toBeUndefined();
            }
        });

        it('should return the expected number when given an decimal', () => {
            const testTable: [string, SparqlOperandDataTypes, number][] = [
                ['1.1', SparqlOperandDataTypes.Decimal, 1.1],
                ['2132131.121321321421', SparqlOperandDataTypes.Float, 2132131.121321321421],
                ['1234.123123132132143423424235324324', SparqlOperandDataTypes.Double, 1234.123123132132143423424235324324],
            ];

            for (const [value, valueType, expectedNumber] of testTable) {
                expect(castSparqlRdfTermIntoNumber(value, valueType)).toBe(expectedNumber);
            }
        });

        it('should return the expected unix time given a date time', () => {
            const value = '1994-11-05T13:15:30Z';
            const expectedUnixTime = 784041330000;

            expect(castSparqlRdfTermIntoNumber(
                value,
                SparqlOperandDataTypes.DateTime
            )).toBe(expectedUnixTime);
        });

        it('should return undefined given a non date time', () => {
            const value = '1994-11-T13:15:30';

            expect(castSparqlRdfTermIntoNumber(
                value,
                SparqlOperandDataTypes.DateTime
            )).toBeUndefined();
        });
    });

    describe('getSolutionRange', () => {
        it('given a boolean compatible RelationOperator and a value should return a valid SolutionRange', () => {
            const value = -1;
            const testTable: [RelationOperator, SolutionRange][] = [
                [
                    RelationOperator.GreaterThanRelation,
                    new SolutionRange([value + Number.EPSILON, Number.POSITIVE_INFINITY])
                ],
                [
                    RelationOperator.GreaterThanOrEqualToRelation,
                    new SolutionRange([value, Number.POSITIVE_INFINITY])
                ],
                [
                    RelationOperator.EqualThanRelation,
                    new SolutionRange([value, value])
                ],
                [
                    RelationOperator.LessThanRelation,
                    new SolutionRange([Number.NEGATIVE_INFINITY, value - Number.EPSILON])
                ],
                [
                    RelationOperator.LessThanOrEqualToRelation,
                    new SolutionRange([Number.NEGATIVE_INFINITY, value])
                ]
            ];

            for (const [operator, expectedRange] of testTable) {
                expect(getSolutionRange(value, operator)).toStrictEqual(expectedRange);
            }
        });

        it('should return undefined given an RelationOperator that is not boolean compatible', () => {
            const value = -1;
            const operator = RelationOperator.PrefixRelation;

            expect(getSolutionRange(value, operator)).toBeUndefined();
        });
    });

    describe('areTypesCompatible', () => {
        it('given expression with identical value type should return true', () => {
            const expressions: SolverExpression[] = [
                {
                    variable: "a",
                    rawValue: "true",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 1,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(true);
        });

        it('should return true when all the types are numbers', () => {
            const expressions: SolverExpression[] = [
                {
                    variable: "a",
                    rawValue: "true",
                    valueType: SparqlOperandDataTypes.Int,
                    valueAsNumber: 1,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.NonNegativeInteger,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Decimal,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(true);
        });

        it('should return false when one type is not identical', () => {
            const expressions: SolverExpression[] = [
                {
                    variable: "a",
                    rawValue: "true",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 1,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Byte,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(false);
        });

        it('should return false when one type is not identical and the other are number', () => {
            const expressions: SolverExpression[] = [
                {
                    variable: "a",
                    rawValue: "true",
                    valueType: SparqlOperandDataTypes.UnsignedInt,
                    valueAsNumber: 1,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Float,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Byte,
                    valueAsNumber: 0,
                    operator: RelationOperator.EqualThanRelation,
                    chainOperator: []
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(false);
        });
    });

    describe('convertTreeRelationToSolverExpression', () => {
        it('given a TREE relation with all the parameters should return a valid expression', () => {
            const relation: ITreeRelation = {
                type: RelationOperator.EqualThanRelation,
                remainingItems: 10,
                path: "ex:path",
                value: {
                    value: "5",
                    term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                },
                node: "https://www.example.be"
            };
            const variable = "x";

            const expectedExpression: SolverExpression = {
                variable: variable,
                rawValue: '5',
                valueType: SparqlOperandDataTypes.Integer,
                valueAsNumber: 5,
                chainOperator: [],
                operator: RelationOperator.EqualThanRelation
            };

            expect(convertTreeRelationToSolverExpression(relation, variable)).toStrictEqual(expectedExpression);
        });

        it('should return undefined given a relation witn a value term containing an unknowed value type', () => {
            const relation: ITreeRelation = {
                type: RelationOperator.EqualThanRelation,
                remainingItems: 10,
                path: "ex:path",
                value: {
                    value: "5",
                    term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#foo'))
                },
                node: "https://www.example.be"
            };
            const variable = "x";

            expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
        });

        it('should return undefined given a relation with a term containing an incompatible value in relation to its value type', () => {
            const relation: ITreeRelation = {
                type: RelationOperator.EqualThanRelation,
                remainingItems: 10,
                path: "ex:path",
                value: {
                    value: "a",
                    term: DF.literal('a', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                },
                node: "https://www.example.be"
            };
            const variable = "x";

            expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
        });

        it('should return undefined given a relation without a value and a type', () => {
            const relation: ITreeRelation = {
                remainingItems: 10,
                path: "ex:path",
                node: "https://www.example.be"
            };
            const variable = "x";

            expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
        });

        it('should return undefined given a relation without a value', () => {
            const relation: ITreeRelation = {
                type: RelationOperator.EqualThanRelation,
                remainingItems: 10,
                path: "ex:path",
                node: "https://www.example.be"
            };
            const variable = "x";

            expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
        });

        it('should return undefined given a relation without a type', () => {
            const relation: ITreeRelation = {
                remainingItems: 10,
                path: "ex:path",
                value: {
                    value: "a",
                    term: DF.literal('a', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                },
                node: "https://www.example.be"
            };
            const variable = "x";

            expect(convertTreeRelationToSolverExpression(relation, variable)).toBeUndefined();
        });
    });
});