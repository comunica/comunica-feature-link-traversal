import type { IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { filterQuadTermNames, getNamedNodes, getTerms, matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Traverse Quad Pattern RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseQuadPattern extends ActorRdfMetadataExtract {
  private readonly onlyVariables: boolean;

  public constructor(args: IActorRdfMetadataExtractTraverseQuadPatternArgs) {
    super(args);
  }

  public static getCurrentQuadPattern(context: IActionContext): Algebra.Pattern | undefined {
    const currentQueryOperation: Algebra.Operation | undefined = context.get(KeysQueryOperation.operation);
    if (!currentQueryOperation || currentQueryOperation.type !== 'pattern') {
      return;
    }
    return currentQueryOperation;
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    if (!ActorRdfMetadataExtractTraverseQuadPattern.getCurrentQuadPattern(action.context)) {
      throw new Error(`Actor ${this.name} can only work in the context of a quad pattern.`);
    }
    return true;
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const quadPattern: Algebra.Pattern = ActorRdfMetadataExtractTraverseQuadPattern
      .getCurrentQuadPattern(action.context)!;
    return new Promise((resolve, reject) => {
      const traverse: ILink[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Immediately resolve when a value has been found.
      action.metadata.on('data', quad => {
        if (this.onlyVariables) {
          // --- If we only want to follow links matching with a variable component ---
          if (matchPatternComplete(quad, quadPattern)) {
            for (const quadTermName of filterQuadTermNames(quadPattern, value => value.termType === 'Variable')) {
              if (quad[quadTermName].termType === 'NamedNode') {
                traverse.push({ url: quad[quadTermName].value });
              }
            }
          }
        } else {
          // --- If we want to follow links, irrespective of matching with a variable component ---
          // eslint-disable-next-line no-lonely-if
          if (matchPatternComplete(quad, quadPattern)) {
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

export interface IActorRdfMetadataExtractTraverseQuadPatternArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
  /**
   * @default {true}
   */
  onlyVariables: boolean;
}
