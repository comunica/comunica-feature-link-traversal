import { LinkOperator } from '../lib/LinkOperator';
import { LogicOperator } from '../lib/solverInterfaces';

describe('LinkOperator', () => {
  describe('constructor', () => {
    it('when constructing multiple linkOperator the id should be incremented', () => {
      const operators = [ LogicOperator.And, LogicOperator.Not, LogicOperator.Or ];
      for (let i = 0; i < 100; i++) {
        expect((new LinkOperator(operators[i % operators.length])).id).toBe(i);
      }
    });
  });
  describe('toString', () => {
    beforeAll(() => {
      LinkOperator.resetIdCount();
    });
    it('should return a string expressing the operator and the id', () => {
      const operators = [ LogicOperator.And, LogicOperator.Not, LogicOperator.Or ];
      for (let i = 0; i < 100; i++) {
        const operator = operators[i % operators.length];
        expect((new LinkOperator(operator)).toString()).toBe(`${operator}-${i}`);
      }
    });
  });

  describe('resetIdCount', () => {
    beforeAll(() => {
      LinkOperator.resetIdCount();
    });
    it('should reset the count when the function is called', () => {
      const operators = [ LogicOperator.And, LogicOperator.Not, LogicOperator.Or ];
      for (let i = 0; i < 10; i++) {
        expect((new LinkOperator(operators[i % operators.length])).id).toBe(i);
      }
      LinkOperator.resetIdCount();
      expect((new LinkOperator(operators[0])).id).toBe(0);
    });
  });
});
