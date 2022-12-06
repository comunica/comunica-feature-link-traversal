import { RelationOperator } from '@comunica/types-link-traversal';
import { SolutionRange } from './SolutionRange';
/**
 * Valid SPARQL data type for operation.
 */
export enum SparqlOperandDataTypes {
    Integer = 'http://www.w3.org/2001/XMLSchema#integer',
    Decimal = 'http://www.w3.org/2001/XMLSchema#decimal',
    Float = 'http://www.w3.org/2001/XMLSchema#float',
    Double = 'http://www.w3.org/2001/XMLSchema#double',
    String = 'http://www.w3.org/2001/XMLSchema#string',
    Boolean = 'http://www.w3.org/2001/XMLSchema#boolean',
    DateTime = 'http://www.w3.org/2001/XMLSchema#dateTime',

    NonPositiveInteger = 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
    NegativeInteger = 'http://www.w3.org/2001/XMLSchema#negativeInteger',
    Long = 'http://www.w3.org/2001/XMLSchema#long',
    Int = 'http://www.w3.org/2001/XMLSchema#int',
    Short = 'http://www.w3.org/2001/XMLSchema#short',
    Byte = 'http://www.w3.org/2001/XMLSchema#byte',
    NonNegativeInteger = 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
    UnsignedLong = 'http://www.w3.org/2001/XMLSchema#nunsignedLong',
    UnsignedInt = 'http://www.w3.org/2001/XMLSchema#unsignedInt',
    UnsignedShort = 'http://www.w3.org/2001/XMLSchema#unsignedShort',
    UnsignedByte = 'http://www.w3.org/2001/XMLSchema#unsignedByte',
    PositiveInteger = 'http://www.w3.org/2001/XMLSchema#positiveInteger'
}

export enum LogicOperator {
    And = '&&',
    Or = '||',
    Not = '!',
};

export const LogicOperatorReversed: Map<string, LogicOperator> =
    new Map(Object.values(LogicOperator).map(value => [value, value]));

export class LinkOperator {
    private readonly operator: LogicOperator;
    private readonly id: number;
    private static count: number = 0;

    constructor(operator: LogicOperator) {
        this.operator = operator;
        this.id = LinkOperator.count;
        LinkOperator.count++;
    }

    public toString(): string {
        return `${this.operator}-${this.id}`
    }
}

export interface SolverEquation {
    chainOperator: LinkOperator[];
    solutionDomain: SolutionRange;
}

export type SolverEquationSystem = Map<LastLogicalOperator, SolverEquation[]>;

export type LastLogicalOperator = string;
export type Variable = string;

export interface SolverExpression {
    variable: Variable;

    rawValue: string;
    valueType: SparqlOperandDataTypes;
    valueAsNumber: number;

    operator: RelationOperator;
    chainOperator: LinkOperator[];
};





