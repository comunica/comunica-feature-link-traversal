import { SolutionInterval } from '../lib//SolutionInterval';
import { SolutionDomain } from '../lib/SolutionDomain';

describe('SolutionDomain', () => {
  describe('constructor', () => {
    it('should return an empty solution domain', () => {
      const solutionDomain = new SolutionDomain();

      expect(solutionDomain.getDomain().length).toBe(0);
    });
  });
  describe('equal', () => {
    it('should return equal when two domains have the same interval', () => {
      const domain1 = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 0, 1 ]));
      const domain2 = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 0, 1 ]));
      expect(domain1.equal(domain2)).toBe(true);
    });

    it('should return not equal when two domains have the a different interval', () => {
      const domain1 = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 0, 1 ]));
      const domain2 = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 0, 2 ]));
      expect(domain1.equal(domain2)).toBe(false);
    });

    it('should return equal when two domains are empty', () => {
      const domain1 = new SolutionDomain();
      const domain2 = new SolutionDomain();
      expect(domain1.equal(domain2)).toBe(true);
    });

    it('should return not equal when one domain is empty and the other have one interval', () => {
      const domain1 = new SolutionDomain();
      const domain2 = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 0, 2 ]));
      expect(domain1.equal(domain2)).toBe(false);
    });

    it('should return not equal when one domain is empty and the other have multiple intervals', () => {
      const domain1 = new SolutionDomain();
      const domain2 = SolutionDomain.newWithInitialIntervals(
        [
          new SolutionInterval([ 0, 1 ]),
          new SolutionInterval([ 2, 3 ]),
          new SolutionInterval([ 4, 5 ]),
        ],
      );
      expect(domain1.equal(domain2)).toBe(false);
    });

    it('should return equal when two domains have the same intervals', () => {
      const domain1 = SolutionDomain.newWithInitialIntervals(
        [
          new SolutionInterval([ 0, 1 ]),
          new SolutionInterval([ 2, 3 ]),
          new SolutionInterval([ 4, 5 ]),
        ],
      );
      const domain2 = SolutionDomain.newWithInitialIntervals(
        [
          new SolutionInterval([ 0, 1 ]),
          new SolutionInterval([ 2, 3 ]),
          new SolutionInterval([ 4, 5 ]),
        ],
      );
      expect(domain1.equal(domain2)).toBe(true);
    });

    it('should return not equal when two domains have the different intervals', () => {
      const domain1 = SolutionDomain.newWithInitialIntervals(
        [
          new SolutionInterval([ 0, 1 ]),
          new SolutionInterval([ 2, 3 ]),
          new SolutionInterval([ 4, 5 ]),
        ],
      );
      const domain2 = SolutionDomain.newWithInitialIntervals(
        [
          new SolutionInterval([ 0, 1 ]),
          new SolutionInterval([ 6, 7 ]),
          new SolutionInterval([ 4, 5 ]),
        ],
      );
      expect(domain1.equal(domain2)).toBe(false);
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
        new SolutionInterval([ 100, 3_000 ]),
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
      expect(() => {
        SolutionDomain.newWithInitialIntervals(solutionIntervals);
      }).toThrow(RangeError);
    });
  });

  describe('isDomainEmpty', () => {
    it('should return true when the domain is empty', () => {
      const domain = new SolutionDomain();

      expect(domain.isDomainEmpty()).toBe(true);
    });

    it('should return false when the domain is not empty', () => {
      const domain = SolutionDomain.newWithInitialIntervals(new SolutionInterval([ 0, 1 ]));

      expect(domain.isDomainEmpty()).toBe(false);
    });
  });
});
