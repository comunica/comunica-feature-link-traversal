import { Or, Not, And } from '../lib/LogicOperator';
import { SolutionInterval } from '../lib/SolutionInterval';
import { LogicOperatorSymbol } from '../lib/solverInterfaces';
import { SolutionDomain } from '../lib/SolutionDomain';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('LogicOperator', () => {
    describe('Or', () => {
        const or = new Or();
        describe('operatorName', () => {
            it('Should return the associated operator name', () => {
                expect(or.operatorName()).toBe(LogicOperatorSymbol.Or);
            });
        });
        describe('apply', () => {
            const intervals = [
                new SolutionInterval([-1, 0]),
                new SolutionInterval([1, 5]),
                new SolutionInterval([10, 10]),
                new SolutionInterval([21, 33]),
                new SolutionInterval([60, 70]),
            ];
            const aDomain = SolutionDomain.newWithInitialIntervals(intervals);
            it('given an empty domain should be able to add an interval', () => {
                const interval = new SolutionInterval([0, 1]);
                const solutionDomain = new SolutionDomain();
                const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(interval);
                expect(or.apply({ domain: solutionDomain, interval: interval })).toStrictEqual(expectedSolutionDomain);

            });

            it('given an empty domain should be able to add multiple subject range that doesn\'t overlap', () => {
                const intervals = [
                    new SolutionInterval([10, 10]),
                    new SolutionInterval([1, 2]),
                    new SolutionInterval([-1, 0]),
                    new SolutionInterval([60, 70]),
                ];

                let solutionDomain = new SolutionDomain();

                intervals.forEach((interval, idx) => {
                    solutionDomain = or.apply({ domain: solutionDomain, interval: interval });
                    expect(solutionDomain.getDomain().length).toBe(idx + 1);
                });

                const expectedDomain = [
                    new SolutionInterval([-1, 0]),
                    new SolutionInterval([1, 2]),
                    new SolutionInterval([10, 10]),
                    new SolutionInterval([60, 70]),
                ];

                expect(solutionDomain.getDomain()).toStrictEqual(expectedDomain);
            });

            it('given a domain should not add a range that is inside another', () => {
                const anOverlappingInterval = new SolutionInterval([22, 23]);
                const newDomain = or.apply({ domain: aDomain, interval: anOverlappingInterval });

                expect(newDomain.getDomain().length).toBe(aDomain.getDomain().length);
                expect(newDomain.getDomain()).toStrictEqual(intervals);
            });

            it('given a domain should create a single domain if all the domain segment are contain into the new range', () => {
                const anOverlappingInterval = new SolutionInterval([-100, 100]);
                const newDomain = or.apply({ domain: aDomain, interval: anOverlappingInterval });

                expect(newDomain.getDomain().length).toBe(1);
                expect(newDomain.getDomain()).toStrictEqual([anOverlappingInterval]);
            });

            it('given a domain should fuse multiple domain segment if the new range overlap with them', () => {
                const aNewInterval = new SolutionInterval([1, 23]);
                const newDomain = or.apply({ domain: aDomain, interval: aNewInterval });

                const expectedResultingDomainInterval = [
                    new SolutionInterval([-1, 0]),
                    new SolutionInterval([1, 33]),
                    new SolutionInterval([60, 70]),
                ];

                expect(newDomain.getDomain().length).toBe(3);
                expect(newDomain.getDomain()).toStrictEqual(expectedResultingDomainInterval);
            });

        });
    });

    describe('Not', () => {
        const not = new Not();
        describe('operatorName', () => {
            it('Should return the associated operator name', () => {
                expect(not.operatorName()).toBe(LogicOperatorSymbol.Not);
            });
        });
        describe('apply', () => {
            it('given a domain with one range should return the inverse of the domain', () => {
                const solutionInterval = new SolutionInterval([0, 1]);
                const solutionDomain = SolutionDomain.newWithInitialIntervals(solutionInterval);

                const expectedDomain = [
                    new SolutionInterval([Number.NEGATIVE_INFINITY, nextDown(0)]),
                    new SolutionInterval([nextUp(1), Number.POSITIVE_INFINITY]),
                ];
                const newDomain = not.apply({ domain: solutionDomain });

                expect(newDomain.getDomain().length).toBe(2);
                expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
            });

            it('given a domain with multiple range should return the inverted domain', () => {
                let domain = new SolutionDomain();
                const intervals = [
                    new SolutionInterval([0, 1]),
                    new SolutionInterval([2, 2]),
                    new SolutionInterval([44, 55]),
                ];
                const expectedDomain = [
                    new SolutionInterval([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]),
                ];

                for (const interval of intervals) {
                    domain = new Or().apply({ interval: interval, domain })
                }
                domain = not.apply({ domain });

                expect(domain.getDomain()).toStrictEqual(expectedDomain);
            });
        });
    });

    describe('And', () => {
        const and = new And();
        describe('operatorName', () => {
            it('Should return the associated operator name', () => {
                expect(and.operatorName()).toBe(LogicOperatorSymbol.And);
            });
        });
        describe('apply', () => {
            let aDomain: SolutionDomain = new SolutionDomain();
            const intervals = [
                new SolutionInterval([-1, 0]),
                new SolutionInterval([1, 5]),
                new SolutionInterval([10, 10]),
                new SolutionInterval([21, 33]),
                new SolutionInterval([60, 70]),
            ];
            beforeEach(() => {
                aDomain = new SolutionDomain();
                for (const interval of intervals) {
                    aDomain = new Or().apply({ interval, domain: aDomain });
                }
            });

            it('should add a range when the domain is empty', () => {
                const domain = new SolutionDomain();
                const interval = new SolutionInterval([0, 1]);

                const newDomain = and.apply({ interval, domain });

                expect(newDomain.getDomain()).toStrictEqual([interval]);
            });

            it('should return an empty domain if there is no intersection with the new range', () => {
                const interval = new SolutionInterval([ -200, -100 ]);
          
                const newDomain =  and.apply({ interval, domain: aDomain });
          
                expect(newDomain.isDomainEmpty()).toBe(true);
              });

              it('given a new range that is inside a part of the domain should only return the intersection', () => {
                const interval = new SolutionInterval([ 22, 30 ]);
          
                const newDomain = and.apply({ interval, domain: aDomain });
          
                expect(newDomain.getDomain()).toStrictEqual([ interval ]);
              });

              it('given a new range that intersect a part of the domain should only return the intersection', () => {
                const interval = new SolutionInterval([ 19, 25 ]);
          
                const expectedDomain = [
                  new SolutionInterval([ 21, 25 ]),
                ];
          
                const newDomain = and.apply({ interval, domain: aDomain });
          
                expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
              });

              it('given a new range that intersect multiple part of the domain should only return the intersections', () => {
                const interval = new SolutionInterval([ -2, 25 ]);
          
                const expectedDomain = [
                  new SolutionInterval([ -1, 0 ]),
                  new SolutionInterval([ 1, 5 ]),
                  new SolutionInterval([ 10, 10 ]),
                  new SolutionInterval([ 21, 25 ]),
                ];
          
                const newDomain = and.apply({ interval, domain: aDomain });
          
                expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
              });

              it('given an empty domain and a last operator and should return an empty domain', () => {
                const interval = new SolutionInterval([ -2, 25 ]);
                const anotherIntervalNonOverlapping = new SolutionInterval([ 2_000, 3_000 ]);
          
                let newDomain = and.apply({ interval, domain: aDomain });
                newDomain = and.apply({ interval:anotherIntervalNonOverlapping, domain: newDomain });
                
                expect(newDomain.isDomainEmpty()).toBe(true);
          
                newDomain = and.apply({ interval, domain: newDomain });
          
                expect(newDomain.isDomainEmpty()).toBe(true);
              });


        });
    });
});