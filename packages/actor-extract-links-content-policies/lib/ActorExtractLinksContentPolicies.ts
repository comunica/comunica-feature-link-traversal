import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import { QueryEngineBase } from '@comunica/actor-init-query';
import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import {
  ActorExtractLinks,
} from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { ActionContext, ActionContextKey } from '@comunica/core';
import type { Bindings, IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { storeStream } from 'rdf-store-stream';
import { matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import type { ContentPolicy } from './ContentPolicy';
import { SimpleSclParser } from './SimpleSclParser';

/**
 * A comunica Traverse Content Policies RDF Metadata Extract Actor.
 */
export class ActorExtractLinksContentPolicies extends ActorExtractLinks
  implements IActorExtractLinksContentPoliciesArgs {
  private readonly sclParser: SimpleSclParser;

  public readonly actorInitQuery: ActorInitQueryBase;
  public readonly traverseConditional: boolean;
  public readonly queryEngine: QueryEngineBase;

  public constructor(args: IActorExtractLinksContentPoliciesArgs) {
    super(args);
    this.sclParser = new SimpleSclParser();
    this.queryEngine = new QueryEngineBase(args.actorInitQuery);
  }

  public async test(_action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public static getContentPolicies(context: IActionContext): ContentPolicy[] {
    return context.get(KEY_CONTEXT_POLICIES) ?? [];
  }

  protected async getContentPoliciesFromDocument(documentIri: string, store: RDF.Store): Promise<ContentPolicy[]> {
    // Query the content policies that apply to the current document
    const bindingsStream = await this.queryEngine
      .queryBindings(`
        PREFIX scl: <https://w3id.org/scl/vocab#>
        SELECT ?scope WHERE {
          ?policy scl:appliesTo <${documentIri}>;
                  scl:scope ?scope.
        }`, { sources: [ store ]});

    // Parse all found content policies
    return (await bindingsStream.toArray())
      .map(binding => this.sclParser.parse(binding.get('scope')!.value, documentIri));
  }

  public static getCurrentQuadPattern(context: IActionContext): Algebra.Pattern | undefined {
    const currentQueryOperation: Algebra.Operation | undefined = context.get(KeysQueryOperation.operation);
    if (!currentQueryOperation || currentQueryOperation.type !== 'pattern') {
      return;
    }
    return currentQueryOperation;
  }

  public static isContentPolicyApplicableForPattern(policy: ContentPolicy, queryingPattern?: Algebra.Pattern): boolean {
    if (!policy.filter || !queryingPattern) {
      return true;
    }
    for (const policyPattern of policy.filter.template) {
      if (matchPatternComplete(policyPattern, queryingPattern) ||
        matchPatternComplete(queryingPattern, policyPattern)) {
        return true;
      }
    }
    return false;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    const contentPolicies: ContentPolicy[] = ActorExtractLinksContentPolicies
      .getContentPolicies(action.context);
    const currentQuadPattern = ActorExtractLinksContentPolicies.getCurrentQuadPattern(action.context);
    const links: ILink[] = [];
    let store: RDF.Store | undefined;

    // If KEY_CONTEXT_WITHPOLICIES is enabled, extract all content policies from the metadata
    if (action.context && action.context.get(KEY_CONTEXT_WITHPOLICIES)) {
      store = await storeStream(action.metadata);
      for (const docPolicy of await this.getContentPoliciesFromDocument(action.url, store)) {
        // Only add policies that produce quads matching the currently querying quad pattern
        if (ActorExtractLinksContentPolicies
          .isContentPolicyApplicableForPattern(docPolicy, currentQuadPattern)) {
          contentPolicies.push(docPolicy);
        }
      }
    }

    // Send the policy's graph pattern into the query engine using the metadata stream as source
    for (const contentPolicy of contentPolicies) {
      // Load store only once
      if (!store) {
        store = await storeStream(action.metadata);
      }

      // Find all matching results
      const bindingsStream = await this.queryEngine
        .queryBindings(contentPolicy.graphPattern, { sources: [ store ]});

      // Extract all bound named nodes from the policy's variables
      const bindings: Bindings[] = await bindingsStream.toArray();
      for (const binding of bindings) {
        // If the content policy has a filter, apply it on the links to traverse
        let transform: ((input: RDF.Stream) => Promise<RDF.Stream>) | undefined;
        if (contentPolicy.filter) {
          transform = async(input: RDF.Stream) => {
            const subStore = await storeStream(input);
            return await this.queryEngine.queryQuads(contentPolicy.filter!, {
              sources: [ subStore ],
              // Apply the bindings to the INCLUDE WHERE clause
              initialBindings: binding,
            });
          };
        }

        // Create a separate link for each followed variable
        for (const variable of contentPolicy.variables) {
          const term = binding.get(variable.name);
          if (term && term.termType === 'NamedNode') {
            const link: ILink = {
              url: term.value,
              transform,
              metadata: { producedByActor: { name: this.name, traverseConditional: this.traverseConditional }},
            };

            // Mark in the context if the linked document's policies should be considered
            link.context = new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: variable.withPolicies });

            links.push(link);
          }
        }
      }
    }
    return this.traverseConditional ? { linksConditional: links, links: []} : { links };
  }
}

export interface IActorExtractLinksContentPoliciesArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * An init query actor that is used to query all links to follow from a stream.
   * @default {<urn:comunica:default:init/actors#query>}
   */
  actorInitQuery: ActorInitQueryBase;
  /**
   * If true (default), then content policies will be applied on links that are being detected by some other actor,
   * if false, then links detected by content policies will forcefully be added to the link queue.
   * @default {true}
   */
  traverseConditional: boolean;
}

export const KEY_CONTEXT_POLICIES = new ActionContextKey<ContentPolicy[]>(
  '@comunica/actor-extract-links-content-policies:policies',
);
export const KEY_CONTEXT_WITHPOLICIES = new ActionContextKey<boolean>(
  '@comunica/actor-extract-links-content-policies:withPolicies',
);
