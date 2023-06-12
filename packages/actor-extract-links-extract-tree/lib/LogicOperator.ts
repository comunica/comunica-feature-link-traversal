import { SolutionDomain } from './SolutionDomain';
import { SolutionInterval } from './SolutionInterval';
import { LogicOperatorSymbol } from './solverInterfaces';

/**
 * A logic operator
 */
export interface ILogicOperator {
  /**
   * Apply the operation on a domain given an interval
   */
  apply: ({ intervals, domain }:
  { intervals: SolutionInterval | [SolutionInterval, SolutionInterval] | SolutionInterval[]; domain: SolutionDomain }) => SolutionDomain;
  /**
   * The name of the operator
   */
  operatorName: () => LogicOperatorSymbol;
}

export class Or implements ILogicOperator {
  public apply({ intervals: intervals, domain }:
  { intervals: SolutionInterval |SolutionInterval[] ; domain: SolutionDomain }): SolutionDomain {
    if (Array.isArray(intervals)) {
      for (const interval of intervals){
        domain = this.apply({ intervals: interval, domain });
      }
      return domain
    }
    let newDomain: SolutionInterval[] = [];

    let currentInterval = intervals;

    // We iterate over all the domain
    newDomain = domain.getDomain().filter(el => {
      // We check if we can fuse the new range with the current range
      // let's not forget that the domain is sorted by the lowest bound
      // of the SolutionInterval.
      const resp = SolutionInterval.fuseinterval(el, currentInterval);
      if (resp.length === 1) {
        // If we fuse the interval we consider this new interval as our current interval
        // and we delete the old interval from the domain as we now have a new interval that contained the old
        // one
        currentInterval = resp[0];
        return false;
      }
      return true;
    });
    // We add the potentialy fused interval.
    newDomain.push(currentInterval);

    return SolutionDomain.newWithInitialIntervals(newDomain);
  }

  public operatorName(): LogicOperatorSymbol {
    return LogicOperatorSymbol.Or;
  }
}

export class And implements ILogicOperator {
  public apply({ intervals: intervals, domain }:
  { intervals: SolutionInterval | SolutionInterval[]| [SolutionInterval, SolutionInterval]; domain: SolutionDomain }): SolutionDomain {
    if (Array.isArray(intervals)) {
      // We check if it is a step interval
      if (intervals[0].isOverlapping(intervals[1])) {
        return domain;
      }

      const testDomain1 = this.apply({ intervals: intervals[0], domain });
      const testDomain2 = this.apply({ intervals: intervals[1], domain });
      // We check which part of the interval can be added to domain.
      const cannotAddDomain1 = testDomain1.isDomainEmpty();
      const cannotAddDomain2 = testDomain2.isDomainEmpty();

      if (cannotAddDomain1 && cannotAddDomain2) {
        return domain;
      }

      if (!cannotAddDomain1 && cannotAddDomain2) {
        return testDomain1;
      }

      if (cannotAddDomain1 && !cannotAddDomain2) {
        return testDomain2;
      }

      // If both can be added we consider the larger domain and use an OR operation
      // to add the other part.
      let intervalRes: SolutionInterval;
      let newDomain: SolutionDomain;
      if (testDomain1.getDomain().length > testDomain2.getDomain().length) {
        intervalRes = intervals[1];
        newDomain = testDomain1;
      } else {
        intervalRes = intervals[0];
        newDomain = testDomain2;
      }

      return new Or().apply({
        intervals: intervalRes, domain: newDomain,
      });
    }
    const newDomain: SolutionInterval[] = [];

    // If the domain is empty then simply add the new range
    if (domain.getDomain().length === 0) {
      newDomain.push(intervals);
      return SolutionDomain.newWithInitialIntervals(intervals);
    }
    // Considering the current domain if there is an intersection
    // add the intersection to the new domain
    domain.getDomain().forEach(el => {
      const intersection = SolutionInterval.getIntersection(el, intervals);
      if (!intersection.isEmpty) {
        newDomain.push(intersection);
      }
    });

    if (newDomain.length === 0) {
      newDomain.push(new SolutionInterval([]));
    }

    return SolutionDomain.newWithInitialIntervals(newDomain);
  }

  public operatorName(): LogicOperatorSymbol {
    return LogicOperatorSymbol.And;
  }
}

const OPERATOR_MAP = new Map<LogicOperatorSymbol, ILogicOperator>(
  [
    [ new Or().operatorName(), new Or() ],
    [ new And().operatorName(), new And() ],
  ],
);

/**
 * A factory to get a {@link ILogicOperator} from a {@link LogicOperatorSymbol}
 * @param {LogicOperatorSymbol} operatorSymbol - the symbol
 * @returns {ILogicOperator} the operator
 */
export function operatorFactory(operatorSymbol: LogicOperatorSymbol): ILogicOperator {
  const operator = OPERATOR_MAP.get(operatorSymbol);
  if (!operator) {
    throw new RangeError('The operator doesn\'t exist or is not supported.');
  }
  return operator;
}
