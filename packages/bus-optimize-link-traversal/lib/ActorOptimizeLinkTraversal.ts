import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Actor } from '@comunica/core';
import type { INode, IRelation } from '@comunica/types-link-traversal';
/**
 * A comunica actor for optimization of link traversal
 *
 * Actor types:
 * * Input:  IActionOptimizeLinkTraversal:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorOptimizeLinkTraversalOutput: TODO: fill in.
 *
 * @see IActionOptimizeLinkTraversal
 * @see IActorOptimizeLinkTraversalOutput
 */
export abstract class ActorOptimizeLinkTraversal extends Actor<IActionOptimizeLinkTraversal,
IActorTest,
IActorOptimizeLinkTraversalOutput> {
  /**
  * @param args - @defaultNested {<default_bus> a <cc:components/Bus.jsonld#Bus>} bus
  */
  public constructor(args: IActorOptimizeLinkTraversalArgs) {
    super(args);
  }
}

export interface IActionOptimizeLinkTraversal extends IAction {
  treeMetadata?: INode;
}

export interface IActorOptimizeLinkTraversalOutput extends IActorOutput {
  /**
   * Decision map whether the link should be filter or not
   */
  filters?: Map<String, boolean>;
}

export type IActorOptimizeLinkTraversalArgs = IActorArgs<
IActionOptimizeLinkTraversal, IActorTest, IActorOptimizeLinkTraversalOutput>;

export type MediatorOptimizeLinkTraversal = Mediate<
IActionOptimizeLinkTraversal, IActorOptimizeLinkTraversalOutput>;
