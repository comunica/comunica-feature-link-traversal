import type {
  IActionExtractLinks,
  IActorExtractLinksArgs,
  IActorExtractLinksOutput,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { filterQuadTermNames, getNamedNodes, getTerms, matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Traverse Quad Pattern RDF Metadata Extract Actor.
 */
export class ActorExtractLinksQuadPattern extends ActorExtractLinks {
  private readonly onlyVariables: boolean;
  public static readonly REACHABILITY_LABEL = 'cQuadPatern';

  public constructor(args: IActorExtractLinksQuadPatternArgs) {
    super(args);
    this.reachabilityLabel = ActorExtractLinksQuadPattern.REACHABILITY_LABEL;
    Object.freeze(this.reachabilityLabel);
  }

  public static getCurrentQuadPattern(context: IActionContext): Algebra.Pattern | undefined {
    const currentQueryOperation: Algebra.Operation | undefined = context.get(KeysQueryOperation.operation);
    if (!currentQueryOperation || currentQueryOperation.type !== 'pattern') {
      return;
    }
    return currentQueryOperation;
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    if (!ActorExtractLinksQuadPattern.getCurrentQuadPattern(action.context)) {
      throw new Error(`Actor ${this.name} can only work in the context of a quad pattern.`);
    }
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    const quadPattern: Algebra.Pattern = ActorExtractLinksQuadPattern
      .getCurrentQuadPattern(action.context)!;

    return {
      links: await ActorExtractLinks.collectStream(action.metadata, (quad, links) => {
        if (this.onlyVariables) {
          // --- If we only want to follow links matching with a variable component ---
          if (matchPatternComplete(quad, quadPattern)) {
            for (const quadTermName of filterQuadTermNames(quadPattern, value => value.termType === 'Variable')) {
              if (quad[quadTermName].termType === 'NamedNode') {
                links.push(this.annotateLinkWithTheReachabilityCriteria({ url: quad[quadTermName].value }));
              }
            }
          }
        } else {
          // --- If we want to follow links, irrespective of matching with a variable component ---
          // eslint-disable-next-line no-lonely-if
          if (matchPatternComplete(quad, quadPattern)) {
            for (const link of getNamedNodes(getTerms(quad))) {
              links.push(this.annotateLinkWithTheReachabilityCriteria({ url: link.value }));
            }
          }
        }
      }),
    };
  }
}

export interface IActorExtractLinksQuadPatternArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput>, IActorExtractLinksArgs {
  /**
   * @default {true}
   */
  onlyVariables: boolean;
}
