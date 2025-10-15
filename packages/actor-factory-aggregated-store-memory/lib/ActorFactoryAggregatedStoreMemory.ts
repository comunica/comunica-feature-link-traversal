import type {
  IActionFactoryAggregatedStore,
  IActorFactoryAggregatedStoreOutput,
  IActorFactoryAggregatedStoreArgs,
} from '@comunica/bus-factory-aggregated-store';
import { ActorFactoryAggregatedStore } from '@comunica/bus-factory-aggregated-store';
import type { MediatorRdfMetadataAccumulate } from '@comunica/bus-rdf-metadata-accumulate';
import { KeysInitQuery } from '@comunica/context-entries';
import type { TestResult, IActorTest } from '@comunica/core';
import { passTestVoid } from '@comunica/core';
import type { MetadataBindings } from '@comunica/types';
import { AggregatedStoreMemory } from './AggregatedStoreMemory';

/**
 * A comunica Memory Factory Aggregated Store Actor.
 */
export class ActorFactoryAggregatedStoreMemory extends ActorFactoryAggregatedStore {
  public readonly emitPartialCardinalities: boolean;
  public readonly mediatorMetadataAccumulate: MediatorRdfMetadataAccumulate;

  public constructor(args: IActorFactoryAggregatedStoreMemoryArgs) {
    super(args);
  }

  public async test(_action: IActionFactoryAggregatedStore): Promise<TestResult<IActorTest>> {
    return passTestVoid();
  }

  public async run(action: IActionFactoryAggregatedStore): Promise<IActorFactoryAggregatedStoreOutput> {
    return {
      aggregatedStore: new AggregatedStoreMemory(
        undefined,
        async(accumulatedMetadata, appendingMetadata) => <MetadataBindings>
          (await this.mediatorMetadataAccumulate.mediate({
            mode: 'append',
            accumulatedMetadata,
            appendingMetadata,
            context: action.context,
          })).metadata,
        this.emitPartialCardinalities,
        action.context.getSafe(KeysInitQuery.dataFactory),
      ),
    };
  }
}

export interface IActorFactoryAggregatedStoreMemoryArgs extends IActorFactoryAggregatedStoreArgs {
  /**
   * Indicates whether the {@link AggregatedStoreMemory} should emit updated partial
   * cardinalities for each matching quad.
   *
   * Note: Enabling this option may degrade performance due to frequent
   * {@link MetadataValidationState} invalidations and updates.
   * @default {false}
   */
  emitPartialCardinalities: boolean;
  /**
   * The metadata accumulate mediator
   */
  mediatorMetadataAccumulate: MediatorRdfMetadataAccumulate;
}
