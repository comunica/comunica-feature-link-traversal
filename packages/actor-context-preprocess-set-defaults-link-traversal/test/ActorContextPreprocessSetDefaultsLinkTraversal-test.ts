import { KeysQuerySourceIdentify } from '@comunica/context-entries';
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import { ActionContext, Bus } from '@comunica/core';
import { ActorContextPreprocessSetDefaultsLinkTraversal } from '../lib/ActorContextPreprocessSetDefaultsLinkTraversal';
import '@comunica/utils-jest';

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
      await expect(actor.test({ context: new ActionContext() })).resolves.toPassTestVoid();
    });

    describe('run', () => {
      it('with empty context', async() => {
        const contextIn = new ActionContext();
        const { context: contextOut } = await actor.run({ context: contextIn });

        const expectedContext = new ActionContext()
          .set(KeysQuerySourceIdentify.traverse, true)
          .set(KeysRdfResolveHypermediaLinks.linkFilters, []);

        expect(contextOut).toEqual(expectedContext);
      });

      it('with KeysQuerySourceIdentify.traverse false', async() => {
        const contextIn = new ActionContext().set(KeysQuerySourceIdentify.traverse, false);
        const { context: contextOut } = await actor.run({ context: contextIn });

        const expectedContext = new ActionContext()
          .set(KeysQuerySourceIdentify.traverse, false)
          .set(KeysRdfResolveHypermediaLinks.linkFilters, []);

        expect(contextOut).toEqual(expectedContext);
      });

      it('with KeysRdfResolveHypermediaLinks.linkFilters defined', async() => {
        const a_filter = () => true;
        const contextIn = new ActionContext().set(KeysRdfResolveHypermediaLinks.linkFilters, [ a_filter ]);
        const { context: contextOut } = await actor.run({ context: contextIn });

        const expectedContext = new ActionContext()
          .set(KeysQuerySourceIdentify.traverse, true)
          .set(KeysRdfResolveHypermediaLinks.linkFilters, [ a_filter ]);

        expect(contextOut).toEqual(expectedContext);
      });

      it('with KeysRdfResolveHypermediaLinks.linkFilters and KeysQuerySourceIdentify.traverse defined', async() => {
        const a_filter = () => true;
        const contextIn = new ActionContext()
          .set(KeysRdfResolveHypermediaLinks.linkFilters, [ a_filter ])
          .set(KeysQuerySourceIdentify.traverse, false);
        const { context: contextOut } = await actor.run({ context: contextIn });

        const expectedContext = new ActionContext()
          .set(KeysQuerySourceIdentify.traverse, false)
          .set(KeysRdfResolveHypermediaLinks.linkFilters, [ a_filter ]);

        expect(contextOut).toEqual(expectedContext);
      });
    });
  });
});
