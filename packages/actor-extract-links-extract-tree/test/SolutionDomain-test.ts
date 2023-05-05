import { SolutionInterval } from '../lib//SolutionInterval';
import { SolutionDomain } from '../lib/SolutionDomain';
import { LogicOperatorSymbol } from '../lib/solverInterfaces';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('SolutionDomain', () => {
  describe('constructor', () => {
    it('should return an empty solution domain', () => {
      const solutionDomain = new SolutionDomain();

      expect(solutionDomain.getDomain().length).toBe(0);
    });
  });

  describe('newWithInitialIntervals', () => {
    it('should create a solution domain with an initial value', () => {
      const solutionRange = new SolutionInterval([ 0, 1 ]);
      const solutionDomain = SolutionDomain.newWithInitialIntervals(solutionRange);

      expect(solutionDomain.getDomain().length).toBe(1);
      expect(solutionDomain.getDomain()[0]).toStrictEqual(solutionRange);
    });

    it('should create a solution domain with multiple initial value', () => {
      const solutionIntervals = [
        new SolutionInterval([ 0, 1 ]),
        new SolutionInterval([ 2, 3 ]),
        new SolutionInterval([ -33, -3 ]),
        new SolutionInterval([ 100, 3000 ])
      ];
      const solutionDomain = SolutionDomain.newWithInitialIntervals(solutionIntervals);

      expect(solutionDomain.getDomain().length).toBe(solutionIntervals.length);
      expect(solutionDomain.getDomain()).toStrictEqual(solutionIntervals);
    });

    it('should throw an error when creating a solution domain with multiple intervals overlaping', () => {
      const solutionIntervals = [
        new SolutionInterval([ 0, 1 ]),
        new SolutionInterval([ 2, 3 ]),
        new SolutionInterval([ 2, 10 ]),
      ];
      expect(()=>{
        SolutionDomain.newWithInitialIntervals(solutionIntervals);
      }).toThrow(RangeError);
    });
    
  });

  describe('addWithOrOperator', () => {
    let aDomain: SolutionDomain = new SolutionDomain();
    const aRanges = [
      new SolutionInterval([ -1, 0 ]),
      new SolutionInterval([ 1, 5 ]),
      new SolutionInterval([ 10, 10 ]),
      new SolutionInterval([ 21, 33 ]),
      new SolutionInterval([ 60, 70 ]),
    ];
    beforeEach(() => {
      aDomain = new SolutionDomain();
      for (const r of aRanges) {
        aDomain = aDomain.addWithOrOperator(r);
      }
    });

    it('given an empty domain should be able to add multiple subject range that doesn\'t overlap', () => {
      const ranges = [
        new SolutionInterval([ 10, 10 ]),
        new SolutionInterval([ 1, 2 ]),
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 60, 70 ]),
      ];

      let solutionDomain = new SolutionDomain();

      ranges.forEach((range, idx) => {
        solutionDomain = solutionDomain.addWithOrOperator(range);
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

    it('given a domain should not add a range that is inside another', () => {
      const anOverlappingRange = new SolutionInterval([ 22, 23 ]);
      const newDomain = aDomain.addWithOrOperator(anOverlappingRange);

      expect(newDomain.getDomain().length).toBe(aDomain.getDomain().length);
      expect(newDomain.getDomain()).toStrictEqual(aRanges);
    });

    it('given a domain should create a single domain if all the domain segment are contain into the new range', () => {
      const anOverlappingRange = new SolutionInterval([ -100, 100 ]);
      const newDomain = aDomain.addWithOrOperator(anOverlappingRange);

      expect(newDomain.getDomain().length).toBe(1);
      expect(newDomain.getDomain()).toStrictEqual([ anOverlappingRange ]);
    });

    it('given a domain should fuse multiple domain segment if the new range overlap with them', () => {
      const aNewRange = new SolutionInterval([ 1, 23 ]);
      const newDomain = aDomain.addWithOrOperator(aNewRange);

      const expectedResultingDomainRange = [
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 1, 33 ]),
        new SolutionInterval([ 60, 70 ]),
      ];

      expect(newDomain.getDomain().length).toBe(3);
      expect(newDomain.getDomain()).toStrictEqual(expectedResultingDomainRange);
    });
  });

  describe('notOperation', () => {
    it('given a domain with one range should return the inverse of the domain', () => {
      const solutionRange = new SolutionInterval([ 0, 1 ]);
      const solutionDomain = SolutionDomain.newWithInitialValue(solutionRange);

      const expectedDomain = [
        new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(0) ]),
        new SolutionInterval([ nextUp(1), Number.POSITIVE_INFINITY ]),
      ];
      const newDomain = solutionDomain.notOperation();

      expect(newDomain.getDomain().length).toBe(2);
      expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
    });

    it('given a domain with multiple range should return the inverted domain', () => {
      let domain = new SolutionDomain();
      const ranges = [
        new SolutionInterval([ 0, 1 ]),
        new SolutionInterval([ 2, 2 ]),
        new SolutionInterval([ 44, 55 ]),
      ];
      const expectedDomain = [
        new SolutionInterval([ Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY ]),
      ];

      for (const r of ranges) {
        domain = domain.addWithOrOperator(r);
      }
      domain = domain.notOperation();

      expect(domain.getDomain()).toStrictEqual(expectedDomain);
    });
  });

  describe('addWithAndOperator', () => {
    let aDomain: SolutionDomain = new SolutionDomain();
    const aRanges = [
      new SolutionInterval([ -1, 0 ]),
      new SolutionInterval([ 1, 5 ]),
      new SolutionInterval([ 10, 10 ]),
      new SolutionInterval([ 21, 33 ]),
      new SolutionInterval([ 60, 70 ]),
    ];
    beforeEach(() => {
      aDomain = new SolutionDomain();
      for (const r of aRanges) {
        aDomain = aDomain.addWithOrOperator(r);
      }
    });

    it('should add a range when the domain is empty', () => {
      const domain = new SolutionDomain();
      const aRange = new SolutionInterval([ 0, 1 ]);

      const newDomain = domain.addWithAndOperator(aRange);

      expect(newDomain.getDomain()).toStrictEqual([ aRange ]);
    });

    it('should return an empty domain if there is no intersection with the new range', () => {
      const aRange = new SolutionInterval([ -200, -100 ]);

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.getDomain().length).toBe(0);
    });

    it('given a new range that is inside a part of the domain should only return the intersection', () => {
      const aRange = new SolutionInterval([ 22, 30 ]);

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.getDomain()).toStrictEqual([ aRange ]);
    });

    it('given a new range that intersect a part of the domain should only return the intersection', () => {
      const aRange = new SolutionInterval([ 19, 25 ]);

      const expectedDomain = [
        new SolutionInterval([ 21, 25 ]),
      ];

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
    });

    it('given a new range that intersect multiple part of the domain should only return the intersections', () => {
      const aRange = new SolutionInterval([ -2, 25 ]);

      const expectedDomain = [
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 1, 5 ]),
        new SolutionInterval([ 10, 10 ]),
        new SolutionInterval([ 21, 25 ]),
      ];

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.getDomain()).toStrictEqual(expectedDomain);
    });

    it('given an empty domain and a last operator and should return an empty domain', () => {
      const aRange = new SolutionInterval([ -2, 25 ]);
      const anotherRangeNonOverlapping = new SolutionInterval([ 2_000, 3_000 ]);

      let newDomain = aDomain.addWithAndOperator(aRange);
      newDomain = newDomain.add({ range: anotherRangeNonOverlapping, operator: LogicOperatorSymbol.And });
      expect(newDomain.isDomainEmpty()).toBe(true);

      newDomain = newDomain.addWithAndOperator(aRange);

      expect(newDomain.isDomainEmpty()).toBe(true);
    });
  });

  describe('isDomainEmpty', () => {
    it('should return true when the domain is empty', () => {
      const domain = new SolutionDomain();

      expect(domain.isDomainEmpty()).toBe(true);
    });

    it('should return false when the domain is not empty', () => {
      const domain = SolutionDomain.newWithInitialValue(new SolutionInterval([ 0, 1 ]));

      expect(domain.isDomainEmpty()).toBe(false);
    });
  });

  describe('clone', () => {
    it('should return a deep copy of an existing domain', () => {
      let domain = SolutionDomain.newWithInitialValue(new SolutionInterval([ 0, 1 ]));
      const clonedDomain = domain.clone();
      domain = domain.addWithOrOperator(new SolutionInterval([ 100, 200 ]));
      expect(clonedDomain.getDomain()).not.toStrictEqual(domain.getDomain());
    });
  });
});
