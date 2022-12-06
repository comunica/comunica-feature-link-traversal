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


    public add(range: SolutionRange, operator: LogicOperator): SolutionDomain {

        return this.clone();
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

    public notOperation(): SolutionDomain {
        let newDomain = new SolutionDomain();
        for (const domainElement of this.domain) {
            domainElement.inverse().forEach((el) => {
                newDomain = newDomain.addWithOrOperator(el);
            })
        }
        return newDomain
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
