import type { Actor, IAction, IActorOutput, IActorReply, IActorTest, IMediatorArgs } from '@comunica/core';
import { Mediator } from '@comunica/core';

/**
 * A comunica mediator that concatenates an array of all actor results.
 *
 * The actors that are registered first will appear earlier in the array.
 */
export class MediatorCombineArray<
  A extends Actor<I, T, O>,
I extends IAction,
T extends IActorTest,
O extends IActorOutput,
> extends Mediator<A, I, T, O> implements IMediatorCombineUnionArgs<A, I, T, O> {
  public readonly filterErrors: boolean | undefined;
  public readonly fields: string[];
  public readonly combiner: (results: O[]) => O;

  public constructor(args: IMediatorCombineUnionArgs<A, I, T, O>) {
    super(args);
    this.combiner = this.createCombiner();
  }

  public override async mediate(action: I): Promise<O> {
    let testResults: IActorReply<A, I, T, O>[];
    try {
      testResults = this.publish(action);
    } catch {
      testResults = [];
    }

    if (this.filterErrors) {
      const _testResults: IActorReply<A, I, T, O>[] = [];
      for (const result of testResults) {
        try {
          await result.reply;
          _testResults.push(result);
        } catch {
          // Ignore errors
        }
      }
      testResults = _testResults;
    }

    // Delegate test errors.
    await Promise.all(testResults.map(({ reply }) => reply));

    // Run action on all actors.
    const results: O[] = await Promise.all(testResults.map(result => result.actor.runObservable(action)));

    // Return the combined results.
    return this.combiner(results);
  }

  protected override mediateWith(): Promise<A> {
    throw new Error('Method not supported.');
  }

  protected createCombiner(): (results: O[]) => O {
    return (results: O[]) => {
      const data: any = {};
      for (const field of this.fields) {
        data[field] = [];
        // eslint-disable-next-line unicorn/prefer-spread
        for (const value of [[]].concat(results.map((result: any) => result[field]))) {
          if (value) {
            data[field].push(...value);
          }
        }
      }
      return data;
    };
  }
}

export interface IMediatorCombineUnionArgs<
  A extends Actor<I, T, O>,
I extends IAction,
T extends IActorTest,
O extends IActorOutput,
> extends IMediatorArgs<A, I, T, O> {
  /**
   * If actors that throw test errors should be ignored
   */
  filterErrors?: boolean;
  /**
   * The field names of the test result fields over which must be mediated.
   */
  fields: string[];
}
