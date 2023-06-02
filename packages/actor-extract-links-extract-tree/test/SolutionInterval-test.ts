import { SolutionInterval } from '../lib//SolutionInterval';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('Solutioninterval', () => {
  describe('constructor', () => {
    it('should have the right parameters when building', () => {
      const ainterval: [number, number] = [ 0, 1 ];
      const solutioninterval = new SolutionInterval(ainterval);

      expect(solutioninterval.lower).toBe(ainterval[0]);
      expect(solutioninterval.upper).toBe(ainterval[1]);
      expect(solutioninterval.isEmpty).toBe(false);
    });

    it('should not throw an error when the domain is unitary', () => {
      const ainterval: [number, number] = [ 0, 0 ];
      const solutioninterval = new SolutionInterval(ainterval);

      expect(solutioninterval.lower).toBe(ainterval[0]);
      expect(solutioninterval.upper).toBe(ainterval[1]);
      expect(solutioninterval.isEmpty).toBe(false);
    });

    it('should throw an error when the first element of the interval is greater than the second', () => {
      const ainterval: [number, number] = [ 1, 0 ];
      expect(() => { new SolutionInterval(ainterval); }).toThrow(RangeError);
    });
  });

  describe('isOverlaping', () => {
    it('should return true when the solution interval has the same interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 0, 100 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it(`should return true when the other interval starts before the subject interval and 
    the end is inside the subject interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ -1, 99 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it(`should return true when the other interval starts before the subject interval and
     end after the subject interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ -1, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return true when the other interval starts on the subject interval and end after the interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 0, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it(`should return true when the other interval starts inside the current interval and
     end inside the current interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return true when the other interval starts at the end of the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 100, 500 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(true);
    });

    it('should return false when the other interval is located before the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ -50, -20 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other interval is located after the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the subject interval is empty', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondinterval: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other interval is empty and the subject interval is not', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other interval and the subject interval are empty', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isOverlapping(aSecondSolutionInterval)).toBe(false);
    });
  });

  describe('isInside', () => {
    it('should return true when the other interval is inside the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(true);
    });

    it('should return false when the other interval is not inside the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ -1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the other interval is empty and not the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the subject interval is empty and not the other interval', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondinterval: [number, number] = [ -1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });

    it('should return false when the subject interval and the other interval are empty', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondSolutionInterval = new SolutionInterval([]);

      expect(aSolutionInterval.isInside(aSecondSolutionInterval)).toBe(false);
    });
  });

  describe('fuseinterval', () => {
    it('given an non overlapping interval should return both input intervals', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(2);
      expect(resp[0]).toStrictEqual(aSolutionInterval);
      expect(resp[1]).toStrictEqual(aSecondSolutionInterval);
    });

    it('given an overlapping interval where the solution interval have the same interval should return that interval',
      () => {
        const ainterval: [number, number] = [ 0, 100 ];
        const aSolutionInterval = new SolutionInterval(ainterval);

        const aSecondinterval: [number, number] = [ 0, 100 ];
        const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

        const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

        expect(resp.length).toBe(1);
        expect(resp[0]).toStrictEqual(aSolutionInterval);
        expect(resp[0]).toStrictEqual(aSecondSolutionInterval);
      });

    it(`given an overlapping interval where the other interval starts before the subject interval and ends 
    inside the subject interval should return the correct interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ -1, 99 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ -1, 100 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping interval where the other interval starts before the subject interval 
    and ends after the subject interval should return the correct interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ -1, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ -1, 101 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping interval where the other interval starts on the subject interval and
    ends after the interval should return the correct interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 0, 101 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ 0, 101 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping interval where the other interval starts inside the current interval and
     ends inside the current interval should return the correct interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 1, 50 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ 0, 100 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it(`given an overlapping interval where the other interval starts at the end
     of the subject interval should return the correct interval`, () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondinterval: [number, number] = [ 100, 500 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      const expectedInterval = new SolutionInterval([ 0, 500 ]);
      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it('given two empty intervals should return an empty interval', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondSolutionInterval = new SolutionInterval([]);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(new SolutionInterval([]));
    });

    it('given an empty subject interval and a non-empty other interval should return the second interval', () => {
      const aSolutionInterval = new SolutionInterval([]);

      const aSecondinterval: [number, number] = [ 101, 200 ];
      const aSecondSolutionInterval = new SolutionInterval(aSecondinterval);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(aSecondSolutionInterval);
    });

    it('given an empty other interval and a non-empty subject interval should returns the subject interval', () => {
      const ainterval: [number, number] = [ 0, 100 ];
      const aSolutionInterval = new SolutionInterval(ainterval);

      const aSecondSolutionInterval = new SolutionInterval([]);

      const resp = SolutionInterval.fuseinterval(aSolutionInterval, aSecondSolutionInterval);

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(aSolutionInterval);
    });
  });

  describe('inverse', () => {
    it('given an infinite solution interval it should return an empty interval', () => {
      const aSolutionInterval = new SolutionInterval([
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      ]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(new SolutionInterval([]));
    });

    it('given an interval with an infinite upper-bound should return a new interval', () => {
      const aSolutionInterval = new SolutionInterval([
        21,
        Number.POSITIVE_INFINITY,
      ]);

      const expectedInterval = new SolutionInterval([ Number.NEGATIVE_INFINITY, nextDown(21) ]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it('given an interval with an infinite lower-bound should return a new interval', () => {
      const aSolutionInterval = new SolutionInterval([
        Number.NEGATIVE_INFINITY,
        -21,
      ]);

      const expectedInterval = new SolutionInterval([ nextUp(-21), Number.POSITIVE_INFINITY ]);

      const resp = aSolutionInterval.inverse();

      expect(resp.length).toBe(1);
      expect(resp[0]).toStrictEqual(expectedInterval);
    });

    it('given an interval that is not unitary and doesn\t have infinite bound should return 2 intervals', () => {
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

    it('given an empty solution interval should return an infinite interval', () => {
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
    it('given two interval that doesn\'t overlap should return no intersection', () => {
      const aSolutionInterval = new SolutionInterval([ 0, 20 ]);
      const aSecondSolutionInterval = new SolutionInterval([ 30, 40 ]);

      const nonOverlappingInterval = SolutionInterval.getIntersection(aSolutionInterval, aSecondSolutionInterval);

      expect(nonOverlappingInterval.isEmpty).toBe(true);
      expect(nonOverlappingInterval.lower).toBe(Number.NaN);
      expect(nonOverlappingInterval.upper).toBe(Number.NaN);
    });

    it('given two interval where one is inside the other should return the interval at the inside', () => {
      const aSolutionInterval = new SolutionInterval([ 0, 20 ]);
      const aSecondSolutionInterval = new SolutionInterval([ 5, 10 ]);

      expect(SolutionInterval.getIntersection(aSolutionInterval, aSecondSolutionInterval))
        .toStrictEqual(aSecondSolutionInterval);
    });

    it('given two intervals overlapping should return the intersection', () => {
      const aSolutionInterval = new SolutionInterval([ 0, 20 ]);
      const aSecondSolutionInterval = new SolutionInterval([ 5, 80 ]);

      const expectedIntersection = new SolutionInterval([ 5, 20 ]);

      expect(SolutionInterval.getIntersection(aSolutionInterval, aSecondSolutionInterval))
        .toStrictEqual(expectedIntersection);
    });
  });
});
