import {
    filterOperatorToRelationOperator,
    isSparqlOperandNumberType,
    castSparqlRdfTermIntoNumber,
    getSolutionRange,
    areTypesCompatible,
    convertTreeRelationToSolverExpression,
    resolveEquation,
    createEquationSystem
} from '../lib/solver';
import { SolutionRange } from '../lib/SolutionRange';
import { ITreeRelation, SparqlRelationOperator } from '@comunica/types-link-traversal';
import { SparqlOperandDataTypes, SolverExpression, SolverEquation, LogicOperator, SolverEquationSystem } from '../lib/solverInterfaces';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { SolutionDomain } from '../lib/SolutionDomain';
import { LinkOperator } from '../lib/LinkOperator';

const DF = new DataFactory<RDF.BaseQuad>();

describe('solver function', () => {
    describe('filterOperatorToRelationOperator', () => {
        it('should return the RelationOperator given a string representation', () => {
            const testTable: [string, SparqlRelationOperator][] = [
                ['=', SparqlRelationOperator.EqualThanRelation],
                ['<', SparqlRelationOperator.LessThanRelation],
                ['<=', SparqlRelationOperator.LessThanOrEqualToRelation],
                ['>', SparqlRelationOperator.GreaterThanRelation],
                ['>=', SparqlRelationOperator.GreaterThanOrEqualToRelation]
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
            const testTable: [SparqlRelationOperator, SolutionRange][] = [
                [
                    SparqlRelationOperator.GreaterThanRelation,
                    new SolutionRange([value + Number.EPSILON, Number.POSITIVE_INFINITY])
                ],
                [
                    SparqlRelationOperator.GreaterThanOrEqualToRelation,
                    new SolutionRange([value, Number.POSITIVE_INFINITY])
                ],
                [
                    SparqlRelationOperator.EqualThanRelation,
                    new SolutionRange([value, value])
                ],
                [
                    SparqlRelationOperator.LessThanRelation,
                    new SolutionRange([Number.NEGATIVE_INFINITY, value - Number.EPSILON])
                ],
                [
                    SparqlRelationOperator.LessThanOrEqualToRelation,
                    new SolutionRange([Number.NEGATIVE_INFINITY, value])
                ]
            ];

            for (const [operator, expectedRange] of testTable) {
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
            const expressions: SolverExpression[] = [
                {
                    variable: "a",
                    rawValue: "true",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 1,
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
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
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.NonNegativeInteger,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Decimal,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
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
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Boolean,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Byte,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
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
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Float,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                },
                {
                    variable: "a",
                    rawValue: "false",
                    valueType: SparqlOperandDataTypes.Byte,
                    valueAsNumber: 0,
                    operator: SparqlRelationOperator.EqualThanRelation,
                    chainOperator: []
                }
            ];

            expect(areTypesCompatible(expressions)).toBe(false);
        });
    });

    describe('convertTreeRelationToSolverExpression', () => {
        it('given a TREE relation with all the parameters should return a valid expression', () => {
            const relation: ITreeRelation = {
                type: SparqlRelationOperator.EqualThanRelation,
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
                operator: SparqlRelationOperator.EqualThanRelation
            };

            expect(convertTreeRelationToSolverExpression(relation, variable)).toStrictEqual(expectedExpression);
        });

        it('should return undefined given a relation witn a value term containing an unknowed value type', () => {
            const relation: ITreeRelation = {
                type: SparqlRelationOperator.EqualThanRelation,
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
                type: SparqlRelationOperator.EqualThanRelation,
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
                type: SparqlRelationOperator.EqualThanRelation,
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

    describe('resolveEquation', () => {
        it('given an empty domain and an equation with 2 operation chained that are not "NOT" should return a valid new domain and the last chained operator', () => {
            const domain = new SolutionDomain();
            const equation: SolverEquation = {
                chainOperator: [
                    new LinkOperator(LogicOperator.And),
                    new LinkOperator(LogicOperator.Or),
                ],
                solutionDomain: new SolutionRange([0, 1])
            };

            const expectedDomain = SolutionDomain.newWithInitialValue(equation.solutionDomain);
            const expectedLastLogicalOperator = equation.chainOperator.at(-2)?.toString();

            const resp = resolveEquation(equation, domain);
            if (resp) {
                const [respDomain, respLastLogicalOperator] = resp;
                expect(respDomain).toStrictEqual(expectedDomain);
                expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
            } else {
                expect(resp).toBeDefined();
            }
        });

        it('given a domain and an equation with multiple chained that are not "NOT" should return a valid new domain and the next chained operator', () => {
            const domain = SolutionDomain.newWithInitialValue(new SolutionRange([0, 1]));
            const equation: SolverEquation = {
                chainOperator: [
                    new LinkOperator(LogicOperator.And),
                    new LinkOperator(LogicOperator.Or),
                    new LinkOperator(LogicOperator.Or),
                    new LinkOperator(LogicOperator.And),
                    new LinkOperator(LogicOperator.Or),
                ],
                solutionDomain: new SolutionRange([100, 221.3])
            };

            const expectedDomain = domain.add({ range: equation.solutionDomain, operator: <LogicOperator>equation.chainOperator.at(-1)?.operator });
            const expectedLastLogicalOperator = equation.chainOperator.at(-2)?.toString();

            const resp = resolveEquation(equation, domain);
            if (resp) {
                const [respDomain, respLastLogicalOperator] = resp;
                expect(respDomain).toStrictEqual(expectedDomain);
                expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
            } else {
                expect(resp).toBeDefined();
            }
        });

        it('given a domain and an equation one chained operation should return a valid new domain and an empty string has the next chained operator', () => {
            const domain = SolutionDomain.newWithInitialValue(new SolutionRange([0, 1]));
            const equation: SolverEquation = {
                chainOperator: [
                    new LinkOperator(LogicOperator.Or),
                ],
                solutionDomain: new SolutionRange([100, 221.3])
            };

            const expectedDomain = domain.add({ range: equation.solutionDomain, operator: <LogicOperator>equation.chainOperator.at(-1)?.operator });
            const expectedLastLogicalOperator = "";

            const resp = resolveEquation(equation, domain);
            if (resp) {
                const [respDomain, respLastLogicalOperator] = resp;
                expect(respDomain).toStrictEqual(expectedDomain);
                expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
            } else {
                expect(resp).toBeDefined();
            }
        });

        it('given a domain and an equation with multiple chainned operator where the later elements are "NOT" operators and the last element an "AND" operator should return a valid domain and the next last operator', () => {
            const domain = SolutionDomain.newWithInitialValue(new SolutionRange([0, 1]));
            const equation: SolverEquation = {
                chainOperator: [
                    new LinkOperator(LogicOperator.And),
                    new LinkOperator(LogicOperator.Not),
                    new LinkOperator(LogicOperator.Not),
                    new LinkOperator(LogicOperator.Or),
                ],
                solutionDomain: new SolutionRange([100, 221.3])
            };

            let expectedDomain = domain.add({ range: equation.solutionDomain, operator: <LogicOperator>equation.chainOperator.at(-1)?.operator });
            expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });
            expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });

            const expectedLastLogicalOperator = equation.chainOperator[0].toString();

            const resp = resolveEquation(equation, domain);
            if (resp) {
                const [respDomain, respLastLogicalOperator] = resp;
                expect(respDomain).toStrictEqual(expectedDomain);
                expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
            } else {
                expect(resp).toBeDefined();
            }
        });

        it('given a domain and an equation with multiple chainned operator where the last elements are "NOT" operators should return a valid domain and an empty string as the next operator', () => {
            const domain = SolutionDomain.newWithInitialValue(new SolutionRange([0, 1]));
            const equation: SolverEquation = {
                chainOperator: [
                    new LinkOperator(LogicOperator.Not),
                    new LinkOperator(LogicOperator.Not),
                    new LinkOperator(LogicOperator.Or),
                ],
                solutionDomain: new SolutionRange([100, 221.3])
            };

            let expectedDomain = domain.add({ range: equation.solutionDomain, operator: <LogicOperator>equation.chainOperator.at(-1)?.operator });
            expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });
            expectedDomain = expectedDomain.add({ operator: LogicOperator.Not });

            const expectedLastLogicalOperator = "";

            const resp = resolveEquation(equation, domain);
            if (resp) {
                const [respDomain, respLastLogicalOperator] = resp;
                expect(respDomain).toStrictEqual(expectedDomain);
                expect(respLastLogicalOperator).toBe(expectedLastLogicalOperator);
            } else {
                expect(resp).toBeDefined();
            }
        });

        it('given an empty domain and an equation with no chained operation should return undefined', () => {
            const domain = new SolutionDomain();
            const equation: SolverEquation = {
                chainOperator: [],
                solutionDomain: new SolutionRange([0, 1])
            };

            expect(resolveEquation(equation, domain)).toBeUndefined();

        });
    });

    describe('createEquationSystem', () => {
        it('given multiple equations that are consistent with one and another should return a valid equation system and the first equation to resolve', () => {
            const lastOperator = new LinkOperator(LogicOperator.And);
            const firstOperator = new LinkOperator(LogicOperator.Or);
            const secondOperator = new LinkOperator(LogicOperator.Or);
            const thirdOperator = new LinkOperator(LogicOperator.Not);
            const aVariable = 'x';
            const aRawValue = '1';
            const aValueType = SparqlOperandDataTypes.Int;
            const avalueAsNumber = 1;
            const anOperator = SparqlRelationOperator.EqualThanRelation;

            const operationTemplate = (c: LinkOperator[]): SolverExpression => {
                return {
                    variable: aVariable,
                    rawValue: aRawValue,
                    valueType: aValueType,
                    valueAsNumber: avalueAsNumber,
                    operator: anOperator,
                    chainOperator: c
                }
            };

            const firstOperation = operationTemplate([firstOperator]);
            const firstEquation: SolverEquation = { chainOperator: firstOperation.chainOperator, solutionDomain: new SolutionRange([1, 1]) };
            const secondOperation = operationTemplate([firstOperator, secondOperator]);
            const secondEquation: SolverEquation = { chainOperator: secondOperation.chainOperator, solutionDomain: new SolutionRange([1, 1]) };
            const thirdOperation = operationTemplate([firstOperator, secondOperator, thirdOperator]);
            const thirdEquation: SolverEquation = { chainOperator: thirdOperation.chainOperator, solutionDomain: new SolutionRange([1, 1]) };
            const lastOperation1 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);
            const expectedFirstEquation1: SolverEquation = { chainOperator: lastOperation1.chainOperator, solutionDomain: new SolutionRange([1, 1]) };
            const lastOperation2 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);
            const expectedFirstEquation2: SolverEquation = { chainOperator: lastOperation2.chainOperator, solutionDomain: new SolutionRange([1, 1]) };

            const equations: SolverExpression[] = [
                firstOperation,
                secondOperation,
                thirdOperation,
                lastOperation1,
                lastOperation2
            ]
            equations.sort(() => Math.random() - 0.5);

            const expectedEquationSystem: SolverEquationSystem = new Map([
                [firstOperator.toString(), firstEquation],
                [secondOperator.toString(), secondEquation],
                [thirdOperator.toString(), thirdEquation]
            ]);

            const resp = createEquationSystem(equations);
            if (resp) {
                const [respEquationSystem, [respFirstEquation1, respFirstEquation2]] = resp;
                expect(respEquationSystem).toStrictEqual(expectedEquationSystem);
                expect(respFirstEquation1).toStrictEqual(expectedFirstEquation1);
                expect(respFirstEquation2).toStrictEqual(expectedFirstEquation2);
            } else {
                expect(resp).toBeDefined();
            }

        });

        it('given multiples equations where it is not possible to get the solution range of an equation it should return undefined', () => {
            const lastOperator = new LinkOperator(LogicOperator.And);
            const firstOperator = new LinkOperator(LogicOperator.Or);
            const secondOperator = new LinkOperator(LogicOperator.Or);
            const thirdOperator = new LinkOperator(LogicOperator.Not);
            const aVariable = 'x';
            const aRawValue = '1';
            const aValueType = SparqlOperandDataTypes.Int;
            const avalueAsNumber = 1;
            const anOperator = SparqlRelationOperator.EqualThanRelation;

            const operationTemplate = (c: LinkOperator[]): SolverExpression => {
                return {
                    variable: aVariable,
                    rawValue: aRawValue,
                    valueType: aValueType,
                    valueAsNumber: avalueAsNumber,
                    operator: anOperator,
                    chainOperator: c
                }
            };

            const firstOperation = {
                variable: aVariable,
                rawValue: aRawValue,
                valueType: aValueType,
                valueAsNumber: avalueAsNumber,
                operator: SparqlRelationOperator.GeospatiallyContainsRelation,
                chainOperator: [firstOperator]
            };
            const secondOperation = operationTemplate([firstOperator, secondOperator]);
            const thirdOperation = operationTemplate([firstOperator, secondOperator, thirdOperator]);
            const lastOperation1 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);
            const lastOperation2 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);

            const equations: SolverExpression[] = [
                firstOperation,
                secondOperation,
                thirdOperation,
                lastOperation1,
                lastOperation2
            ];
            equations.sort(() => Math.random() - 0.5);
            
            expect(createEquationSystem(equations)).toBeUndefined();
        });

        it('given multiples equations where there is multiple equation that could be the first equation to be resolved it should return undefined', () => {
            const lastOperator = new LinkOperator(LogicOperator.And);
            const firstOperator = new LinkOperator(LogicOperator.Or);
            const secondOperator = new LinkOperator(LogicOperator.Or);
            const thirdOperator = new LinkOperator(LogicOperator.Not);
            const aVariable = 'x';
            const aRawValue = '1';
            const aValueType = SparqlOperandDataTypes.Int;
            const avalueAsNumber = 1;
            const anOperator = SparqlRelationOperator.EqualThanRelation;

            const operationTemplate = (c: LinkOperator[]): SolverExpression => {
                return {
                    variable: aVariable,
                    rawValue: aRawValue,
                    valueType: aValueType,
                    valueAsNumber: avalueAsNumber,
                    operator: anOperator,
                    chainOperator: c
                }
            };

            const firstOperation = operationTemplate([firstOperator]);
            const secondOperation = operationTemplate([firstOperator, secondOperator]);
            const thirdOperation = operationTemplate([firstOperator, secondOperator, thirdOperator]);
            const lastOperation1 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);
            const lastOperation2 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);
            const lastOperation3 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);

            const equations: SolverExpression[] = [
                firstOperation,
                secondOperation,
                thirdOperation,
                lastOperation1,
                lastOperation2,
                lastOperation3
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

            const operationTemplate = (c: LinkOperator[]): SolverExpression => {
                return {
                    variable: aVariable,
                    rawValue: aRawValue,
                    valueType: aValueType,
                    valueAsNumber: avalueAsNumber,
                    operator: anOperator,
                    chainOperator: c
                }
            };

            const firstOperation = {
                variable: aVariable,
                rawValue: aRawValue,
                valueType: aValueType,
                valueAsNumber: avalueAsNumber,
                operator: SparqlRelationOperator.GeospatiallyContainsRelation,
                chainOperator: [firstOperator]
            };
            const secondOperation = operationTemplate([firstOperator, secondOperator]);
            const thirdOperation = operationTemplate([firstOperator, secondOperator, thirdOperator]);
            const lastOperation1 = operationTemplate([firstOperator, secondOperator, thirdOperator, lastOperator]);

            const equations: SolverExpression[] = [
                firstOperation,
                secondOperation,
                thirdOperation,
                lastOperation1,
            ];
            equations.sort(() => Math.random() - 0.5);
            
            expect(createEquationSystem(equations)).toBeUndefined();
        });
    });
});