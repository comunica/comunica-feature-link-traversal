export class MissMatchVariableError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MissMatchVariableError';
  }
}

export class MisformatedFilterTermError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MisformatedFilterTermError';
  }
}

export class UnsupportedDataTypeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'UnsupportedDataTypeError';
  }
}
