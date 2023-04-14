import { SolutionInterval } from './SolutionInterval';
import { LogicOperator } from './solverInterfaces';

/**
 * A class representing the domain of a solution of system of boolean equation.
 * Every operation return a new object.
 */
export class SolutionDomain {
  /**
     * The multiple segment of the domain, it is always order by the lower bound
     * of the SolutionRange.
     */
  private domain: SolutionInterval[] = [];

  /**
    * The last operation apply to the domain
    *
    */
  private lastOperation: LogicOperator | undefined = undefined;

  /**
     * Get the multiple segment of the domain.
     * @returns {SolutionInterval[]}
     */
  public get_domain(): SolutionInterval[] {
    return new Array(...this.domain);
  }

  /**
     * Check whether the domain is empty
     * @returns {boolean} Return true if the domain is empty
     */
  public isDomainEmpty(): boolean {
    return this.domain.length === 0;
  }

  /**
     * Create a new SolutionDomain with an inititial value.
     * @param {SolutionInterval} initialRange
     * @returns {SolutionDomain}
     */
  public static newWithInitialValue(initialRange: SolutionInterval): SolutionDomain {
    const newSolutionDomain = new SolutionDomain();
    if (!initialRange.isEmpty) {
      newSolutionDomain.domain = [ initialRange ];
    }
    return newSolutionDomain;
  }

  /**
     * Clone the current solution domain.
     * @returns {SolutionDomain}
     */
  public clone(): SolutionDomain {
    const newSolutionDomain = new SolutionDomain();
    newSolutionDomain.domain = new Array(...this.domain);
    newSolutionDomain.lastOperation = this.lastOperation;
    return newSolutionDomain;
  }

  /**
     * Modifify the current solution range by applying a logical operation.
     * @param {SolutionInterval} range - The range of the incoming operation to apply.
     * @param {LogicOperator} operator - The logical operation to apply.
     * @returns {SolutionDomain} - A new SolutionDomain with the operation applied.
     */
  public add({ range, operator }: { range?: SolutionInterval; operator: LogicOperator }): SolutionDomain {
    let newDomain: SolutionDomain = this.clone();

    switch (operator) {
      case LogicOperator.And: {
        if (typeof range === 'undefined') {
          throw new ReferenceError('range should be defined with "AND" operator');
        }
        newDomain = this.addWithAndOperator(range);
        newDomain.lastOperation = LogicOperator.And;
        break;
      }
      case LogicOperator.Or: {
        if (typeof range === 'undefined') {
          throw new ReferenceError('range should be defined with "OR" operator');
        }
        newDomain = this.addWithOrOperator(range);
        newDomain.lastOperation = LogicOperator.Or;
        break;
      }

      case LogicOperator.Not: {
        newDomain = this.notOperation();
        newDomain.lastOperation = LogicOperator.Not;
        break;
      }
    }
    // Since we rely on the size of the domain to determine if the domain is empty or not
    // and that we have the concept of an empty solution range for the sake of simplicity
    // we delete the empty solution range if it is the only element.
    if (newDomain.domain.length === 1 && newDomain.domain[0].isEmpty) {
      newDomain.domain = [];
    }

    return newDomain;
  }

  /**
     * Apply an "OR" operator to the current solution domain with the input
     * solution range. It fuse the SolutionRange if needed to keep the simplest domain possible.
     * It also keep the domain order.
     * @param {SolutionInterval} range
     * @returns {SolutionDomain}
     */
  public addWithOrOperator(range: SolutionInterval): SolutionDomain {
    const newDomain = this.clone();
    let currentRange = range;
    // We iterate over all the domain
    newDomain.domain = newDomain.domain.filter(el => {
      // We check if we can fuse the new range with the current range
      // let's not forget that the domain is sorted by the lowest bound
      // of the SolutionRange
      const resp = SolutionInterval.fuseRange(el, currentRange);
      if (resp.length === 1) {
        // If we fuse the range and consider this new range as our current range
        // and we delete the old range from the domain as we now have a new range that contained the old
        currentRange = resp[0];
        return false;
      }
      return true;
    });
    // We add the potentialy fused range.
    newDomain.domain.push(currentRange);
    // We keep the domain sorted
    newDomain.domain.sort(SolutionDomain.sortDomainRangeByLowerBound);
    return newDomain;
  }

  /**
     * Apply an "AND" operator to the current solution domain with the input
     * solution range. It will keep only the insection of the subdomain with the input
     * range. It keep the domain ordered.
     * @param {SolutionInterval} range
     * @returns {SolutionDomain}
     */
  public addWithAndOperator(range: SolutionInterval): SolutionDomain {
    const newDomain = new SolutionDomain();

    // If the domain is empty and the last operation was an "AND"
    if (this.domain.length === 0 && this.lastOperation === LogicOperator.And) {
      return newDomain;
    }
    // If the domain is empty then simply add the new range
    if (this.domain.length === 0) {
      newDomain.domain.push(range);
      return newDomain;
    }
    // Considering the current domain if there is an intersection
    // add the intersection to the new domain
    this.domain.forEach(el => {
      const intersection = SolutionInterval.getIntersection(el, range);
      if (intersection) {
        newDomain.domain.push(intersection);
      }
    });
    // Keep the domain sorted
    newDomain.domain.sort(SolutionDomain.sortDomainRangeByLowerBound);
    return newDomain;
  }

  /**
     * Apply a "NOT" operator to the current solution domain.
     * Will inverse every subdomain and keep the domain simplest domain.
     * The order is preserved.
     * @returns {SolutionDomain}
     */
  public notOperation(): SolutionDomain {
    let newDomain = new SolutionDomain();
    for (const domainElement of this.domain) {
      // Inverse the domain and had it with care for the overlap
      // wich is similar to apply an or operator
      for (const el of domainElement.inverse()) {
        newDomain = newDomain.addWithOrOperator(el);
      }
    }
    return newDomain;
  }

  /**
     * Simple sort function to order the domain by the lower bound of SolutionRange.
     * @param {SolutionInterval} firstRange
     * @param {SolutionInterval} secondRange
     * @returns {number} see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     */
  private static sortDomainRangeByLowerBound(firstRange: SolutionInterval, secondRange: SolutionInterval): number {
    if (firstRange.lower < secondRange.lower) {
      return -1;
    }
    return 1;
  }
}
