import { ActorInitSparql } from '@comunica/actor-init-sparql';
// TODO: fix export in Comunica
import { IQueryResultBindings } from '@comunica/actor-init-sparql/index-browser';
import { Bindings } from '@comunica/bus-query-operation';
import {
  ActorRdfMetadataExtract,
  IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput,
} from '@comunica/bus-rdf-metadata-extract';
import { ActionContext, IActorArgs, IActorTest } from '@comunica/core';
import type * as RDF from 'rdf-js';
import { storeStream } from 'rdf-store-stream';
import { ContentPolicy } from './ContentPolicy';

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

    const traverse: string[] = [];

    // Send the policy's graph pattern into the query engine using the metadata stream as source
    let store: RDF.Store | undefined;
    for (const contentPolicy of this.getContentPolicies(action.context)) {
      // Load store only once
      if (!store) {
        store = await storeStream(action.metadata);
      }

      const result = <IQueryResultBindings> await this.queryEngine
        .query(contentPolicy.graphPattern, { sources: [ store ]});

      // Extract all bound named nodes from the policy's variables
      // TODO: fix incorrect typings in Comunica
      const bindings: Bindings[] = <Bindings[]><any> await result.bindings();
      for (const binding of bindings) {
        for (const variable of contentPolicy.variables) {
          const term = binding.get(`?${variable.name}`);
          if (term && term.termType === 'NamedNode') {
            traverse.push(term.value);
          }
        }
      }

      // TODO: if contentPolicy.filter, attach this filter to the traversed link.
    }
    return { metadata: { traverse }};
  }
}

export interface IActorRdfMetadataExtractTraverseContentPoliciesArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>{
  queryEngine: ActorInitSparql;
}
