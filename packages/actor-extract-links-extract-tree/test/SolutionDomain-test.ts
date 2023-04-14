import { SolutionInterval } from '../lib//SolutionInterval';
import { SolutionDomain } from '../lib/SolutionDomain';
import { LogicOperator } from '../lib/solverInterfaces';

const nextUp = require('ulp').nextUp;
const nextDown = require('ulp').nextDown;

describe('SolutionDomain', () => {
  describe('constructor', () => {
    it('should return an empty solution domain', () => {
      const solutionDomain = new SolutionDomain();

      expect(solutionDomain.get_domain().length).toBe(0);
    });
  });

  describe('newWithInitialValue', () => {
    it('should create a solution domain with the initial value', () => {
      const solutionRange = new SolutionInterval([ 0, 1 ]);
      const solutionDomain = SolutionDomain.newWithInitialValue(solutionRange);

      expect(solutionDomain.get_domain().length).toBe(1);
      expect(solutionDomain.get_domain()[0]).toStrictEqual(solutionRange);
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
    it('given an empty domain should be able to add the subject range', () => {
      const range = new SolutionInterval([ 0, 1 ]);
      const solutionDomain = new SolutionDomain();

      const newDomain = solutionDomain.addWithOrOperator(range);

      expect(newDomain.get_domain().length).toBe(1);
      expect(newDomain.get_domain()[0]).toStrictEqual(range);
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
        expect(solutionDomain.get_domain().length).toBe(idx + 1);
      });

      const expectedDomain = [
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 1, 2 ]),
        new SolutionInterval([ 10, 10 ]),
        new SolutionInterval([ 60, 70 ]),
      ];

      expect(solutionDomain.get_domain()).toStrictEqual(expectedDomain);
    });

    it('given a domain should not add a range that is inside another', () => {
      const anOverlappingRange = new SolutionInterval([ 22, 23 ]);
      const newDomain = aDomain.addWithOrOperator(anOverlappingRange);

      expect(newDomain.get_domain().length).toBe(aDomain.get_domain().length);
      expect(newDomain.get_domain()).toStrictEqual(aRanges);
    });

    it('given a domain should create a single domain if all the domain segment are contain into the new range', () => {
      const anOverlappingRange = new SolutionInterval([ -100, 100 ]);
      const newDomain = aDomain.addWithOrOperator(anOverlappingRange);

      expect(newDomain.get_domain().length).toBe(1);
      expect(newDomain.get_domain()).toStrictEqual([ anOverlappingRange ]);
    });

    it('given a domain should fuse multiple domain segment if the new range overlap with them', () => {
      const aNewRange = new SolutionInterval([ 1, 23 ]);
      const newDomain = aDomain.addWithOrOperator(aNewRange);

      const expectedResultingDomainRange = [
        new SolutionInterval([ -1, 0 ]),
        new SolutionInterval([ 1, 33 ]),
        new SolutionInterval([ 60, 70 ]),
      ];

      expect(newDomain.get_domain().length).toBe(3);
      expect(newDomain.get_domain()).toStrictEqual(expectedResultingDomainRange);
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

      expect(newDomain.get_domain().length).toBe(2);
      expect(newDomain.get_domain()).toStrictEqual(expectedDomain);
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

      expect(domain.get_domain()).toStrictEqual(expectedDomain);
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

      expect(newDomain.get_domain()).toStrictEqual([ aRange ]);
    });

    it('should return an empty domain if there is no intersection with the new range', () => {
      const aRange = new SolutionInterval([ -200, -100 ]);

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.get_domain().length).toBe(0);
    });

    it('given a new range that is inside a part of the domain should only return the intersection', () => {
      const aRange = new SolutionInterval([ 22, 30 ]);

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.get_domain()).toStrictEqual([ aRange ]);
    });

    it('given a new range that intersect a part of the domain should only return the intersection', () => {
      const aRange = new SolutionInterval([ 19, 25 ]);

      const expectedDomain = [
        new SolutionInterval([ 21, 25 ]),
      ];

      const newDomain = aDomain.addWithAndOperator(aRange);

      expect(newDomain.get_domain()).toStrictEqual(expectedDomain);
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

      expect(newDomain.get_domain()).toStrictEqual(expectedDomain);
    });

    it('given an empty domain and a last operator and should return an empty domain', () => {
      const aRange = new SolutionInterval([ -2, 25 ]);
      const anotherRangeNonOverlapping = new SolutionInterval([ 2_000, 3_000 ]);

      let newDomain = aDomain.addWithAndOperator(aRange);
      newDomain = newDomain.add({ range: anotherRangeNonOverlapping, operator: LogicOperator.And });
      expect(newDomain.isDomainEmpty()).toBe(true);

      newDomain = newDomain.addWithAndOperator(aRange);

      expect(newDomain.isDomainEmpty()).toBe(true);
    });
  });

  describe('add', () => {
    const aDomain = new SolutionDomain();
    const aRange = new SolutionInterval([ 0, 1 ]);

    let spyAddWithOrOperator;

    let spyAddWithAndOperator;

    let spyNotOperation;

    beforeEach(() => {
      spyAddWithOrOperator = jest.spyOn(aDomain, 'addWithOrOperator')
        .mockImplementation((_range: SolutionInterval) => {
          return new SolutionDomain();
        });

      spyAddWithAndOperator = jest.spyOn(aDomain, 'addWithAndOperator')
        .mockImplementation((_range: SolutionInterval) => {
          return new SolutionDomain();
        });

      spyNotOperation = jest.spyOn(aDomain, 'notOperation')
        .mockImplementation(() => {
          return new SolutionDomain();
        });
    });

    it('should call "addWithOrOperator" method given the "OR" operator and a new range', () => {
      aDomain.add({ range: aRange, operator: LogicOperator.Or });
      expect(spyAddWithOrOperator).toBeCalledTimes(1);
    });

    it('should throw an error when adding range with a "OR" operator and no new range', () => {
      expect(() => { aDomain.add({ operator: LogicOperator.Or }); }).toThrow();
    });

    it('should call "addWithAndOperator" method given the "AND" operator and a new range', () => {
      aDomain.add({ range: aRange, operator: LogicOperator.And });
      expect(spyAddWithOrOperator).toBeCalledTimes(1);
    });

    it('should throw an error when adding range with a "AND" operator and no new range', () => {
      expect(() => { aDomain.add({ operator: LogicOperator.And }); }).toThrow();
    });

    it('should call "notOperation" method given the "NOT" operator', () => {
      aDomain.add({ operator: LogicOperator.Not });
      expect(spyAddWithOrOperator).toBeCalledTimes(1);
    });

    it('should on any operator return an empty domain if the only solution range is empty', () => {
      const an_empty_solution_range = new SolutionInterval([]);
      const operations: [LogicOperator, SolutionInterval][] = [
        [ LogicOperator.Or, an_empty_solution_range ],
        [ LogicOperator.And, an_empty_solution_range ],
        [ LogicOperator.Not, an_empty_solution_range.inverse()[0] ],
      ];

      for (const [ logicOperator, solutionRange ] of operations) {
        if (logicOperator !== LogicOperator.Not) {
          let domain = new SolutionDomain();
          domain = domain.add({ range: solutionRange, operator: logicOperator });
          expect(domain.get_domain().length).toBe(0);
        } else {
          let domain = new SolutionDomain();
          domain = domain.addWithOrOperator(solutionRange);
          domain = domain.add({ operator: logicOperator });
          expect(domain.get_domain().length).toBe(0);
        }
      }
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
      expect(clonedDomain.get_domain()).not.toStrictEqual(domain.get_domain());
    });
  });
});
