import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysInitQuery } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type * as RDF from 'rdf-js';
import type { QuadTermName } from 'rdf-terms';
import { filterQuadTermNames, getNamedNodes, getTerms, matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import { Util as AlgebraUtil } from 'sparqlalgebrajs';

/**
 * A comunica Traverse Quad Pattern Query RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseQuadPatternQuery extends ActorRdfMetadataExtract {
  private readonly onlyVariables: boolean;

  public constructor(args: IActorRdfMetadataExtractTraverseQuadPatternQueryArgs) {
    super(args);
  }

  public static getCurrentQuery(context: IActionContext): Algebra.Operation | undefined {
    const currentQueryOperation: Algebra.Operation | undefined = context.get(KeysInitQuery.query);
    if (!currentQueryOperation) {
      return;
    }
    return currentQueryOperation;
  }

  public static matchQuadPatternInOperation(quad: RDF.Quad, operation: Algebra.Operation): Algebra.Pattern[] {
    const matchingPatterns: Algebra.Pattern[] = [];
    AlgebraUtil.recurseOperation(operation, {
      pattern(pattern: Algebra.Pattern) {
        if (matchPatternComplete(quad, pattern)) {
          matchingPatterns.push(pattern);
        }
        return false;
      },
    });
    return matchingPatterns;
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    if (!ActorRdfMetadataExtractTraverseQuadPatternQuery.getCurrentQuery(action.context)) {
      throw new Error(`Actor ${this.name} can only work in the context of a query.`);
    }
    return true;
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const operation: Algebra.Operation = ActorRdfMetadataExtractTraverseQuadPatternQuery
      .getCurrentQuery(action.context)!;
    return new Promise((resolve, reject) => {
      const traverse: ILink[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Immediately resolve when a value has been found.
      action.metadata.on('data', quad => {
        const matchingPatterns = ActorRdfMetadataExtractTraverseQuadPatternQuery
          .matchQuadPatternInOperation(quad, operation);
        if (matchingPatterns.length > 0) {
          if (this.onlyVariables) {
            // --- If we only want to follow links matching with a variable component ---

            // Determine quad term names that we should check
            const quadTermNames: Partial<Record<QuadTermName, boolean>> = {};
            for (const quadPattern of matchingPatterns) {
              for (const quadTermName of filterQuadTermNames(quadPattern, value => value.termType === 'Variable')) {
                quadTermNames[quadTermName] = true;
              }
            }

            // For the discovered quad term names, check extract the named nodes in the quad
            for (const quadTermName of Object.keys(quadTermNames)) {
              if (quad[quadTermName].termType === 'NamedNode') {
                traverse.push({ url: quad[quadTermName].value });
              }
            }
          } else {
            // --- If we want to follow links, irrespective of matching with a variable component ---
            for (const link of getNamedNodes(getTerms(quad))) {
              traverse.push({ url: link.value });
            }
          }
        }
      });

      // If no value has been found, assume infinity.
      action.metadata.on('end', () => {
        resolve({ metadata: { traverse }});
      });
    });
  }
}

export interface IActorRdfMetadataExtractTraverseQuadPatternQueryArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
  /**
   * If only links that match a variable in the query should be included.
   * @default {true}
   */
  onlyVariables: boolean;
}
