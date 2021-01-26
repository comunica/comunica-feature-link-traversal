import type { Algebra } from 'sparqlalgebrajs';
import { translate } from 'sparqlalgebrajs';
import type { IVariable } from './ContentPolicy';
import { ContentPolicy } from './ContentPolicy';

/**
 * A simple SCL parser that builds on top of SPARQL.js and SPARQLAlgebraJS.
 *
 * This is not an optimal implementation, and may fail in edge-cases
 * (such as when 'INCLUDE' is used in an IRI or string in the graph pattern).
 */
export class SimpleSclParser {
  protected cursor: number;

  public parse(contentPolicy: string, baseIRI?: string): ContentPolicy {
    this.cursor = 0;

    // Parse FOLLOW and variables
    this.readFollowClause(contentPolicy);
    const variables = this.readVariables(contentPolicy);

    // Check if we have an INCLUDE clause for filtering
    const includePos = contentPolicy.indexOf('INCLUDE', this.cursor);
    let filter: Algebra.Construct | undefined;
    if (includePos >= 0) {
      // Simulate a SPARQL CONSTRUCT query around our include clause for easy parsing
      const constructQuery = `CONSTRUCT WHERE ${contentPolicy.slice(includePos + 7)}`;
      filter = <Algebra.Construct> translate(constructQuery, { quads: true, baseIRI });

      // Chop off the include clause for further processing
      contentPolicy = contentPolicy.slice(0, includePos);
    }

    // Parse FOLLOW graph pattern
    const endPos = contentPolicy.lastIndexOf('}');
    if (endPos < 0) {
      throw new Error(`Missing '}' at the end of the policy`);
    }
    const graphPatternString = contentPolicy.slice(this.cursor, endPos);

    // Simulate a SPARQL SELECT query around our graph pattern for easy parsing.
    const sparqlQuery = `SELECT * WHERE { ${graphPatternString} }`;
    const graphPattern = (<Algebra.Project> translate(sparqlQuery, { quads: true, baseIRI })).input;

    return new ContentPolicy(graphPattern, variables, filter);
  }

  protected readFollowClause(contentPolicy: string): void {
    let follow = false;
    while (this.cursor < contentPolicy.length && !follow) {
      const char = contentPolicy[this.cursor];
      switch (char) {
        case 'F':
          if (contentPolicy.slice(this.cursor, this.cursor + 6) === 'FOLLOW') {
            this.cursor += 6;
            follow = true;
          } else {
            throw new Error(`Content policy must start with 'FOLLOW', but found '${contentPolicy.slice(this.cursor, this.cursor + 6)}'`);
          }
          break;
        case ' ':
        case '\n':
        case '\t':
          this.cursor++;
          break;
        default:
          throw new Error(`Content policy starting with illegal character '${char}', while 'FOLLOW' is expected`);
      }
    }
  }

  protected readVariables(contentPolicy: string): IVariable[] {
    const variables: IVariable[] = [];
    let variableStart = -1;
    let policyClauseStart = -1;
    let breakLoop = false;
    while (this.cursor < contentPolicy.length && !breakLoop) {
      const char = contentPolicy[this.cursor];
      switch (char) {
        case '?':
          // Start of a variable
          if (variableStart >= 0) {
            throw new Error(`Invalid variable clause: a variable can only contain one '?'`);
          }
          variableStart = this.cursor;
          break;
        case '(':
          // Start of a policies clause
          if (policyClauseStart >= 0) {
            throw new Error(`Invalid variable clause: a variable with policies clause can only contain one '('`);
          }
          policyClauseStart = this.cursor;
          break;
        case ' ':
        case '\t':
          // End of a variable
          if (variableStart >= 0) {
            const name = contentPolicy.slice(variableStart + 1, this.cursor);
            if (name.length === 0) {
              throw new Error(`Invalid variable clause: a variable must define a label after '?'`);
            }
            let withPolicies = false;

            // Check if we expect a WITH POLICIES clause
            if (policyClauseStart >= 0) {
              // Wait for the policy clause to end
              if (contentPolicy.slice(this.cursor + 1, this.cursor + 15) !== 'WITH POLICIES)') {
                throw new Error(`Invalid variable clause: expected variables to be in the form of '(?varName WITH POLICIES)'`);
              }
              this.cursor += 14;
              withPolicies = true;
              policyClauseStart = -1;
            }

            // Save the variable
            variables.push({
              name,
              withPolicies,
            });
            variableStart = -1;
          }
          // Otherwise, ignore blank characters
          break;
        case ')':
          // End of a policy clause
          throw new Error(`Invalid variable clause: Unexpected ')'`);
        case '{':
          // Start of the FOLLOW graph pattern, terminate our variables loop
          breakLoop = true;
          break;
        default:
          if (variableStart <= 0 && policyClauseStart <= 0) {
            throw new Error(`Invalid variable clause: Missing '?' or '(' before variable definition`);
          }
      }

      this.cursor++;
    }
    if (variables.length === 0) {
      throw new Error(`Invalid variable clause: No followed variables are defined`);
    }
    return variables;
  }
}
