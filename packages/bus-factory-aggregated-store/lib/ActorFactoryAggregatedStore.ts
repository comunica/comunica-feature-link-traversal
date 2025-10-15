import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Actor } from '@comunica/core';
import type { IAggregatedStore } from '@comunica/types-link-traversal';

/**
 * A comunica actor for factory-aggregated-store events.
 *
 * Actor types:
 * * Input:  IActionAggregatedStoreFactory:      Empty action.
 * * Test:   <none>
 * * Output: IActorAggregatedStoreFactoryOutput: A new aggregated store.
 *
 * @see IActionFactoryAggregatedStore
 * @see IActorFactoryAggregatedStoreOutput
 */
export abstract class ActorFactoryAggregatedStore<TS = undefined>
  extends Actor<IActionFactoryAggregatedStore, IActorTest, IActorFactoryAggregatedStoreOutput, TS> {
  /* eslint-disable max-len */
  /**
   * @param args -
   *   \ @defaultNested {<default_bus> a <cc:components/Bus.jsonld#Bus>} bus
   *   \ @defaultNested {Aggregated store creation failed: none of the configured actors were able to create an aggregated store} busFailMessage
   */
  /* eslint-enable max-len */
  public constructor(args: IActorFactoryAggregatedStoreArgs<TS>) {
    super(args);
  }
}

export interface IActionFactoryAggregatedStore extends IAction {

}

export interface IActorFactoryAggregatedStoreOutput extends IActorOutput {
  aggregatedStore: IAggregatedStore;
}

export type IActorFactoryAggregatedStoreArgs<TS = undefined> = IActorArgs<
IActionFactoryAggregatedStore,
IActorTest,
  IActorFactoryAggregatedStoreOutput,
TS
>;

export type MediatorFactoryAggregatedStore = Mediate<
IActionFactoryAggregatedStore,
  IActorFactoryAggregatedStoreOutput
>;
