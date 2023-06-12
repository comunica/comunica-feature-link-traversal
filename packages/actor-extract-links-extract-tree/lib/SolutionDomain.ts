import type { SolutionInterval } from './SolutionInterval';

/**
 * A class representing the domain of a solution of a system of boolean equations.
 */
export class SolutionDomain {
  /**
     * The multiple segment of the domain, it is always order by the lower bound
     * of the SolutionInterval.
     */
  private domain: SolutionInterval[] = [];

  /**
     * Get the multiple segment of the domain.
     * @returns {SolutionInterval[]}
     */
  public getDomain(): SolutionInterval[] {
    return this.domain;
  }

  /**
   * Check if two {@link SolutionDomain} are equals.
   * @param {SolutionDomain} other - the other domain
   * @returns {boolean} whether two domains are equals
   */
  public equal(other: SolutionDomain): boolean {
    if (this.domain.length !== other.domain.length) {
      return false;
    }

    for (let i = 0; i !== this.domain.length; i++) {
      if (!(this.domain[i].lower === other.domain[i].lower &&
        this.domain[i].upper === other.domain[i].upper
      )) {
        return false;
      }
    }

    return true;
  }

  /**
     * Check whether the domain is empty
     * @returns {boolean} Return true if the domain is empty
     */
  public isDomainEmpty(): boolean {
    if (this.domain.length === 0) {
      return true;
    }

    if (this.domain.length === 1 && this.domain[0].isEmpty) {
      return true;
    }
    return false;
  }

  /**
     * Create a new {@link SolutionDomain} with inititial values.
     * @param {SolutionInterval | SolutionInterval[]} initialIntervals
     * @returns {SolutionDomain}
     */
  public static newWithInitialIntervals(initialIntervals: SolutionInterval | SolutionInterval[]): SolutionDomain {
    const newSolutionDomain = new SolutionDomain();
    if (Array.isArray(initialIntervals)) {
      // We keep the domain sorted
      initialIntervals.sort(SolutionDomain.sortDomainRangeByLowerBound);
      newSolutionDomain.domain = initialIntervals;
      if (SolutionDomain.isThereOverlapInsideDomain(newSolutionDomain.getDomain())) {
        throw new RangeError('There is overlap inside the domain.');
      }
    } else if (!initialIntervals.isEmpty) {
      newSolutionDomain.domain = [ initialIntervals ];
    }
    Object.freeze(newSolutionDomain);
    Object.freeze(newSolutionDomain.domain);
    return newSolutionDomain;
  }

  /**
     * Simple sort function to order the domain by the lower bound of SolutionRange.
     * @param {SolutionInterval} firstinterval
     * @param {SolutionInterval} secondInterval
     * @returns {number} see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     */
  public static sortDomainRangeByLowerBound(firstinterval: SolutionInterval, secondInterval: SolutionInterval): number {
    if (firstinterval.lower < secondInterval.lower) {
      return -1;
    }
    return 1;
  }

  /**
   * The invariant contract of the {@link SolutionDomain}.
   * There should be no overlapping domain segment.
   * @returns {boolean} whether or not the domain is overlapping
   */
  public static isThereOverlapInsideDomain(domain: SolutionInterval[]): boolean {
    for (let i = 0; i < domain.length - 1; i++) {
      if (domain[i].isOverlapping(domain[i + 1])) {
        return true;
      }
    }
    return false;
  }
}
