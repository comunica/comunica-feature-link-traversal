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

    public inverse(): SolutionRange[] {
        if (this.lower === Number.NEGATIVE_INFINITY && this.upper === Number.POSITIVE_INFINITY) {
            return [];
        } else if (this.lower === this.upper) {
            return [];
        } else if (this.lower === Number.NEGATIVE_INFINITY) {
            return [new SolutionRange([this.upper + Number.EPSILON, Number.POSITIVE_INFINITY])]
        } else if (this.upper === Number.POSITIVE_INFINITY) {
            return [new SolutionRange([Number.NEGATIVE_INFINITY, this.lower - Number.EPSILON])];
        }
        return [
            new SolutionRange([Number.NEGATIVE_INFINITY, this.lower - Number.EPSILON]),
            new SolutionRange([this.upper + Number.EPSILON, Number.POSITIVE_INFINITY]),
        ];
    }
}