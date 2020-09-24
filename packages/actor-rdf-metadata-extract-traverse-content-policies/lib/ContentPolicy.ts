import { Algebra } from 'sparqlalgebrajs';

/**
 * A content policies represents a function from graph pattern to matching variables.
 * The matching variables can then be used to indicate which URLs should be followed.
 *
 * Additionally, an optional filter can be defined to indicate what triples
 * inside the documents of the followed URLs should be considered.
 */
export class ContentPolicy {
  public readonly graphPattern: Algebra.Operation;
  public readonly variables: IVariable[];
  public readonly filter?: Algebra.Operation;

  public constructor(graphPattern: Algebra.Operation, variables: IVariable[], filter?: Algebra.Operation) {
    this.graphPattern = graphPattern;
    this.variables = variables;
    this.filter = filter;
  }
}

export interface IVariable {
  /**
   * A variable name, without '?'.
   */
  name: string;
  /**
   * A boolean indicating if the content policies that are defined
   * in the range of followed documents should be considered.
   */
  withPolicies: boolean;
}
