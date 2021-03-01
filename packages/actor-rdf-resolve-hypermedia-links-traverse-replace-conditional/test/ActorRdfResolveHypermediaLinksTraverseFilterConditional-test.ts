import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { Bus } from '@comunica/core';
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
      expect(() => { (<any> ActorRdfResolveHypermediaLinksTraverseReplaceConditional)(); }).toThrow();
    });
  });

  describe('An ActorRdfResolveHypermediaLinksTraverseReplaceConditional instance', () => {
    let mediatorRdfResolveHypermediaLinks: any;
    let actor: ActorRdfResolveHypermediaLinksTraverseReplaceConditional;

    beforeEach(() => {
      mediatorRdfResolveHypermediaLinks = {
        async mediate(arg: any) {
          return arg;
        },
      };
      actor = new ActorRdfResolveHypermediaLinksTraverseReplaceConditional(
        { name: 'actor', bus, mediatorRdfResolveHypermediaLinks },
      );
    });

    it('should fail to test with empty metadata', () => {
      return expect(actor.test({ metadata: {}})).rejects
        .toThrow(new Error('Actor actor requires a \'traverse\' metadata entry.'));
    });

    it('should fail to test without traverseConditional in metadata', () => {
      return expect(actor.test({ metadata: { traverse: true }})).rejects.toThrow();
    });

    it('should fail to test without traverse in metadata', () => {
      return expect(actor.test({ metadata: { traverseConditional: true }})).rejects.toThrow();
    });

    it('should test with traverse and traverseConditional in metadata', () => {
      return expect(actor.test({ metadata: { traverse: true, traverseConditional: true }})).resolves.toEqual(true);
    });

    it('should run with empty data', () => {
      const action = {
        metadata: {
          traverse: [],
          traverseConditional: [],
        },
      };
      return expect(actor.run(action)).resolves.toEqual({
        metadata: {
          traverse: [],
        },
      });
    });

    it('should run with empty traverseConditional', () => {
      const action = {
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b' },
            { url: 'c' },
          ],
          traverseConditional: [],
        },
      };
      return expect(actor.run(action)).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b' },
            { url: 'c' },
          ],
        },
      });
    });

    it('should run', () => {
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
      };
      return expect(actor.run(action)).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'a' },
            { url: 'b', context: 'C' },
            { url: 'c', context: 'C' },
          ],
        },
      });
    });
  });
});
