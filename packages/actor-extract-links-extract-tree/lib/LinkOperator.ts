import { LogicOperator } from './solverInterfaces';

export class LinkOperator {
    private readonly operator: LogicOperator;
    public readonly id: number;
    private static count: number = 0;

    constructor(operator: LogicOperator) {
        this.operator = operator;
        this.id = LinkOperator.count;
        LinkOperator.count++;
    }

    public toString(): string {
        return `${this.operator}-${this.id}`
    }

    public static resetIdCount(){
        LinkOperator.count = 0;
    }
}