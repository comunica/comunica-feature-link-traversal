import { RelationOperator } from '@comunica/types-link-traversal';
import { type } from 'os';
/**
 * Valid SPARQL data type for operation.
 */
export enum SparqlOperandDataTypes {
    Integer = 'http://www.w3.org/2001/XMLSchema#integer',
    Decimal = 'http://www.w3.org/2001/XMLSchema#decimal',
    Float = 'http://www.w3.org/2001/XMLSchema#float',
    Double = 'http://www.w3.org/2001/XMLSchema#double',
    String = 'http://www.w3.org/2001/XMLSchema#string',
    Boolean = 'http://www.w3.org/2001/XMLSchema#boolean',
    DateTime = 'http://www.w3.org/2001/XMLSchema#dateTime',

    NonPositiveInteger = 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
    NegativeInteger = 'http://www.w3.org/2001/XMLSchema#negativeInteger',
    Long = 'http://www.w3.org/2001/XMLSchema#long',
    Int = 'http://www.w3.org/2001/XMLSchema#int',
    Short = 'http://www.w3.org/2001/XMLSchema#short',
    Byte = 'http://www.w3.org/2001/XMLSchema#byte',
    NonNegativeInteger = 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
    UnsignedLong = 'http://www.w3.org/2001/XMLSchema#nunsignedLong',
    UnsignedInt = 'http://www.w3.org/2001/XMLSchema#unsignedInt',
    UnsignedShort = 'http://www.w3.org/2001/XMLSchema#unsignedShort',
    UnsignedByte = 'http://www.w3.org/2001/XMLSchema#unsignedByte',
    PositiveInteger = 'http://www.w3.org/2001/XMLSchema#positiveInteger'
}

export enum LogicOperator {
    And = '&&',
    Or = '||',
    Not = '!',
};

export const LogicOperatorReversed: Map<string, LogicOperator> =
    new Map(Object.values(LogicOperator).map(value => [value, value]));

export class LinkOperator {
    private readonly operator: LogicOperator;
    private readonly id: number;
    private static count: number = 0;

    constructor(operator: LogicOperator) {
        this.operator = operator;
        this.id = LinkOperator.count;
        LinkOperator.count++;
    }

    public toString(): string {
        return `${this.operator}-${this.id}`
    }
}

export interface SolverEquation {
    chainOperator: LinkOperator[];
    solutionDomain: SolutionRange;
}

export type SolverEquationSystem = Map<LastLogicalOperator, SolverEquation[]>;

export type LastLogicalOperator = string;
export type Variable = string;

export interface SolverExpression {
    variable: Variable;

    rawValue: string;
    valueType: SparqlOperandDataTypes;
    valueAsNumber: number;

    operator: RelationOperator;
    chainOperator: LinkOperator[];
};

export class SolutionRange {
    public readonly upper: number;
    public readonly lower: number;

    constructor(range: [number, number]) {
        if (range[0] > range[1]) {
            throw new RangeError('the first element of the range should lower or equal to the second');
        }
        this.upper = range[1];
        this.lower = range[0];
    }

    public isOverlapping(otherRange: SolutionRange): boolean {
        if (this.upper === otherRange.upper && this.lower === otherRange.lower) {
            return true;
        } else if (this.upper >= otherRange.lower && this.upper <= otherRange.upper) {
            return true;
        } else if (this.lower >= otherRange.lower && this.lower <= otherRange.upper) {
            return true;
        } else if (otherRange.lower >= this.lower && otherRange.upper <= this.upper) {
            return true;
        }
        return false;
    }

    public isInside(otherRange: SolutionRange): boolean {
        return otherRange.lower >= this.lower && otherRange.upper <= this.upper;
    }

    public static fuseRange(subjectRange: SolutionRange, otherRange: SolutionRange): SolutionRange[] {
        if (subjectRange.isOverlapping(otherRange)) {
            const lowest = subjectRange.lower < otherRange.lower ? subjectRange.lower : otherRange.lower;
            const uppest = subjectRange.upper > otherRange.upper ? subjectRange.upper : otherRange.upper;
            return [new SolutionRange([lowest, uppest])];
        }
        return [subjectRange, otherRange];
    }
}


export class SolutionDomain {
    private domain: SolutionRange[] = [];
    private excludedDomain: SolutionRange[] = [];

    constructor() {
    }

    public get_domain(): SolutionRange[]{
        return new Array(...this.domain);
    }

    public get_excluded_domain(): SolutionRange[]{
        return new Array(...this.excludedDomain);
    }

    public static newWithInitialValue(initialRange: SolutionRange): SolutionDomain {
        const newSolutionDomain = new SolutionDomain();
        newSolutionDomain.domain = [initialRange];
        return newSolutionDomain
    }

    public clone(): SolutionDomain {
        const newSolutionDomain = new SolutionDomain();
        newSolutionDomain.domain = this.domain;
        newSolutionDomain.excludedDomain = this.excludedDomain;
        return newSolutionDomain;
    }


    public add(range: SolutionRange, operator: LogicOperator): SolutionDomain {
        // we check if the new range is inside an excluded solution
        if (operator !== LogicOperator.Not) {
            for (const excluded of this.excludedDomain) {
                if (excluded.isInside(range)) {
                    return this.clone();
                }
            }
        }
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
        newDomain.domain.sort(sortDomainRangeByLowerBound);
        return newDomain
    }
}

function sortDomainRangeByLowerBound(firstRange: SolutionRange, secondRange: SolutionRange): number {
    if (firstRange.lower < secondRange.lower) {
        return -1
    } else if (firstRange.lower > secondRange.lower) {
        return 1
    }
    return 0
}

