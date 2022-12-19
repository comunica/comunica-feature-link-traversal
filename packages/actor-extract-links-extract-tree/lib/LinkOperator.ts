import { LogicOperator } from './solverInterfaces';

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
    public readonly id: number;
    /**
     * The next unique ID to provide to a new instance of LinkOperator
     */
    private static count: number = 0;

    /**
     * Build a new LinkOperator with an unique ID.
     * @param operator 
     */
    constructor(operator: LogicOperator) {
        this.operator = operator;
        this.id = LinkOperator.count;
        LinkOperator.count++;
    }
    /**
     * @returns {string} string representation of this LogicOperator.
     */
    public toString(): string {
        return `${this.operator}-${this.id}`
    }
    /**
     * Reset the count of the unique ID.
     */
    public static resetIdCount(){
        LinkOperator.count = 0;
    }
}