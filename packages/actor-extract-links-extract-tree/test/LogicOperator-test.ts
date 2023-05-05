import { Or } from '../lib/LogicOperator';
import { SolutionInterval } from '../lib/SolutionInterval';
import { LogicOperatorSymbol } from '../lib/solverInterfaces';
import { SolutionDomain } from '../lib/SolutionDomain';

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
            it('given an empty domain should be able to add an interval', ()=>{
                const interval = new SolutionInterval([ 0, 1 ]);
                const solutionDomain = new SolutionDomain();
                const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(interval);
                expect(or.apply({domain: solutionDomain, interval:interval})).toStrictEqual(expectedSolutionDomain);

            })
        });
    });
});