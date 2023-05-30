export class MissMatchVariableError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MissMatchVariableError';
  }
}

export class MisformatedExpressionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MisformatedExpressionError';
  }
}

export class UnsupportedDataTypeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'UnsupportedDataTypeError';
  }
}
