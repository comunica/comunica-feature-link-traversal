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
    solutionDomain: SolutionDomain;
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
        this.upper = range[0];
        this.lower = range[1];
    }

    public isOverlaping(otherRange: SolutionRange): boolean {
        if (this.upper === otherRange.upper && this.lower === otherRange.lower) {
            return true;
        } else if (this.upper >= otherRange.lower && this.upper <= otherRange.upper) {
            return true;
        } else if (this.lower >= otherRange.lower && this.lower <= otherRange.upper) {
            return true;
        }
        return false;
    }
    public fuseRangeIfOverlap(otherRange: SolutionRange): SolutionRange | undefined {
        if (this.isOverlaping(otherRange)) {
            const lowest = this.lower < otherRange.lower ? this.lower : otherRange.lower;
            const uppest = this.upper > otherRange.upper ? this.upper : otherRange.upper;
            return new SolutionRange([uppest, lowest]);
        }
        return undefined;
    }

    public clone(): SolutionRange {
        return new SolutionRange([this.upper, this.lower]);
    }
}


export class SolutionDomain {
    private canBeSatisfy: boolean = true;
    private domain: SolutionRange[];
    private excludedDomain: SolutionRange[] = [];

    constructor(initialDomain: SolutionRange) {
        this.domain = [initialDomain];
    }


    public add(range: SolutionRange): boolean {
        for (const excluded of this.excludedDomain) {
            if (excluded.isOverlaping(range)) {
                this.canBeSatisfy = false;
                return this.canBeSatisfy
            }
        }

        let currentRange = range.clone();
        let fusedIndex: number[] = [];

        this.domain.map((el, idx) => {
            const fusedRange = el.fuseRangeIfOverlap(currentRange);
            if (typeof fusedRange !== 'undefined') {
                fusedIndex.push(idx);
                currentRange = fusedRange;
                return fusedRange;
            }
            return el
        });

        for (let i = 0; i < fusedIndex.length - 1; i++) {
            this.domain.splice(fusedIndex[i]);
        }
        return this.canBeSatisfy;
    }
}

