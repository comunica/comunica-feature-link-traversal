import { LinkOperator } from '../lib/LinkOperator';
import { LogicOperator } from '../lib/solverInterfaces';

describe('LinkOperator', () => {
  describe('constructor', () => {
    it('when constructing multiple linkOperator the id should be different', () => {
      const operators = [ LogicOperator.And, LogicOperator.Not, LogicOperator.Or ];
      const existingId = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const operator = new LinkOperator(operators[i % operators.length]);
        expect(existingId.has(operator.id)).toBe(false);
        existingId.add(operator.id);
      }
    });
  });
  describe('toString', () => {
    it('should return a string expressing the operator and the id', () => {
      const operators = [ LogicOperator.And, LogicOperator.Not, LogicOperator.Or ];
      for (let i = 0; i < 100; i++) {
        const operator = new LinkOperator(operators[i % operators.length]);
        expect(operator.toString()).toBe(`${operator.operator}-${operator.id}`);
      }
    });
  });
});
