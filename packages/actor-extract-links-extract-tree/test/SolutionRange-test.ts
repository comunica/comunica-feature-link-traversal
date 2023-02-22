import { SolutionRange } from '../lib//SolutionRange';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('SolutionRange', () => {
  describe('constructor', () => {
    it('should have the right parameters when building', () => {
      const aRange: [number, number] = [ 0, 1 ];
      const solutionRange = new SolutionRange(aRange);

      expect(solutionRange.lower).toBe(aRange[0]);
      expect(solutionRange.upper).toBe(aRange[1]);
    });

    it('should not throw an error when the domain is unitary', () => {
      const aRange: [number, number] = [ 0, 0 ];
      const solutionRange = new SolutionRange(aRange);

      expect(solutionRange.lower).toBe(aRange[0]);
      expect(solutionRange.upper).toBe(aRange[1]);
    });

    it('should have throw an error when the first element of the range is greater than the second', () => {
      const aRange: [number, number] = [ 1, 0 ];
      expect(() => { new SolutionRange(aRange); }).toThrow(RangeError);
    });
  });

  describe('isOverlaping', () => {
    it('should return true when the solution range have the same range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 0, 100 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(true);
    });

    it('should return true when the other range start before the subject range and end inside the subject range',
      () => {
        const aRange: [number, number] = [ 0, 100 ];
        const aSolutionRange = new SolutionRange(aRange);

        const aSecondRange: [number, number] = [ -1, 99 ];
        const aSecondSolutionRange = new SolutionRange(aSecondRange);

        expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(true);
      });

    it('should return true when the other range start before the subject range and end after the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ -1, 101 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(true);
    });

    it('should return true when the other range start at the subject range and end after the range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 0, 101 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(true);
    });

    it('should return true when the other range start inside the current range and end inside the current range',
      () => {
        const aRange: [number, number] = [ 0, 100 ];
        const aSolutionRange = new SolutionRange(aRange);

        const aSecondRange: [number, number] = [ 1, 50 ];
        const aSecondSolutionRange = new SolutionRange(aSecondRange);

        expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(true);
      });

    it('should return true when the other range start at the end of the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 100, 500 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(true);
    });

    it('should return false when the other range is located before the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ -50, -20 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(false);
    });

    it('should return false when the other range is located after the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 101, 200 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isOverlapping(aSecondSolutionRange)).toBe(false);
    });
  });
  describe('isInside', () => {
    it('should return true when the other range is inside the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 1, 50 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isInside(aSecondSolutionRange)).toBe(true);
    });

    it('should return false when the other range is not inside the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ -1, 50 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      expect(aSolutionRange.isInside(aSecondSolutionRange)).toBe(false);
    });
  });

  describe('fuseRange', () => {
    it('given an non overlapping range return both range should return the correct range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 101, 200 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

      expect(resp.length).toBe(2);
      expect(resp[0]).toStrictEqual(aSolutionRange);
      expect(resp[1]).toStrictEqual(aSecondSolutionRange);
    });

    it('given an overlapping range where the solution range have the same range should return the correct range',
      () => {
        const aRange: [number, number] = [ 0, 100 ];
        const aSolutionRange = new SolutionRange(aRange);

        const aSecondRange: [number, number] = [ 0, 100 ];
        const aSecondSolutionRange = new SolutionRange(aSecondRange);

        const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

        expect(resp.length).toBe(1);
        expect(resp[0]).toStrictEqual(aSolutionRange);
        expect(resp[0]).toStrictEqual(aSecondSolutionRange);
      });

    it(`given an overlapping range where the other range start before the subject range and end 
    inside the subject range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ -1, 99 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

      const expectedRange = new SolutionRange([ -1, 100 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });

    it(`given an overlapping range where the other range start before the subject range 
    and end after the subject range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ -1, 101 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

      const expectedRange = new SolutionRange([ -1, 101 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });

    it(`given an overlapping range where the other range start at the subject range and
    end after the range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 0, 101 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

      const expectedRange = new SolutionRange([ 0, 101 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });

    it(`given an overlapping range where the other range start inside the current range and
     end inside the current range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 1, 50 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

      const expectedRange = new SolutionRange([ 0, 100 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });

    it(`given an overlapping range where the other range start at the end
     of the subject range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionRange = new SolutionRange(aRange);

      const aSecondRange: [number, number] = [ 100, 500 ];
      const aSecondSolutionRange = new SolutionRange(aSecondRange);

      const resp = SolutionRange.fuseRange(aSolutionRange, aSecondSolutionRange);

      const expectedRange = new SolutionRange([ 0, 500 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });
  });

  describe('inverse', () => {
    it('given an real solution range it should return no range', () => {
      const aSolutionRange = new SolutionRange([
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      ]);

      expect(aSolutionRange.inverse().length).toBe(0);
    });

    it('given a range with an infinite upper bound should return a new range', () => {
      const aSolutionRange = new SolutionRange([
        21,
        Number.POSITIVE_INFINITY,
      ]);

      const expectedRange = new SolutionRange([ Number.NEGATIVE_INFINITY, nextDown(21) ]);

      const resp = aSolutionRange.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });

    it('given a range with an infinite lower bound should return a new range', () => {
      const aSolutionRange = new SolutionRange([
        Number.NEGATIVE_INFINITY,
        -21,
      ]);

      const expectedRange = new SolutionRange([ nextUp(-21), Number.POSITIVE_INFINITY ]);

      const resp = aSolutionRange.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedRange);
    });

    it('given a range that is not unitary and doesn\t have infinite bound should return 2 ranges', () => {
      const aSolutionRange = new SolutionRange([
        -33,
        21,
      ]);

      const expectedRange = [
        new SolutionRange([ Number.NEGATIVE_INFINITY, nextDown(-33) ]),
        new SolutionRange([ nextUp(21), Number.POSITIVE_INFINITY ]),
      ];

      const resp = aSolutionRange.inverse();

      expect(resp.length).toBe(2);
      expect(resp).toStrictEqual(expectedRange);
    });
  });

  describe('getIntersection', () => {
    it('given two range that doesn\'t overlap should return no intersection', () => {
      const aSolutionRange = new SolutionRange([ 0, 20 ]);
      const aSecondSolutionRange = new SolutionRange([ 30, 40 ]);

      expect(SolutionRange.getIntersection(aSolutionRange, aSecondSolutionRange)).toBeUndefined();
    });

    it('given two range when one is inside the other should return the range at the inside', () => {
      const aSolutionRange = new SolutionRange([ 0, 20 ]);
      const aSecondSolutionRange = new SolutionRange([ 5, 10 ]);

      expect(SolutionRange.getIntersection(aSolutionRange, aSecondSolutionRange)).toStrictEqual(aSecondSolutionRange);
    });

    it('given two range when they overlap should return the intersection', () => {
      const aSolutionRange = new SolutionRange([ 0, 20 ]);
      const aSecondSolutionRange = new SolutionRange([ 5, 80 ]);

      const expectedIntersection = new SolutionRange([ 5, 20 ]);

      expect(SolutionRange.getIntersection(aSolutionRange, aSecondSolutionRange)).toStrictEqual(expectedIntersection);
    });
  });
});
