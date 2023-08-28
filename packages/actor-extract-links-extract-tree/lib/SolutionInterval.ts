const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;
/**
 * A class representing the interval of a solution it contain method to
 * facilitate operation between subdomain.
 */
export class SolutionInterval {
  /**
     * The upper bound of the interval.
     */
  public readonly upper: number;
  /**
     * The lower bound of the interval.
     */
  public readonly lower: number;
  /**
   * Wether the interval is empty
   */
  public readonly isEmpty: boolean;

  /**
     * Constructor of a solution interval, will throw an error if the lower interval is greater than the upper interval.
     * @param {[number, number]} interval - An array where the first memeber is the lower bound of the interval
     * and the second the upper bound
     */
  public constructor(interval: [number, number] | []) {
    if (interval.length === 2) {
      if (interval[0] > interval[1]) {
        throw new RangeError('the first element of the interval should lower or equal to the second');
      }
      this.lower = interval[0];
      this.upper = interval[1];
      this.isEmpty = false;
    } else {
      this.isEmpty = true;
      this.lower = Number.NaN;
      this.upper = Number.NaN;
    }
    Object.freeze(this);
    Object.freeze(this.upper);
    Object.freeze(this.lower);
    Object.freeze(this.isEmpty);
  }

  /**
     * Check if the two intervals overlap.
     * @param {SolutionInterval} otherinterval
     * @returns {boolean} Return true if the two interval overlap.
     */
  public isOverlapping(otherinterval: SolutionInterval): boolean {
    if (this.isEmpty || otherinterval.isEmpty) {
      return false;
    }

    if (this.upper === otherinterval.upper && this.lower === otherinterval.lower) {
      return true;
    }

    if (this.upper >= otherinterval.lower && this.upper <= otherinterval.upper) {
      return true;
    }

    if (this.lower >= otherinterval.lower && this.lower <= otherinterval.upper) {
      return true;
    }

    if (otherinterval.lower >= this.lower && otherinterval.upper <= this.upper) {
      return true;
    }
    return false;
  }

  /**
     * Check whether the other interval is inside the subject interval.
     * @param {SolutionInterval} otherinterval
     * @returns {boolean} Return true if the other interval is inside the subject interval.
     */
  public isInside(otherinterval: SolutionInterval): boolean {
    if (this.isEmpty || otherinterval.isEmpty) {
      return false;
    }
    return otherinterval.lower >= this.lower && otherinterval.upper <= this.upper;
  }

  /**
     * Fuse two intervals if they overlap.
     * @param {SolutionInterval} subjectinterval
     * @param {SolutionInterval} otherinterval
     * @returns {SolutionInterval[]} Return the fused interval if they overlap else return the input intervals.
     * It also take into consideration if the interval is empty.
     */
  public static fuseinterval(subjectinterval: SolutionInterval, otherinterval: SolutionInterval): SolutionInterval[] {
    if (subjectinterval.isEmpty && otherinterval.isEmpty) {
      return [ new SolutionInterval([]) ];
    }

    if (subjectinterval.isEmpty && !otherinterval.isEmpty) {
      return [ otherinterval ];
    }

    if (!subjectinterval.isEmpty && otherinterval.isEmpty) {
      return [ subjectinterval ];
    }

    if (subjectinterval.isOverlapping(otherinterval)) {
      const lowest = subjectinterval.lower < otherinterval.lower ? subjectinterval.lower : otherinterval.lower;
      const uppest = subjectinterval.upper > otherinterval.upper ? subjectinterval.upper : otherinterval.upper;
      return [ new SolutionInterval([ lowest, uppest ]) ];
    }
    return [ subjectinterval, otherinterval ];
  }

  /**
     * Inverse the interval, in a way that the interval become everything that was excluded.
     * @returns {SolutionInterval[]} The resulting intervals.
     */
  public inverse(): SolutionInterval[] {
    if (this.isEmpty) {
      return [ new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]) ];
    }
    if (this.lower === Number.NEGATIVE_INFINITY && this.upper === Number.POSITIVE_INFINITY) {
      return [ new SolutionInterval([]) ];
    }

    if (this.lower === Number.NEGATIVE_INFINITY) {
      return [ new SolutionInterval([ nextUp(this.upper), Number.POSITIVE_INFINITY ]) ];
    }

    if (this.upper === Number.POSITIVE_INFINITY) {
      return [ new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(this.lower) ]) ];
    }
    return [
      new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(this.lower) ]),
      new SolutionInterval([ nextUp(this.upper), Number.POSITIVE_INFINITY ]),
    ];
  }

  /**
     * Get the interval that intersect the other interval and the subject interval.
     * @param {SolutionInterval} subjectinterval
     * @param {SolutionInterval} otherinterval
     * @returns {SolutionInterval | undefined} Return the intersection
     *    if the interval overlap otherwise return undefined
     */
  public static getIntersection(subjectinterval: SolutionInterval,
    otherinterval: SolutionInterval): SolutionInterval {
    if (!subjectinterval.isOverlapping(otherinterval) || subjectinterval.isEmpty || otherinterval.isEmpty) {
      return new SolutionInterval([]);
    }
    const lower = subjectinterval.lower > otherinterval.lower ? subjectinterval.lower : otherinterval.lower;
    const upper = subjectinterval.upper < otherinterval.upper ? subjectinterval.upper : otherinterval.upper;

    return new SolutionInterval([ lower, upper ]);
  }
}
