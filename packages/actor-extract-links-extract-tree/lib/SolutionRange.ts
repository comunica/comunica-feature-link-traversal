/**
 * A class representing the range of a solution it contain method to
 * facilitate operation between subdomain.
 */
export class SolutionRange {
    /**
     * The upper bound of the range.
     */
    public readonly upper: number;
    /**
     * The lower bound of the range.
     */
    public readonly lower: number;

    /**
     * Constructor of a solution range, will throw an error if the lower range is greater than the upper range.
     * @param {[number, number]} range - An array where the first memeber is the lower bound of the range
     * and the second the upper bound
     */
    constructor(range: [number, number]) {
        if (range[0] > range[1]) {
            throw new RangeError('the first element of the range should lower or equal to the second');
        }
        this.lower = range[0];
        this.upper = range[1];
    }
    /**
     * Check if the two ranges overlap.
     * @param {SolutionRange} otherRange 
     * @returns {boolean} Return true if the two range overlap.
     */
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
    /**
     * Check whether the other range is inside the subject range. 
     * @param {SolutionRange} otherRange 
     * @returns {boolean} Return true if the other range is inside this range.
     */
    public isInside(otherRange: SolutionRange): boolean {
        return otherRange.lower >= this.lower && otherRange.upper <= this.upper;
    }
    /**
     * Fuse two ranges if they overlap.
     * @param {SolutionRange} subjectRange 
     * @param {SolutionRange} otherRange 
     * @returns {SolutionRange[]} Return the fused range if they overlap else return the input ranges.
     */
    public static fuseRange(subjectRange: SolutionRange, otherRange: SolutionRange): SolutionRange[] {
        if (subjectRange.isOverlapping(otherRange)) {
            const lowest = subjectRange.lower < otherRange.lower ? subjectRange.lower : otherRange.lower;
            const uppest = subjectRange.upper > otherRange.upper ? subjectRange.upper : otherRange.upper;
            return [new SolutionRange([lowest, uppest])];
        }
        return [subjectRange, otherRange];
    }
    /**
     * Inverse the range, in a way that the range become everything that it excluded. Might
     * 0 or return multiple ranges.
     * @returns {SolutionRange[]} The resulting ranges.
     */
    public inverse(): SolutionRange[] {
        if (this.lower === Number.NEGATIVE_INFINITY && this.upper === Number.POSITIVE_INFINITY) {
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
    /**
     * Get the range that intersect the other range and the subject range.
     * @param {SolutionRange} subjectRange
     * @param {SolutionRange} otherRange 
     * @returns {SolutionRange | undefined} Return the intersection if the range overlap otherwise return undefined
     */
    public static getIntersection(subjectRange: SolutionRange, otherRange: SolutionRange): SolutionRange | undefined {
        if (!subjectRange.isOverlapping(otherRange)) {
            return undefined;
        }
        const lower = subjectRange.lower > otherRange.lower ? subjectRange.lower : otherRange.lower;
        const upper = subjectRange.upper < otherRange.upper ? subjectRange.upper : otherRange.upper;

        return new SolutionRange([lower, upper]);
    }
}