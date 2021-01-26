import type { ActorInitSparql, IQueryResultBindings } from '@comunica/actor-init-sparql';
import type { IQueryResultQuads } from '@comunica/actor-init-sparql/lib/ActorInitSparql-browser';
import type { Bindings } from '@comunica/bus-query-operation';
import type { IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import {
  ActorRdfMetadataExtract,
} from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { ActionContext } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { storeStream } from 'rdf-store-stream';
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

  public constructor(args: IActorRdfMetadataExtractTraverseContentPoliciesArgs) {
    super(args);
    this.sclParser = new SimpleSclParser();
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  protected getContentPolicies(context?: ActionContext): ContentPolicy[] {
    if (!context || !context.has(KEY_CONTEXT_POLICIES)) {
      return [];
    }
    return context.get(KEY_CONTEXT_POLICIES);
  }

  protected async getContentPoliciesFromDocument(documentIri: string, store: RDF.Store): Promise<ContentPolicy[]> {
    // Query the content policies that apply to the current document
    const result = <IQueryResultBindings> await this.queryEngine
      .query(`
        @prefix scl: <http://example.org/scl#>.
        SELECT ?scope WHERE {
          ?policy scl:appliesTo <${documentIri}>.
                  scl:scope ?scope.
        }`, { sources: [ store ]});

    // Parse all found content policies
    return (await result.bindings())
      .map(binding => this.sclParser.parse(binding.get('?scope').value, documentIri));
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const contentPolicies: ContentPolicy[] = this.getContentPolicies(action.context);
    const traverse: ILink[] = [];
    let store: RDF.Store | undefined;

    // If KEY_CONTEXT_WITHPOLICIES is enabled, extract all content policies from the metadata
    if (action.context && action.context.get(KEY_CONTEXT_WITHPOLICIES)) {
      store = await storeStream(action.metadata);
      for (const docPolicy of await this.getContentPoliciesFromDocument(action.url, store)) {
        contentPolicies.push(docPolicy);
      }
    }

    // Send the policy's graph pattern into the query engine using the metadata stream as source
    for (const contentPolicy of contentPolicies) {
      // Load store only once
      if (!store) {
        store = await storeStream(action.metadata);
      }

      const result = <IQueryResultBindings> await this.queryEngine
        .query(contentPolicy.graphPattern, { sources: [ store ]});

      // If the content policy has a filter, apply it on the links to traverse
      let transform: ((input: RDF.Stream) => Promise<RDF.Stream>) | undefined;
      if (contentPolicy.filter) {
        transform = async(input: RDF.Stream) => {
          const subStore = await storeStream(input);
          const subResult = <IQueryResultQuads> await this.queryEngine
            .query(<Algebra.Construct> contentPolicy.filter, { sources: [ subStore ]});
          return subResult.quadStream;
        };
      }

      // Extract all bound named nodes from the policy's variables
      const bindings: Bindings[] = await result.bindings();
      for (const binding of bindings) {
        for (const variable of contentPolicy.variables) {
          const term = binding.get(`?${variable.name}`);
          if (term && term.termType === 'NamedNode') {
            const link: ILink = { url: term.value, transform };

            // If the variable is marked to included policies for matched documents, set it in the context
            if (variable.withPolicies) {
              link.context = ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true });
            }

            traverse.push(link);
          }
        }
      }
    }
    return { metadata: { traverse }};
  }
}

export interface IActorRdfMetadataExtractTraverseContentPoliciesArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>{
  queryEngine: ActorInitSparql;
}

export const KEY_CONTEXT_POLICIES = '@comunica/actor-rdf-metadata-extract-traverse-content-policies:policies';
export const KEY_CONTEXT_WITHPOLICIES = '@comunica/actor-rdf-metadata-extract-traverse-content-policies:withPolicies';
