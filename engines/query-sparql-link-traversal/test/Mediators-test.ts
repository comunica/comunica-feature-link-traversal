import type {
  IActionFactoryAggregatedStore,
  IActorFactoryAggregatedStoreOutput,
} from '@comunica/bus-factory-aggregated-store';

import { ActionContext, failTest } from '@comunica/core';
import type { Mediate, IAction, IActorOutput, IActorTest, Bus } from '@comunica/core';
import type { Runner } from '@comunica/runner';
import { instantiateComponent } from '@comunica/runner';
import type { IActionContext } from '@comunica/types';
import { DataFactory } from 'rdf-data-factory';
import { QueryEngineFactory } from '../lib';

const queryEngineFactory = new QueryEngineFactory();
const DF = new DataFactory();

describe('System test: mediators', () => {
  let runner: Runner;
  beforeAll(async() => {
    runner = await instantiateComponent(
      (<any> queryEngineFactory).defaultConfigPath,
      'urn:comunica:default:Runner',
      {},
    );
  });
  const context: IActionContext = new ActionContext();

  addTest<IActionFactoryAggregatedStore, IActorFactoryAggregatedStoreOutput>(
    'aggregated-store-factory',
    ':optimize-query-operation/actors#initialize-link-traversal-manager',
    'mediatorFactoryAggregatedStore',
    {},
    `Aggregated store creation failed: none of the configured actors were able to create an aggregated store`,
  );

  /**
   * Add a test for a given bus mediator.
   * @param name The bus name.
   * @param mediatorAccessorActorName The name of an actor that contains the given mediator.
   * @param mediatorAccessorActorMediatorField The field name in the accessed actor that contains the mediator to select
   * @param action An action to simulate.
   * @param failMessage The failure message to expect when all actors in the bus fail.
   */
  function addTest<I extends IAction, O extends IActorOutput, T extends IActorTest = IActorTest>(
    name: string,
    mediatorAccessorActorName: string,
    mediatorAccessorActorMediatorField: string,
    action: Omit<I, 'context'>,
    failMessage: string,
  ): void {
    describe(name, () => {
      let mediator: Mediate<I, O, T>;
      let bus: Bus<any, any, any, any>;

      describe('with all actors failing', () => {
        beforeEach(() => {
          for (const actor of runner.actors) {
            if (actor.name.endsWith(mediatorAccessorActorName)) {
              mediator = (<any> actor)[mediatorAccessorActorMediatorField];
              bus = mediator.bus;
            }
          }
          for (const actor of runner.actors) {
            if (actor.bus === bus) {
              actor.test = () => Promise.resolve(failTest('actor test failure'));
            }
          }
        });

        it('mediator rejects', async() => {
          await expect(mediator.mediate(<I> { ...action, context })).rejects.toThrow(failMessage);
        });
      });
    });
  }
});
