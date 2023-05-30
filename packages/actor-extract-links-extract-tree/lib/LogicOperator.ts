import { SolutionDomain } from './SolutionDomain';
import { SolutionInterval } from './SolutionInterval';
import { LogicOperatorSymbol } from './solverInterfaces';
export interface LogicOperator {
  apply: ({ interval, domain }: { interval: SolutionInterval | [SolutionInterval, SolutionInterval]; domain: SolutionDomain }) => SolutionDomain;
  operatorName: () => LogicOperatorSymbol;
}

export class Or implements LogicOperator {
  public apply({ interval, domain }: { interval: SolutionInterval | [SolutionInterval, SolutionInterval]; domain: SolutionDomain }): SolutionDomain {
    if (Array.isArray(interval)) {
      domain = this.apply({ interval: interval[0], domain });
      return this.apply({ interval: interval[1], domain });
    }
    let newDomain: SolutionInterval[] = [];

    let currentInterval = interval;

    // We iterate over all the domain
    newDomain = domain.getDomain().filter(el => {
      // We check if we can fuse the new range with the current range
      // let's not forget that the domain is sorted by the lowest bound
      // of the SolutionRange
      const resp = SolutionInterval.fuseRange(el, currentInterval);
      if (resp.length === 1) {
        // If we fuse the range and consider this new range as our current range
        // and we delete the old range from the domain as we now have a new range that contained the old
        currentInterval = resp[0];
        return false;
      }
      return true;
    });
    // We add the potentialy fused range.
    newDomain.push(currentInterval);

    return SolutionDomain.newWithInitialIntervals(newDomain);
  }

  public operatorName(): LogicOperatorSymbol {
    return LogicOperatorSymbol.Or;
  }
}

export class And implements LogicOperator {
  apply({ interval, domain }: { interval: SolutionInterval | [SolutionInterval, SolutionInterval]; domain: SolutionDomain }): SolutionDomain {
    if (Array.isArray(interval)) {

      if (interval[0].isOverlapping(interval[1])) {
        return domain;
      }

      const testDomain1 = this.apply({ interval: interval[0], domain });
      const testDomain2 = this.apply({ interval: interval[1], domain });

      const cannotAddDomain1 = testDomain1.isDomainEmpty();
      const cannotAddDomain2 = testDomain2.isDomainEmpty();

      if (cannotAddDomain1 && cannotAddDomain2) {
        return domain;
      } if (!cannotAddDomain1 && cannotAddDomain2) {
        return testDomain1;
      } if (cannotAddDomain1 && !cannotAddDomain2) {
        return testDomain2;
      }

      let intervalRes: SolutionInterval;
      let newDomain: SolutionDomain;
      if(testDomain1.getDomain().length > testDomain2.getDomain().length){
        intervalRes = interval[1];
        newDomain = testDomain1;
      }else{
        intervalRes = interval[0];
        newDomain = testDomain2;
      }

      return new Or().apply({
        interval: intervalRes, domain: newDomain
      });
    }
    const newDomain: SolutionInterval[] = [];

    // If the domain is empty then simply add the new range
    if (domain.getDomain().length === 0) {
      newDomain.push(interval);
      return SolutionDomain.newWithInitialIntervals(interval);
    }
    // Considering the current domain if there is an intersection
    // add the intersection to the new domain
    domain.getDomain().forEach(el => {
      const intersection = SolutionInterval.getIntersection(el, interval);
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

const OPERATOR_MAP = new Map<LogicOperatorSymbol, LogicOperator>(
  [
    [new Or().operatorName(), new Or()],
    [new And().operatorName(), new And()],
  ],
);

export function operatorFactory(operatorSymbol: LogicOperatorSymbol): LogicOperator {
  const operator = OPERATOR_MAP.get(operatorSymbol);
  if (!operator) {
    throw new RangeError('The operator doesn\'t exist or is not supported.');
  }
  return operator;
}
