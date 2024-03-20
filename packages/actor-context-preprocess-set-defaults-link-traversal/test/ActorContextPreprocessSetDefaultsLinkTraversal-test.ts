import { KeysQuerySourceIdentify } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { ActorContextPreprocessSetDefaultsLinkTraversal } from '../lib/ActorContextPreprocessSetDefaultsLinkTraversal';

describe('ActorContextPreprocessSetDefaultsLinkTraversal', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorContextPreprocessSetDefaultsLinkTraversal instance', () => {
    let actor: ActorContextPreprocessSetDefaultsLinkTraversal;

    beforeEach(() => {
      actor = new ActorContextPreprocessSetDefaultsLinkTraversal({ name: 'actor', bus });
    });

    it('should test', async() => {
      await expect(actor.test({ context: new ActionContext() })).resolves.toBeTruthy();
    });

    describe('run', () => {
      it('with empty context', async() => {
        const contextIn = new ActionContext();
        const { context: contextOut } = await actor.run({ context: contextIn });
        expect(contextOut).toEqual(new ActionContext().set(KeysQuerySourceIdentify.traverse, true));
      });

      it('with KeysQuerySourceIdentify.traverse false', async() => {
        const contextIn = new ActionContext().set(KeysQuerySourceIdentify.traverse, false);
        const { context: contextOut } = await actor.run({ context: contextIn });
        expect(contextOut).toEqual(new ActionContext().set(KeysQuerySourceIdentify.traverse, false));
      });
    });
  });
});
