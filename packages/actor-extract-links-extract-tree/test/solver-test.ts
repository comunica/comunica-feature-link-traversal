import {
    filterOperatorToRelationOperator,
    isSparqlOperandNumberType,
    castSparqlRdfTermIntoNumber,
    getSolutionRange,
    areTypesCompatible
} from '../lib/solver';
import { SolutionRange } from '../lib/SolutionRange';
import { RelationOperator } from '@comunica/types-link-traversal';
import { SparqlOperandDataTypes, SolverExpression } from '../lib/solverInterfaces';


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

            for(const [operator, expectedRange] of testTable) {
                expect(getSolutionRange(value, operator)).toStrictEqual(expectedRange);
            }
        });

        it('should return undefined given an RelationOperator that is not boolean compatible', ()=>{
            const value = -1;
            const operator = RelationOperator.PrefixRelation;

            expect(getSolutionRange(value, operator)).toBeUndefined();
        });
    });

    describe('areTypesCompatible', ()=>{
        it('given expression with identical value type should return true', ()=>{
            const expressions:SolverExpression[] = [
                {
                    variable:"a",
                    rawValue:"true",
                    valueType:SparqlOperandDataTypes.Boolean,
                    valueAsNumber:1,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Boolean,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Boolean,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(true);
        });

        it('should return true when all the types are numbers', ()=>{
            const expressions:SolverExpression[] = [
                {
                    variable:"a",
                    rawValue:"true",
                    valueType:SparqlOperandDataTypes.Int,
                    valueAsNumber:1,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.NonNegativeInteger,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Decimal,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(true);
        });

        it('should return false when one type is not identical', ()=>{
            const expressions:SolverExpression[] = [
                {
                    variable:"a",
                    rawValue:"true",
                    valueType:SparqlOperandDataTypes.Boolean,
                    valueAsNumber:1,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Boolean,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Byte,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(false);
        });

        it('should return false when one type is not identical and the other are number', ()=>{
            const expressions:SolverExpression[] = [
                {
                    variable:"a",
                    rawValue:"true",
                    valueType:SparqlOperandDataTypes.UnsignedInt,
                    valueAsNumber:1,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Float,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                },
                {
                    variable:"a",
                    rawValue:"false",
                    valueType:SparqlOperandDataTypes.Byte,
                    valueAsNumber:0,
                    operator:RelationOperator.EqualThanRelation,
                    chainOperator:[]
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(false);
        });
    });

    
});