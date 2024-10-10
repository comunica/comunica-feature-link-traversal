import type { IActorContextPreprocessOutput, IActorContextPreprocessArgs } from '@comunica/bus-context-preprocess';
import { ActorContextPreprocess } from '@comunica/bus-context-preprocess';
import { KeysQuerySourceIdentify } from '@comunica/context-entries';
import type { IAction, IActorTest, TestResult } from '@comunica/core';
import { passTestVoid } from '@comunica/core';

/**
 * A comunica Set Defaults Link Traversal Context Preprocess Actor.
 */
export class ActorContextPreprocessSetDefaultsLinkTraversal extends ActorContextPreprocess {
  public constructor(args: IActorContextPreprocessArgs) {
    super(args);
  }

  public async test(_action: IAction): Promise<TestResult<IActorTest>> {
    return passTestVoid();
  }

  public async run(action: IAction): Promise<IActorContextPreprocessOutput> {
    let context = action.context;

    // Set traverse flag to true if the flag is undefined.
    if (!context.has(KeysQuerySourceIdentify.traverse)) {
      context = context.set(KeysQuerySourceIdentify.traverse, true);
    }

    return { context };
  }
}
