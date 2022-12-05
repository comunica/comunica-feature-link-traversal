import { SolutionDomain, SolutionRange } from '../lib/SolverType';

describe('SolutionDomain', ()=>{
    describe('constructor', ()=>{
        it('should return an empty solution domain', ()=>{
            const solutionDomain = new SolutionDomain();

            expect(solutionDomain.get_domain().length).toBe(0);
        });
    });

    describe('newWithInitialValue',()=>{
        it('should create a solution domain with the initial value', ()=>{
            const solutionRange = new SolutionRange([0,1]);
            const solutionDomain = SolutionDomain.newWithInitialValue(solutionRange);

            expect(solutionDomain.get_domain().length).toBe(1);
            expect(solutionDomain.get_domain()[0]).toStrictEqual(solutionRange);
        });
    });

    describe('addWithOrOperator', ()=>{
        let aDomain: SolutionDomain = new SolutionDomain();
        const aRanges = [
            new SolutionRange([-1,0]),
            new SolutionRange([1,5]),
            new SolutionRange([10,10]),
            new SolutionRange([21,33]),
            new SolutionRange([60,70]),
        ];
        beforeEach(()=>{
            aDomain  = new SolutionDomain();
            for (const r of aRanges){
                aDomain = aDomain.addWithOrOperator(r);
            }
        });
        it('given an empty domain should be able to add the subject range', ()=>{
            const range = new SolutionRange([0,1]);
            const solutionDomain = new SolutionDomain();

            const newDomain = solutionDomain.addWithOrOperator(range);

            expect(newDomain.get_domain().length).toBe(1);
            expect(newDomain.get_domain()[0]).toStrictEqual(range);
        });

        it('given an empty domain should be able to add multiple subject range that doesn\'t overlap', ()=>{
            const ranges = [
                new SolutionRange([10,10]),
                new SolutionRange([1,2]),
                new SolutionRange([-1,0]),
                new SolutionRange([60,70]),
            ];

            let solutionDomain = new SolutionDomain();

            ranges.forEach((range,idx)=>{
                solutionDomain = solutionDomain.addWithOrOperator(range);
                expect(solutionDomain.get_domain().length).toBe(idx+1);
            });

            const expectedDomain = [
                new SolutionRange([-1,0]),
                new SolutionRange([1,2]),
                new SolutionRange([10,10]),
                new SolutionRange([60,70]),
            ];

            expect(solutionDomain.get_domain()).toStrictEqual(expectedDomain);
        });

        it('given a domain should not add a range that is inside another', ()=>{
            const anOverlappingRange = new SolutionRange([22,23]);
            const newDomain = aDomain.addWithOrOperator(anOverlappingRange);
            
            expect(newDomain.get_domain().length).toBe(aDomain.get_domain().length);
            expect(newDomain.get_domain()).toStrictEqual(aRanges);
        });

        it('given a domain should create a single domain if all the domain segment are contain into the new range', ()=>{
            const anOverlappingRange = new SolutionRange([-100,100]);
            const newDomain = aDomain.addWithOrOperator(anOverlappingRange);
            
            expect(newDomain.get_domain().length).toBe(1);
            expect(newDomain.get_domain()).toStrictEqual([anOverlappingRange]);
        });

        it('given a domain should fuse multiple domain segment if the new range overlap with them', ()=>{
            const aNewRange = new SolutionRange([1,23]);
            const newDomain = aDomain.addWithOrOperator(aNewRange);

            const expectedResultingDomainRange = [
                new SolutionRange([-1,0]),
                new SolutionRange([1,33]),
                new SolutionRange([60,70]),
            ];
            
            expect(newDomain.get_domain().length).toBe(3);
            expect(newDomain.get_domain()).toStrictEqual(expectedResultingDomainRange);
        });
    });
});