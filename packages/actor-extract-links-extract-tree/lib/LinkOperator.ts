import { v4 as uuidv4 } from 'uuid';
import type { LogicOperator } from './solverInterfaces';
/**
 * A class representing a LogicOperation with an unique ID.
 */
export class LinkOperator {
  /**
     * The logic operator
     */
  public readonly operator: LogicOperator;
  /**
     * The unique ID
     */
  public readonly id: string;

  /**
     * Build a new LinkOperator with an unique ID.
     * @param operator
     */
  public constructor(operator: LogicOperator) {
    this.operator = operator;
    this.id = uuidv4();
  }

  /**
     * @returns {string} string representation of this LogicOperator.
     */
  public toString(): string {
    return `${this.operator}-${this.id}`;
  }
}
