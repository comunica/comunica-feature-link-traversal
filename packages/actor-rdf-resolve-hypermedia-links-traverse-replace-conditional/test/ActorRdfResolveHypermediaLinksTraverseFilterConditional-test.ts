import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActionContext, Bus } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import {
  ActorRdfResolveHypermediaLinksTraverseReplaceConditional,
} from '../lib/ActorRdfResolveHypermediaLinksTraverseReplaceConditional';

describe('ActorRdfResolveHypermediaLinksTraverseReplaceConditional', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfResolveHypermediaLinksTraverseReplaceConditional module', () => {
    it('should be a function', () => {
      expect(ActorRdfResolveHypermediaLinksTraverseReplaceConditional).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfResolveHypermediaLinksTraverseReplaceConditional constructor', () => {
      expect(new (<any> ActorRdfResolveHypermediaLinksTraverseReplaceConditional)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfResolveHypermediaLinksTraverseReplaceConditional);
      expect(new (<any> ActorRdfResolveHypermediaLinksTraverseReplaceConditional)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfResolveHypermediaLinks);
    });

    it('should not be able to create new ActorRdfResolveHypermediaLinksTraverseReplaceConditional ' +
      'objects without \'new\'', () => {
      expect(() => {
        (<any> ActorRdfResolveHypermediaLinksTraverseReplaceConditional)();
      }).toThrow(`Class constructor ActorRdfResolveHypermediaLinksTraverseReplaceConditional cannot be invoked without 'new'`);
    });
  });

  describe('An ActorRdfResolveHypermediaLinksTraverseReplaceConditional instance', () => {
    let mediatorRdfResolveHypermediaLinks: any;
    let actor: ActorRdfResolveHypermediaLinksTraverseReplaceConditional;
    let context: IActionContext;

    beforeEach(() => {
      mediatorRdfResolveHypermediaLinks = {
        async mediate(arg: any) {
          return arg;
        },
      };
      actor = new ActorRdfResolveHypermediaLinksTraverseReplaceConditional(
        { name: 'actor', bus, mediatorRdfResolveHypermediaLinks },
      );
      context = new ActionContext();
    });

    it('should fail to test with empty metadata', async() => {
      await expect(actor.test({ metadata: {}, context })).rejects
        .toThrow(new Error('Actor actor requires a \'traverse\' metadata entry.'));
    });

    it('should fail to test without traverseConditional in metadata', async() => {
      await expect(actor.test({ metadata: { traverse: true }, context }))
        .rejects.toThrow(`Actor actor requires a 'traverseConditional' metadata entry.`);
    });

    it('should fail to test without traverse in metadata', async() => {
      await expect(actor.test({ metadata: { traverseConditional: true }, context }))
        .rejects.toThrow(`Actor actor requires a 'traverse' metadata entry.`);
    });

    it('should test with traverse and traverseConditional in metadata', async() => {
      await expect(actor.test({ metadata: { traverse: true, traverseConditional: true }, context }))
        .resolves.toBe(true);
    });

    it('should run with empty data', async() => {
      const action = {
        metadata: {
          traverse: [],
          traverseConditional: [],
        },
        context,
      };
      await expect(actor.run(action)).resolves.toEqual({
        metadata: {
          traverse: [],
        },
        context,
      });
    });

    it('should run with empty traverseConditional', async() => {
      const action = {
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b' },
            { url: 'c' },
          ],
          traverseConditional: [],
        },
        context,
      };
      await expect(actor.run(action)).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b' },
            { url: 'c' },
          ],
        },
        context,
      });
    });

    it('should run', async() => {
      const action = {
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b' },
            { url: 'c' },
          ],
          traverseConditional: [
            { url: 'b', context: 'C' },
            { url: 'c', context: 'C' },
          ],
        },
        context,
      };
      await expect(actor.run(action)).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b', context: 'C' },
            { url: 'c', context: 'C' },
          ],
        },
        context,
      });
    });
  });
});
