export class MissMatchVariableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MissMatchVariableError";
    }
}

export class MisformatedFilterTermError extends Error{
    constructor(message: string) {
        super(message);
        this.name = "MisformatedFilterTermError";
    }
}

export class UnsupportedDataTypeError extends Error{
    constructor(message: string) {
        super(message);
        this.name = "UnsupportedDataTypeError";
    }
}

export class UnsupportedOperatorError extends Error{
    constructor(message: string) {
        super(message);
        this.name = "UnsupportedOperatorError";
    }
}