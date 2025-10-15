import { KeysQuerySourceIdentifyLinkTraversal } from '@comunica/context-entries-link-traversal';
import { ActionContext, Bus } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type { ILinkTraversalManager } from '@comunica/types-link-traversal';
import { ActorQuerySourceIdentifyLinkTraversal } from '../lib/ActorQuerySourceIdentifyLinkTraversal';
import { QuerySourceLinkTraversal } from '../lib/QuerySourceLinkTraversal';
import '@comunica/utils-jest';

describe('ActorQuerySourceIdentifyLinkTraversal', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorQuerySourceIdentifyLinkTraversal instance', () => {
    let actor: ActorQuerySourceIdentifyLinkTraversal;
    let context: IActionContext;
    let linkTraversalManager: ILinkTraversalManager;

    beforeEach(() => {
      actor = new ActorQuerySourceIdentifyLinkTraversal({ name: 'actor', bus });
      linkTraversalManager = <any> { seeds: [{ url: 'abc' }, { url: 'def' }]};
      context = new ActionContext({
        [KeysQuerySourceIdentifyLinkTraversal.linkTraversalManager.name]: linkTraversalManager,
      });
    });

    describe('test', () => {
      it('should test', async() => {
        await expect(actor.test({
          querySourceUnidentified: { type: 'traverse', value: 'abc', context },
          context: new ActionContext(),
        })).resolves.toPassTestVoid();
      });

      it('should not test with sparql type', async() => {
        await expect(actor.test({
          querySourceUnidentified: { type: 'sparql', value: 'abc', context },
          context: new ActionContext(),
        })).resolves.toFailTest(`actor requires a single query source with traverse type to be present in the context.`);
      });

      it('should not test without linkTraversalManager', async() => {
        await expect(actor.test({
          querySourceUnidentified: { type: 'traverse', value: 'abc' },
          context: new ActionContext(),
        })).resolves.toFailTest(`actor requires a single query source with a link traversal manager to be present in the context.`);
      });
    });

    describe('run', () => {
      it('should get the source', async() => {
        const ret = await actor.run({
          querySourceUnidentified: { value: 'abc', context },
          context: new ActionContext(),
        });
        expect(ret.querySource.source).toBeInstanceOf(QuerySourceLinkTraversal);
        expect((<QuerySourceLinkTraversal> ret.querySource.source).linkTraversalManager).toBe(linkTraversalManager);
        expect(ret.querySource.context).toBe(context);
      });
    });
  });
});
