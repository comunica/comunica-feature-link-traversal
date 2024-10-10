import {
  ActorRdfJoin,
} from '@comunica/bus-rdf-join';
import type {
  IActionRdfJoin,
  IActorRdfJoinArgs,
  MediatorRdfJoin,
  IActorRdfJoinOutputInner,
  IActorRdfJoinTestSideData,
} from '@comunica/bus-rdf-join';
import { KeysRdfJoin } from '@comunica/context-entries-link-traversal';
import type { TestResult } from '@comunica/core';
import { failTest, passTestWithSideData } from '@comunica/core';
import type { IMediatorTypeJoinCoefficients } from '@comunica/mediatortype-join-coefficients';
import type { IQueryOperationResultBindings, IJoinEntry } from '@comunica/types';
import { ClosableTransformIterator } from '@comunica/utils-iterator';
import { BindingsStreamAdaptiveDestroy } from './BindingsStreamAdaptiveDestroy';

/**
 * A comunica Inner Multi Adaptive Destroy RDF Join Actor.
 */
export class ActorRdfJoinInnerMultiAdaptiveDestroy extends ActorRdfJoin {
  public readonly mediatorJoin: MediatorRdfJoin;
  public readonly timeout: number;

  public constructor(args: IActorRdfJoinInnerMultiAdaptiveDestroyArgs) {
    super(args, {
      logicalType: 'inner',
      physicalName: 'multi-adaptive-destroy',
    });
  }

  public override async test(
    action: IActionRdfJoin,
  ): Promise<TestResult<IMediatorTypeJoinCoefficients, IActorRdfJoinTestSideData>> {
    if (action.context.get(KeysRdfJoin.skipAdaptiveJoin)) {
      return failTest(`Actor ${this.name} could not run because adaptive join processing is disabled.`);
    }
    return super.test(action);
  }

  public override async run(
    action: IActionRdfJoin,
    sideData: IActorRdfJoinTestSideData,
  ): Promise<IQueryOperationResultBindings> {
    return super.run(action, sideData);
  }

  protected cloneEntries(entries: IJoinEntry[], allowClosingOriginals: boolean): IJoinEntry[] {
    return entries.map(entry => ({
      operation: entry.operation,
      output: {
        ...entry.output,
        // Clone stream, as we'll also need it later
        bindingsStream: new ClosableTransformIterator(entry.output.bindingsStream.clone(), {
          autoStart: false,
          onClose() {
            if (allowClosingOriginals) {
              entry.output.bindingsStream.destroy();
            }
          },
        }),
      },
    }));
  }

  protected override async getOutput(action: IActionRdfJoin): Promise<IActorRdfJoinOutputInner> {
    // Disable adaptive joins in recursive calls to this bus, to avoid infinite recursion on this actor.
    const subContext = action.context.set(KeysRdfJoin.skipAdaptiveJoin, true);

    // Execute the join with the metadata we have now
    const firstOutput = await this.mediatorJoin.mediate({
      type: action.type,
      entries: this.cloneEntries(action.entries, false),
      context: subContext,
    });

    return {
      result: {
        type: 'bindings',
        bindingsStream: new BindingsStreamAdaptiveDestroy(
          firstOutput.bindingsStream,
          async() =>
            // Restart the join with the latest metadata
            (await this.mediatorJoin.mediate({
              type: action.type,
              entries: this.cloneEntries(action.entries, true),
              context: subContext,
            })).bindingsStream
          ,
          { timeout: this.timeout, autoStart: false },
        ),
        metadata: firstOutput.metadata,
      },
    };
  }

  protected override async getJoinCoefficients(
    _action: IActionRdfJoin,
    sideData: IActorRdfJoinTestSideData,
  ): Promise<TestResult<IMediatorTypeJoinCoefficients, IActorRdfJoinTestSideData>> {
    // Dummy join coefficients to make sure we always run first
    return passTestWithSideData({
      iterations: 0,
      persistedItems: 0,
      blockingItems: 0,
      requestTime: 0,
    }, sideData);
  }
}

export interface IActorRdfJoinInnerMultiAdaptiveDestroyArgs extends IActorRdfJoinArgs {
  mediatorJoin: MediatorRdfJoin;
  /**
   * @default {1000}
   */
  timeout: number;
}
