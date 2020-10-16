import type { IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { ActionContext, IActorArgs, IActorTest } from '@comunica/core';
import { getNamedNodes, getTerms, matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Traverse Quad Pattern RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseQuadPattern extends ActorRdfMetadataExtract {
  public constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public static getCurrentQuadPattern(context?: ActionContext): Algebra.Pattern | undefined {
    if (!context) {
      return;
    }
    const currentQueryOperation = context.get(KEY_CONTEXT_QUERYOPERATION);
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
    const quadPattern: Algebra.Pattern = <Algebra.Pattern> ActorRdfMetadataExtractTraverseQuadPattern
      .getCurrentQuadPattern(action.context);
    return new Promise((resolve, reject) => {
      const traverse: ILink[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Immediately resolve when a value has been found.
      action.metadata.on('data', quad => {
        if (matchPatternComplete(quad, quadPattern)) {
          for (const link of getNamedNodes(getTerms(quad))) {
            traverse.push({ url: link.value });
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

/**
 * @type {string} Context entry for the current query operation.
 */
export const KEY_CONTEXT_QUERYOPERATION = '@comunica/bus-query-operation:operation';
