import { Or, And, operatorFactory } from '../lib/LogicOperator';
import { SolutionDomain } from '../lib/SolutionDomain';
import { SolutionInterval } from '../lib/SolutionInterval';
import { LogicOperatorSymbol } from '../lib/solverInterfaces';

describe('LogicOperator', () => {
  describe('Or', () => {
    const or = new Or();
    describe('operatorName', () => {
      it('Should return the associated operator name', () => {
        expect(or.operatorName()).toBe(LogicOperatorSymbol.Or);
      });
    });
    describe('apply', () => {
      const intervals = [
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 1, 5 ]),
        new SolutionInterval([ 10, 10 ]),
        new SolutionInterval([ 21, 33 ]),
        new SolutionInterval([ 60, 70 ]),
      ];
      const aDomain = SolutionDomain.newWithInitialIntervals(intervals);
      it('given an empty domain should be able to add an interval', () => {
        const interval = new SolutionInterval([ 0, 1 ]);
        const solutionDomain = new SolutionDomain();
        const expectedSolutionDomain = SolutionDomain.newWithInitialIntervals(interval);
        expect(or.apply({ domain: solutionDomain, intervals: interval })).toStrictEqual(expectedSolutionDomain);
      });

      it('given an empty domain should be able to add multiple intervals that doesn\'t overlap', () => {
        const givenIntervals = [
          new SolutionInterval([ 10, 10 ]),
          new SolutionInterval([ 1, 2 ]),
          new SolutionInterval([ -1, 0 ]),
          new SolutionInterval([ 60, 70 ]),
        ];

        let solutionDomain = new SolutionDomain();

        givenIntervals.forEach((interval, idx) => {
          solutionDomain = or.apply({ domain: solutionDomain, intervals: interval });
          expect(solutionDomain.getDomain().length).toBe(idx + 1);
        });

        const expectedDomain = [
          new SolutionInterval([ -1, 0 ]),
          new SolutionInterval([ 1, 2 ]),
          new SolutionInterval([ 10, 10 ]),
          new SolutionInterval([ 60, 70 ]),
        ];

        expect(solutionDomain.getDomain()).toStrictEqual(expectedDomain);
      });

      it('given a domain should not add an interval that is inside another', () => {
        const anOverlappingInterval = new SolutionInterval([ 22, 23 ]);
        const newDomain = or.apply({ domain: aDomain, intervals: anOverlappingInterval });

        expect(newDomain.getDomain().length).toBe(aDomain.getDomain().length);
        expect(newDomain.getDomain()).toStrictEqual(intervals);
      });

      it(`given a domain should be able to create a 
      single domain if all the domain segments are contained into the new interval`,
      () => {
        const anOverlappingInterval = new SolutionInterval([ -100, 100 ]);
        const newDomain = or.apply({ domain: aDomain, intervals: anOverlappingInterval });

        expect(newDomain.getDomain().length).toBe(1);
        expect(newDomain.getDomain()).toStrictEqual([ anOverlappingInterval ]);
      });

      it('given a domain should be able to fuse multiple domain segment if the new interval overlaps with them', () => {
        const aNewInterval = new SolutionInterval([ 1, 23 ]);
        const newDomain = or.apply({ domain: aDomain, intervals: aNewInterval });

        const expectedResultingDomainInterval = [
          new SolutionInterval([ -1, 0 ]),
          new SolutionInterval([ 1, 33 ]),
          new SolutionInterval([ 60, 70 ]),
        ];

        expect(newDomain.getDomain().length).toBe(3);
        expect(newDomain.getDomain()).toStrictEqual(expectedResultingDomainInterval);
      });
    });
  });

  describe('And', () => {
    const and = new And();
    describe('operatorName', () => {
      it('Should return the associated operator name', () => {
        expect(and.operatorName()).toBe(LogicOperatorSymbol.And);
      });
    });
    describe('apply', () => {
      let aDomain: SolutionDomain = new SolutionDomain();
      const intervals = [
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 1, 5 ]),
        new SolutionInterval([ 10, 10 ]),
        new SolutionInterval([ 21, 33 ]),
        new SolutionInterval([ 60, 70 ]),
      ];
      beforeEach(() => {
        aDomain = SolutionDomain.newWithInitialIntervals(new Array(...intervals));
      });

      it('should add an interval when the domain is empty', () => {
        const domain = new SolutionDomain();
        const interval = new SolutionInterval([ 0, 1 ]);

        const newDomain = and.apply({ intervals:interval, domain });

        expect(newDomain.getDomain()).toStrictEqual([ interval ]);
      });

      it('should return an empty domain if there is no intersection with the new interval', () => {
        const interval = new SolutionInterval([ -200, -100 ]);

        const newDomain = and.apply({ intervals:interval, domain: aDomain });

        expect(newDomain.isDomainEmpty()).toBe(true);
      });

      it('given a new interval inside a part of the domain should only return the intersection', () => {
        const interval = new SolutionInterval([ 22, 30 ]);

        const newDomain = and.apply({ intervals: interval, domain: aDomain });

        expect(newDomain.getDomain()).toStrictEqual([ interval ]);
      });

      it('given a new interval that intersects part of the domain should only return the intersection', () => {
        const interval = new SolutionInterval([ 19, 25 ]);

        const expectedDomain = [
          new SolutionInterval([ 21, 25 ]),
        ];

        const newDomain = and.apply({ intervals: interval, domain: aDomain });

        expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
      });

      it('given a new interval that intersect multiple part of the domain should only return the intersections', () => {
        const interval = new SolutionInterval([ -2, 25 ]);

        const expectedDomain = [
          new SolutionInterval([ -1, 0 ]),
          new SolutionInterval([ 1, 5 ]),
          new SolutionInterval([ 10, 10 ]),
          new SolutionInterval([ 21, 25 ]),
        ];

        const newDomain = and.apply({ intervals: interval, domain: aDomain });

        expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
      });

      it('given an empty domain and two intervals that are overlapping the domain should remain empty', () => {
        const domain = new SolutionDomain();
        const interval1 = new SolutionInterval([ 0, 2 ]);
        const interval2 = new SolutionInterval([ 1, 2 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain });

        expect(newDomain.isDomainEmpty()).toBe(true);
      });

      it('given a domain and two intervals that are overlapping the domain should remain empty', () => {
        const interval1 = new SolutionInterval([ 0, 2 ]);
        const interval2 = new SolutionInterval([ 1, 2 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain: aDomain });

        expect(newDomain.equal(aDomain)).toBe(true);
      });

      it(`given a domain and two intervals that are not overlapping and also 
      don't overlap with the domain should return the initial domain`, () => {
        const interval1 = new SolutionInterval([ -100, -50 ]);
        const interval2 = new SolutionInterval([ -25, -23 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain: aDomain });

        expect(newDomain.getDomain()).toStrictEqual(aDomain.getDomain());
      });

      it(`given a domain and two intervals that are not overlapping and where the first 
      one is overlapping with the domain then should return a valid new domain`, () => {
        const interval1 = new SolutionInterval([ 1, 3 ]);
        const interval2 = new SolutionInterval([ -25, -23 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain: aDomain });
        const expectedDomain = SolutionDomain.newWithInitialIntervals(interval1);
        expect(newDomain.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it(`given a domain and two intervals that are not overlapping and where the second 
      one is overlapping with the domain then should return a valid new domain`, () => {
        const interval1 = new SolutionInterval([ -25, -23 ]);
        const interval2 = new SolutionInterval([ 1, 3 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain: aDomain });
        const expectedDomain = SolutionDomain.newWithInitialIntervals(interval2);
        expect(newDomain.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it(`given a domain and two intervals that are not overlapping and where both are
       overlapping with the domain but the first one is more overlapping than the second in relation to the domain
      then should return a valid new domain`, () => {
        const interval1 = new SolutionInterval([ 2, 70 ]);
        const interval2 = new SolutionInterval([ 1, 1 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain: aDomain });
        const expectedDomain = SolutionDomain.newWithInitialIntervals([
          interval2,
          new SolutionInterval([ 2, 5 ]),
          new SolutionInterval([ 10, 10 ]),
          new SolutionInterval([ 21, 33 ]),
          new SolutionInterval([ 60, 70 ]) ]);
        expect(newDomain.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });

      it(`given a domain and two intervals that are not overlapping and where both are
      overlapping with the domain but the second one is more overlapping than the second in relation to the domain
     then should return a valid new domain`, () => {
        const interval1 = new SolutionInterval([ 1, 1 ]);

        const interval2 = new SolutionInterval([ 2, 70 ]);

        const newDomain = and.apply({ intervals: [ interval1, interval2 ], domain: aDomain });
        const expectedDomain = SolutionDomain.newWithInitialIntervals([
          interval1,
          new SolutionInterval([ 2, 5 ]),
          new SolutionInterval([ 10, 10 ]),
          new SolutionInterval([ 21, 33 ]),
          new SolutionInterval([ 60, 70 ]) ]);
        expect(newDomain.getDomain()).toStrictEqual(expectedDomain.getDomain());
      });
    });
  });

  describe('operatorFactory', () => {
    it('given an unsupported logicOperator should throw an error', () => {
      expect(() => operatorFactory(LogicOperatorSymbol.Exist)).toThrow();
      expect(() => operatorFactory(LogicOperatorSymbol.Not)).toThrow();
    });

    it('Given an Or or an And operator should return an LogicOperator', () => {
      for (const operator of [ LogicOperatorSymbol.And, LogicOperatorSymbol.Or ]) {
        expect(operatorFactory(operator).operatorName()).toBe(operator);
      }
    });
  });
});
