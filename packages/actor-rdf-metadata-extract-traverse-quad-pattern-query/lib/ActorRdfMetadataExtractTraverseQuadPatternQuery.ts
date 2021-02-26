import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest, ActionContext } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { getNamedNodes, getTerms, matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import { Util as AlgebraUtil } from 'sparqlalgebrajs';

/**
 * A comunica Traverse Quad Pattern Query RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseQuadPatternQuery extends ActorRdfMetadataExtract {
  public constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public static getCurrentQuery(context?: ActionContext): Algebra.Operation | undefined {
    if (!context) {
      return;
    }
    const currentQueryOperation = context.get(KEY_CONTEXT_QUERY);
    if (!currentQueryOperation) {
      return;
    }
    return currentQueryOperation;
  }

  public static matchQuadPatternInOperation(quad: RDF.Quad, operation: Algebra.Operation): boolean {
    let match = false;
    AlgebraUtil.recurseOperation(operation, {
      pattern(pattern: Algebra.Pattern) {
        if (!match && matchPatternComplete(quad, pattern)) {
          match = true;
        }
        return false;
      },
    });
    return match;
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    if (!ActorRdfMetadataExtractTraverseQuadPatternQuery.getCurrentQuery(action.context)) {
      throw new Error(`Actor ${this.name} can only work in the context of a query.`);
    }
    return true;
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const quadPattern: Algebra.Operation = <Algebra.Operation> ActorRdfMetadataExtractTraverseQuadPatternQuery
      .getCurrentQuery(action.context);
    return new Promise((resolve, reject) => {
      const traverse: ILink[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Immediately resolve when a value has been found.
      action.metadata.on('data', quad => {
        if (ActorRdfMetadataExtractTraverseQuadPatternQuery.matchQuadPatternInOperation(quad, quadPattern)) {
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

export const KEY_CONTEXT_QUERY = '@comunica/actor-init-sparql:query';
