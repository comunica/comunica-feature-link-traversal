import { SolutionInterval } from '../lib//SolutionInterval';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('SolutionRange', () => {
  describe('constructor', () => {
    it('should have the right parameters when building', () => {
      const aRange: [number, number] = [ 0, 1 ];
      const solutionRange = new SolutionInterval(aRange);

      expect(solutionRange.lower).toBe(aRange[0]);
      expect(solutionRange.upper).toBe(aRange[1]);
    });

    it('should not throw an error when the domain is unitary', () => {
      const aRange: [number, number] = [ 0, 0 ];
      const solutionRange = new SolutionInterval(aRange);

      expect(solutionRange.lower).toBe(aRange[0]);
      expect(solutionRange.upper).toBe(aRange[1]);
    });

    it('should have throw an error when the first element of the range is greater than the second', () => {
      const aRange: [number, number] = [ 1, 0 ];
      expect(() => { new SolutionInterval(aRange); }).toThrow(RangeError);
    });
  });

  describe('isOverlaping', () => {
    it('should return true when the solution range have the same range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 0, 100 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return true when the other range start before the subject range and end inside the subject range',
      () => {
        const aRange: [number, number] = [ 0, 100 ];
        const aSolutionInterval = new SolutionInterval(aRange);

        const aSecondRange: [number, number] = [ -1, 99 ];
        const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

        expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
      });

    it('should return true when the other range start before the subject range and end after the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ -1, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return true when the other range start at the subject range and end after the range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 0, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return true when the other range start inside the current range and end inside the current range',
      () => {
        const aRange: [number, number] = [ 0, 100 ];
        const aSolutionInterval = new SolutionInterval(aRange);

        const aSecondRange: [number, number] = [ 1, 50 ];
        const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

        expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
      });

    it('should return true when the other range start at the end of the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 100, 500 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return false when the other range is located before the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ -50, -20 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other range is located after the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the subject range is empty', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondRange: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other range is empty and the subject range is not', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other range and the subject range are empty', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });
  });
  describe('isInside', () => {
    it('should return true when the other range is inside the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(true);
    });

    it('should return false when the other range is not inside the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ -1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other range is empty and not the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the subject range is empty and not the other range', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondRange: [number, number] = [ -1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the subject range and the other range are empty', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });
  });

  describe('fuseRange', () => {
    it('given an non overlapping range return both range should return the correct range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(2);
      expect(resp[0]).toStrictEqual(aSolutionInterval);
      expect(resp[1]).toStrictEqual(aSecondSolutionInterval);
    });

    it('given an overlapping range where the solution range have the same range should return the correct range',
      () => {
        const aRange: [number, number] = [ 0, 100 ];
        const aSolutionInterval = new SolutionInterval(aRange);

        const aSecondRange: [number, number] = [ 0, 100 ];
        const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

        const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

        expect(resp.length).toBe(1);
        expect(resp[0]).toStrictEqual(aSolutionInterval);
        expect(resp[0]).toStrictEqual(aSecondSolutionInterval);
      });

    it(`given an overlapping range where the other range start before the subject range and end 
    inside the subject range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ -1, 99 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ -1, 100 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping range where the other range start before the subject range 
    and end after the subject range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ -1, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ -1, 101 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping range where the other range start at the subject range and
    end after the range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 0, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ 0, 101 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping range where the other range start inside the current range and
     end inside the current range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ 0, 100 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping range where the other range start at the end
     of the subject range should return the correct range`, () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondRange: [number, number] = [ 100, 500 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ 0, 500 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it('given two empty ranges should return an empty range', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondSolutionInterval = new SolutionInterval([]);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(new SolutionInterval([]));
    });

    it('given an empty subject range and an non empty other range should return the second range', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondRange: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondRange);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(aSecondSolutionInterval);
    });

    it('given an empty other range and an non empty subject range should return the subject range', () => {
      const aRange: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(aRange);

      const aSecondSolutionInterval = new SolutionInterval([]);

      const resp = SolutionInterval.fuseRange(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(aSolutionInterval);
    });
  });

  describe('inverse', () => {
    it('given an infinite solution range it should return an empty range', () => {
      const aSolutionInterval = new SolutionInterval([
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      ]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(new SolutionInterval([]));
    });

    it('given a range with an infinite upper bound should return a new range', () => {
      const aSolutionInterval = new SolutionInterval([
        21,
        Number.POSITIVE_INFINITY,
      ]);

      const expectedInterval = new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(21) ]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it('given a range with an infinite lower bound should return a new range', () => {
      const aSolutionInterval = new SolutionInterval([
        Number.NEGATIVE_INFINITY,
        -21,
      ]);

      const expectedInterval = new SolutionInterval([ nextUp(-21), Number.POSITIVE_INFINITY ]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it('given a range that is not unitary and doesn\t have infinite bound should return 2 ranges', () => {
      const aSolutionInterval = new SolutionInterval([
        -33,
        21,
      ]);

      const expectedInterval = [
        new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(-33) ]),
        new SolutionInterval([ nextUp(21), Number.POSITIVE_INFINITY ]),
      ];

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(2);
      expect(resp).toStrictEqual(expectedInterval);
    });

    it('given an empty solution range it should return an infinite range', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(new SolutionInterval([
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      ]));
    });
  });

  describe('getIntersection', () => {
    it('given two range that doesn\'t overlap should return no intersection', () => {
      const aSolutionInterval = new SolutionInterval([ 0, 20 ]);
      const aSecondSolutionInterval = new SolutionInterval([ 30, 40 ]);

      expect(SolutionInterval.getIntersection(aSolutionInterval, aSecondSolutionInterval)).toBeUndefined();
    });

    it('given two range when one is inside the other should return the range at the inside', () => {
      const aSolutionInterval = new SolutionInterval([ 0, 20 ]);
      const aSecondSolutionInterval = new SolutionInterval([ 5, 10 ]);

      expect(SolutionInterval.getIntersection(aSolutionInterval, aSecondSolutionInterval))
        .toStrictEqual(aSecondSolutionInterval);
    });

    it('given two range when they overlap should return the intersection', () => {
      const aSolutionInterval = new SolutionInterval([ 0, 20 ]);
      const aSecondSolutionInterval = new SolutionInterval([ 5, 80 ]);

      const expectedIntersection = new SolutionInterval([ 5, 20 ]);

      expect(SolutionInterval.getIntersection(aSolutionInterval, aSecondSolutionInterval))
        .toStrictEqual(expectedIntersection);
    });
  });
});
