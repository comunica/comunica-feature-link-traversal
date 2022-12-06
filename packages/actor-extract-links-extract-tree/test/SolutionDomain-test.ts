import { SolutionDomain } from '../lib/SolutionDomain';
import { SolutionRange } from '../lib//SolutionRange';
import { LogicOperator } from '../lib/SolverType';

describe('SolutionDomain', () => {
    describe('constructor', () => {
        it('should return an empty solution domain', () => {
            const solutionDomain = new SolutionDomain();

            expect(solutionDomain.get_domain().length).toBe(0);
        });
    });

    describe('newWithInitialValue', () => {
        it('should create a solution domain with the initial value', () => {
            const solutionRange = new SolutionRange([0, 1]);
            const solutionDomain = SolutionDomain.newWithInitialValue(solutionRange);

            expect(solutionDomain.get_domain().length).toBe(1);
            expect(solutionDomain.get_domain()[0]).toStrictEqual(solutionRange);
        });
    });

    describe('addWithOrOperator', () => {
        let aDomain: SolutionDomain = new SolutionDomain();
        const aRanges = [
            new SolutionRange([-1, 0]),
            new SolutionRange([1, 5]),
            new SolutionRange([10, 10]),
            new SolutionRange([21, 33]),
            new SolutionRange([60, 70]),
        ];
        beforeEach(() => {
            aDomain = new SolutionDomain();
            for (const r of aRanges) {
                aDomain = aDomain.addWithOrOperator(r);
            }
        });
        it('given an empty domain should be able to add the subject range', () => {
            const range = new SolutionRange([0, 1]);
            const solutionDomain = new SolutionDomain();

            const newDomain = solutionDomain.addWithOrOperator(range);

            expect(newDomain.get_domain().length).toBe(1);
            expect(newDomain.get_domain()[0]).toStrictEqual(range);
        });

        it('given an empty domain should be able to add multiple subject range that doesn\'t overlap', () => {
            const ranges = [
                new SolutionRange([10, 10]),
                new SolutionRange([1, 2]),
                new SolutionRange([-1, 0]),
                new SolutionRange([60, 70]),
            ];

            let solutionDomain = new SolutionDomain();

            ranges.forEach((range, idx) => {
                solutionDomain = solutionDomain.addWithOrOperator(range);
                expect(solutionDomain.get_domain().length).toBe(idx + 1);
            });

            const expectedDomain = [
                new SolutionRange([-1, 0]),
                new SolutionRange([1, 2]),
                new SolutionRange([10, 10]),
                new SolutionRange([60, 70]),
            ];

            expect(solutionDomain.get_domain()).toStrictEqual(expectedDomain);
        });

        it('given a domain should not add a range that is inside another', () => {
            const anOverlappingRange = new SolutionRange([22, 23]);
            const newDomain = aDomain.addWithOrOperator(anOverlappingRange);

            expect(newDomain.get_domain().length).toBe(aDomain.get_domain().length);
            expect(newDomain.get_domain()).toStrictEqual(aRanges);
        });

        it('given a domain should create a single domain if all the domain segment are contain into the new range', () => {
            const anOverlappingRange = new SolutionRange([-100, 100]);
            const newDomain = aDomain.addWithOrOperator(anOverlappingRange);

            expect(newDomain.get_domain().length).toBe(1);
            expect(newDomain.get_domain()).toStrictEqual([anOverlappingRange]);
        });

        it('given a domain should fuse multiple domain segment if the new range overlap with them', () => {
            const aNewRange = new SolutionRange([1, 23]);
            const newDomain = aDomain.addWithOrOperator(aNewRange);

            const expectedResultingDomainRange = [
                new SolutionRange([-1, 0]),
                new SolutionRange([1, 33]),
                new SolutionRange([60, 70]),
            ];

            expect(newDomain.get_domain().length).toBe(3);
            expect(newDomain.get_domain()).toStrictEqual(expectedResultingDomainRange);
        });
    });

    describe('notOperation', () => {
        it('given a domain with one range should return the inverse of the domain', () => {
            const solutionRange = new SolutionRange([0, 1]);
            const solutionDomain = SolutionDomain.newWithInitialValue(solutionRange);

            const expectedDomain = [
                new SolutionRange([Number.NEGATIVE_INFINITY, 0 - Number.EPSILON]),
                new SolutionRange([1 + Number.EPSILON, Number.POSITIVE_INFINITY])
            ];
            const newDomain = solutionDomain.notOperation();

            expect(newDomain.get_domain().length).toBe(2);
            expect(newDomain.get_domain()).toStrictEqual(expectedDomain);
        });

        it('given a domain with multiple range should return the inverted domain', () => {
            let domain = new SolutionDomain();
            const ranges = [
                new SolutionRange([0, 1]),
                new SolutionRange([2, 2]),
                new SolutionRange([44, 55]),
            ];
            const expectedDomain = [
                new SolutionRange([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]),
            ];

            for (const r of ranges) {
                domain = domain.addWithOrOperator(r);
            }
            domain = domain.notOperation();

            expect(domain.get_domain()).toStrictEqual(expectedDomain);

        });


    });

    describe('addWithAndOperator', () => {
        let aDomain: SolutionDomain = new SolutionDomain();
        const aRanges = [
            new SolutionRange([-1, 0]),
            new SolutionRange([1, 5]),
            new SolutionRange([10, 10]),
            new SolutionRange([21, 33]),
            new SolutionRange([60, 70]),
        ];
        beforeEach(() => {
            aDomain = new SolutionDomain();
            for (const r of aRanges) {
                aDomain = aDomain.addWithOrOperator(r);
            }
        });

        it('should add a range when the domain is empty', () => {
            const domain = new SolutionDomain();
            const aRange = new SolutionRange([0, 1]);

            const newDomain = domain.addWithAndOperator(aRange);

            expect(newDomain.get_domain()).toStrictEqual([aRange]);
        });

        it('should return an empty domain if there is no intersection with the new range', () => {
            const aRange = new SolutionRange([-200, -100]);

            const newDomain = aDomain.addWithAndOperator(aRange);

            expect(newDomain.get_domain().length).toBe(0);
        });

        it('given a new range that is inside a part of the domain should only return the intersection', () => {
            const aRange = new SolutionRange([22, 30]);

            const newDomain = aDomain.addWithAndOperator(aRange);

            expect(newDomain.get_domain()).toStrictEqual([aRange]);
        });

        it('given a new range that intersect a part of the domain should only return the intersection', () => {
            const aRange = new SolutionRange([19, 25]);

            const expectedDomain = [
                new SolutionRange([21, 25]),
            ];

            const newDomain = aDomain.addWithAndOperator(aRange);

            expect(newDomain.get_domain()).toStrictEqual(expectedDomain);
        });

        it('given a new range that intersect multiple part of the domain should only return the intersections', () => {
            const aRange = new SolutionRange([-2, 25]);

            const expectedDomain = [
                new SolutionRange([-1, 0]),
                new SolutionRange([1, 5]),
                new SolutionRange([10, 10]),
                new SolutionRange([21, 25]),
            ];

            const newDomain = aDomain.addWithAndOperator(aRange);

            expect(newDomain.get_domain()).toStrictEqual(expectedDomain);
        });
    });

    describe('add', () => {
        const aDomain = new SolutionDomain();
        const aRange = new SolutionRange([0, 1]);

        let spyAddWithOrOperator;

        let spyAddWithAndOperator;

        let spyNotOperation;

        beforeEach(() => {
            spyAddWithOrOperator = jest.spyOn(aDomain, 'addWithOrOperator')
                .mockImplementation((_range: SolutionRange) => {
                    return new SolutionDomain()
                });

            spyAddWithAndOperator = jest.spyOn(aDomain, 'addWithAndOperator')
                .mockImplementation((_range: SolutionRange) => {
                    return new SolutionDomain()
                });

            spyNotOperation = jest.spyOn(aDomain, 'notOperation')
                .mockImplementation(() => {
                    return new SolutionDomain()
                });
        });

        it('should call "addWithOrOperator" method given the "OR" operator and a new range', () => {
            aDomain.add({range:aRange, operator:LogicOperator.Or})
            expect(spyAddWithOrOperator).toBeCalledTimes(1);
        });

        it('should throw an error when adding range with a "OR" operator and no new range', () => {
            expect(()=>{aDomain.add({operator:LogicOperator.Or})}).toThrow();
        });

        it('should call "addWithAndOperator" method given the "AND" operator and a new range', () => {
            aDomain.add({range:aRange, operator:LogicOperator.And})
            expect(spyAddWithOrOperator).toBeCalledTimes(1);
        });

        it('should throw an error when adding range with a "AND" operator and no new range', () => {
            expect(()=>{aDomain.add({operator:LogicOperator.And})}).toThrow();
        });

        
        it('should call "notOperation" method given the "NOT" operator', () => {
            aDomain.add({operator:LogicOperator.Not})
            expect(spyAddWithOrOperator).toBeCalledTimes(1);
        });
    });
});