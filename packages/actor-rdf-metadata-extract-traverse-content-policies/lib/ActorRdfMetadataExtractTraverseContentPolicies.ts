import type { ActorInitSparql, IQueryResultBindings } from '@comunica/actor-init-sparql';
import type { IQueryResultQuads } from '@comunica/actor-init-sparql/lib/ActorInitSparql-browser';
import type { Bindings } from '@comunica/bus-query-operation';
import type { IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import {
  ActorRdfMetadataExtract,
} from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { ActionContext, IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { storeStream } from 'rdf-store-stream';
import type { Algebra } from 'sparqlalgebrajs';
import type { ContentPolicy } from './ContentPolicy';

/**
 * A comunica Traverse Content Policies RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractTraverseContentPolicies extends ActorRdfMetadataExtract
  implements IActorRdfMetadataExtractTraverseContentPoliciesArgs {
  public readonly queryEngine: ActorInitSparql;

  public constructor(args: IActorRdfMetadataExtractTraverseContentPoliciesArgs) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  protected getContentPolicies(context?: ActionContext): ContentPolicy[] {
    if (!context || !context.has('contentPolicies')) {
      return [];
    }
    return context.get('contentPolicies');
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    // TODO: if WITH_POLICIES in the context is enabled, extract all content policies from the metadata.

    const traverse: ILink[] = [];

    // Send the policy's graph pattern into the query engine using the metadata stream as source
    let store: RDF.Store | undefined;
    for (const contentPolicy of this.getContentPolicies(action.context)) {
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
            traverse.push({ url: term.value, transform });
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
