import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysInitQuery } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { QuadTermName } from 'rdf-terms';
import { filterQuadTermNames, getNamedNodes, getTerms, matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import { Util as AlgebraUtil } from 'sparqlalgebrajs';

const DF = new DataFactory<RDF.BaseQuad>();
const VAR = DF.variable('__comunica:pp_var');

/**
 * A comunica Traverse Quad Pattern Query RDF Metadata Extract Actor.
 */
export class ActorExtractLinksQuadPatternQuery extends ActorExtractLinks {
  private readonly onlyVariables: boolean;

  public constructor(args: IActorExtractLinksQuadPatternQueryArgs) {
    super(args);
  }

  public static getCurrentQuery(context: IActionContext): Algebra.Operation | undefined {
    const currentQueryOperation: Algebra.Operation | undefined = context.get(KeysInitQuery.query);
    if (!currentQueryOperation) {
      return;
    }
    return currentQueryOperation;
  }

  public static matchQuadPatternInOperation(quad: RDF.Quad, operation: Algebra.Operation): RDF.BaseQuad[] {
    const matchingPatterns: RDF.BaseQuad[] = [];
    AlgebraUtil.recurseOperation(operation, {
      pattern(pattern: Algebra.Pattern) {
        if (matchPatternComplete(quad, pattern)) {
          matchingPatterns.push(pattern);
        }
        return false;
      },
      path(path: Algebra.Path) {
        AlgebraUtil.recurseOperation(path, {
          link(link: Algebra.Link) {
            const pattern = DF.quad(VAR, link.iri, VAR, path.graph);
            if (matchPatternComplete(quad, pattern)) {
              matchingPatterns.push(pattern);
            }
            return false;
          },
          nps(nps: Algebra.Nps) {
            for (const iri of nps.iris) {
              const pattern = DF.quad(VAR, iri, VAR, path.graph);
              if (matchPatternComplete(quad, pattern)) {
                matchingPatterns.push(pattern);
              }
            }
            return false;
          },
        });
        return false;
      },
    });
    return matchingPatterns;
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    if (!ActorExtractLinksQuadPatternQuery.getCurrentQuery(action.context)) {
      throw new Error(`Actor ${this.name} can only work in the context of a query.`);
    }
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    const operation: Algebra.Operation = ActorExtractLinksQuadPatternQuery
      .getCurrentQuery(action.context)!;

    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        const matchingPatterns = ActorExtractLinksQuadPatternQuery
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
            for (const quadTermName of <QuadTermName[]> Object.keys(quadTermNames)) {
              if (quad[quadTermName].termType === 'NamedNode') {
                links.push({ url: quad[quadTermName].value });
              }
            }
          } else {
            // --- If we want to follow links, irrespective of matching with a variable component ---
            for (const link of getNamedNodes(getTerms(quad))) {
              links.push({ url: link.value });
            }
          }
        }
      }),
    };
  }
}

export interface IActorExtractLinksQuadPatternQueryArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * If only links that match a variable in the query should be included.
   * @default {true}
   */
  onlyVariables: boolean;
}
