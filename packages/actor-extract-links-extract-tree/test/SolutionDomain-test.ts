import { SolutionInterval } from '../lib//SolutionInterval';
import { SolutionDomain } from '../lib/SolutionDomain';

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
