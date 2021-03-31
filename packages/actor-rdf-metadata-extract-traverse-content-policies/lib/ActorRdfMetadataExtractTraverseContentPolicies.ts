import type { ActorInitSparql, IQueryResultBindings } from '@comunica/actor-init-sparql';
import type { IQueryResultQuads } from '@comunica/actor-init-sparql/lib/ActorInitSparql-browser';
import type { Bindings } from '@comunica/bus-query-operation';
import type { IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import {
  ActorRdfMetadataExtract,
} from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { ActionContext } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { storeStream } from 'rdf-store-stream';
import { matchPatternComplete } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import type { ContentPolicy } from './ContentPolicy';
import { SimpleSclParser } from './SimpleSclParser';

/**
 * A comunica Traverse Content Policies RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseContentPolicies extends ActorRdfMetadataExtract
  implements IActorRdfMetadataExtractTraverseContentPoliciesArgs {
  private readonly sclParser: SimpleSclParser;

  public readonly queryEngine: ActorInitSparql;
  public readonly traverseConditional: boolean;

  public constructor(args: IActorRdfMetadataExtractTraverseContentPoliciesArgs) {
    super(args);
    this.sclParser = new SimpleSclParser();
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  public static getContentPolicies(context?: ActionContext): ContentPolicy[] {
    if (!context || !context.has(KEY_CONTEXT_POLICIES)) {
      return [];
    }
    return context.get(KEY_CONTEXT_POLICIES);
  }

  protected async getContentPoliciesFromDocument(documentIri: string, store: RDF.Store): Promise<ContentPolicy[]> {
    // Query the content policies that apply to the current document
    const result = <IQueryResultBindings> await this.queryEngine
      .query(`
        PREFIX scl: <https://w3id.org/scl/vocab#>
        SELECT ?scope WHERE {
          ?policy scl:appliesTo <${documentIri}>;
                  scl:scope ?scope.
        }`, { sources: [ store ]});

    // Parse all found content policies
    return (await result.bindings())
      .map(binding => this.sclParser.parse(binding.get('?scope').value, documentIri));
  }

  public static getCurrentQuadPattern(context?: ActionContext): Algebra.Pattern | undefined {
    if (!context) {
      return;
    }
    const currentQueryOperation = context.get(KeysQueryOperation.operation);
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

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const contentPolicies: ContentPolicy[] = ActorRdfMetadataExtractTraverseContentPolicies
      .getContentPolicies(action.context);
    const currentQuadPattern = ActorRdfMetadataExtractTraverseContentPolicies.getCurrentQuadPattern(action.context);
    const traverse: ILink[] = [];
    let store: RDF.Store | undefined;

    // If KEY_CONTEXT_WITHPOLICIES is enabled, extract all content policies from the metadata
    if (action.context && action.context.get(KEY_CONTEXT_WITHPOLICIES)) {
      store = await storeStream(action.metadata);
      for (const docPolicy of await this.getContentPoliciesFromDocument(action.url, store)) {
        // Only add policies that produce quads matching the currently querying quad pattern
        if (ActorRdfMetadataExtractTraverseContentPolicies
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
      const result = <IQueryResultBindings> await this.queryEngine
        .query(contentPolicy.graphPattern, { sources: [ store ]});

      // Extract all bound named nodes from the policy's variables
      const bindings: Bindings[] = await result.bindings();
      for (const binding of bindings) {
        // If the content policy has a filter, apply it on the links to traverse
        let transform: ((input: RDF.Stream) => Promise<RDF.Stream>) | undefined;
        if (contentPolicy.filter) {
          transform = async(input: RDF.Stream) => {
            const subStore = await storeStream(input);
            const subResult = <IQueryResultQuads> await this.queryEngine
              .query(<Algebra.Construct> contentPolicy.filter, {
                sources: [ subStore ],
                // Apply the bindings to the INCLUDE WHERE clause
                initialBindings: binding,
              });
            return subResult.quadStream;
          };
        }

        // Create a separate link for each followed variable
        for (const variable of contentPolicy.variables) {
          const term = binding.get(`?${variable.name}`);
          if (term && term.termType === 'NamedNode') {
            const link: ILink = { url: term.value, transform };

            // Mark in the context if the linked document's policies should be considered
            link.context = ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: variable.withPolicies });

            traverse.push(link);
          }
        }
      }
    }
    return { metadata: this.traverseConditional ? { traverseConditional: traverse } : { traverse }};
  }
}

export interface IActorRdfMetadataExtractTraverseContentPoliciesArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>{
  queryEngine: ActorInitSparql;
  traverseConditional: boolean;
}

export const KEY_CONTEXT_POLICIES = '@comunica/actor-rdf-metadata-extract-traverse-content-policies:policies';
export const KEY_CONTEXT_WITHPOLICIES = '@comunica/actor-rdf-metadata-extract-traverse-content-policies:withPolicies';
