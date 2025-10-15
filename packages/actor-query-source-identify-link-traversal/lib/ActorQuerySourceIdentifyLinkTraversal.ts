import type {
  IActionQuerySourceIdentify,
  IActorQuerySourceIdentifyOutput,
  IActorQuerySourceIdentifyArgs,
} from '@comunica/bus-query-source-identify';
import { ActorQuerySourceIdentify } from '@comunica/bus-query-source-identify';
import { KeysQuerySourceIdentifyLinkTraversal } from '@comunica/context-entries-link-traversal';
import type { TestResult, IActorTest } from '@comunica/core';
import { passTestVoid, failTest } from '@comunica/core';
import { QuerySourceLinkTraversal } from './QuerySourceLinkTraversal';

/**
 * A comunica Link Traversal Query Source Identify Actor.
 */
export class ActorQuerySourceIdentifyLinkTraversal extends ActorQuerySourceIdentify {
  public constructor(args: IActorQuerySourceIdentifyArgs) {
    super(args);
  }

  public async test(action: IActionQuerySourceIdentify): Promise<TestResult<IActorTest>> {
    const source = action.querySourceUnidentified;
    if (source.type !== undefined && source.type !== 'traverse') {
      return failTest(`${this.name} requires a single query source with traverse type to be present in the context.`);
    }
    if (!action.querySourceUnidentified.context?.has(KeysQuerySourceIdentifyLinkTraversal.linkTraversalManager)) {
      return failTest(`${this.name} requires a single query source with a link traversal manager to be present in the context.`);
    }
    return passTestVoid();
  }

  public async run(action: IActionQuerySourceIdentify): Promise<IActorQuerySourceIdentifyOutput> {
    const querySourceContext = action.querySourceUnidentified.context!;
    const linkTraversalManager = querySourceContext.getSafe(KeysQuerySourceIdentifyLinkTraversal.linkTraversalManager);
    return {
      querySource: {
        source: new QuerySourceLinkTraversal(linkTraversalManager),
        context: querySourceContext,
      },
    };
  }
}
