import { SolutionRange } from './SolutionRange';
import { LogicOperator } from './SolverType';


export class SolutionDomain {
    private domain: SolutionRange[] = [];

    constructor() {
    }

    public get_domain(): SolutionRange[] {
        return new Array(...this.domain);
    }

    public static newWithInitialValue(initialRange: SolutionRange): SolutionDomain {
        const newSolutionDomain = new SolutionDomain();
        newSolutionDomain.domain = [initialRange];
        return newSolutionDomain
    }

    public clone(): SolutionDomain {
        const newSolutionDomain = new SolutionDomain();
        newSolutionDomain.domain = this.domain;
        return newSolutionDomain;
    }


    public add({ range, operator }: { range?: SolutionRange, operator: LogicOperator }): SolutionDomain {
        switch (operator) {
            case LogicOperator.And: {
                if (typeof range === 'undefined') {
                    throw ReferenceError('range should be defined with "AND" operator');
                }
                return this.addWithAndOperator(range);
            }
            case LogicOperator.Or: {
                if (typeof range === 'undefined') {
                    throw ReferenceError('range should be defined with "OR" operator');
                }
                return this.addWithOrOperator(range);
            }

            case LogicOperator.Not: {
                if (range) {
                    throw ReferenceError('range should not be defined with "NOT" operator')
                }
                return this.notOperation();
            }
        }
    }

    public addWithOrOperator(range: SolutionRange): SolutionDomain {
        const newDomain = this.clone();
        let currentRange = range;
        newDomain.domain = newDomain.domain.filter((el) => {
            const resp = SolutionRange.fuseRange(el, currentRange);
            if (resp.length === 1) {
                currentRange = resp[0];
                return false;
            }
            return true;
        });
        newDomain.domain.push(currentRange);
        newDomain.domain.sort(SolutionDomain.sortDomainRangeByLowerBound);
        return newDomain;
    }

    public addWithAndOperator(range: SolutionRange): SolutionDomain {
        const newDomain = new SolutionDomain();

        if (this.domain.length === 0) {
            newDomain.domain.push(range);
            return newDomain;
        }

        this.domain.forEach((el) => {
            const intersection = el.getIntersection(range);
            if (typeof intersection !== 'undefined') {
                newDomain.domain.push(intersection);
            }
        });
        newDomain.domain.sort(SolutionDomain.sortDomainRangeByLowerBound);
        return newDomain;
    }

    public notOperation(): SolutionDomain {
        let newDomain = new SolutionDomain();
        for (const domainElement of this.domain) {
            domainElement.inverse().forEach((el) => {
                newDomain = newDomain.addWithOrOperator(el);
            })
        }
        return newDomain;
    }

    private static sortDomainRangeByLowerBound(firstRange: SolutionRange, secondRange: SolutionRange): number {
        if (firstRange.lower < secondRange.lower) {
            return -1;
        } else if (firstRange.lower > secondRange.lower) {
            return 1;
        }
        return 0;
    }

}
