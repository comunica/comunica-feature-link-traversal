import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfResolveHypermediaLinksTraverse } from '../lib/ActorRdfResolveHypermediaLinksTraverse';

describe('ActorRdfResolveHypermediaLinksTraverse', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfResolveHypermediaLinksTraverse module', () => {
    it('should be a function', () => {
      expect(ActorRdfResolveHypermediaLinksTraverse).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfResolveHypermediaLinksTraverse constructor', () => {
      expect(new (<any> ActorRdfResolveHypermediaLinksTraverse)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfResolveHypermediaLinksTraverse);
      expect(new (<any> ActorRdfResolveHypermediaLinksTraverse)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfResolveHypermediaLinks);
    });

    it('should not be able to create new ActorRdfResolveHypermediaLinksTraverse objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfResolveHypermediaLinksTraverse)(); }).toThrow();
    });
  });

  describe('An ActorRdfResolveHypermediaLinksTraverse instance', () => {
    let actor: ActorRdfResolveHypermediaLinksTraverse;

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksTraverse({ name: 'actor', bus });
    });

    it('should fail to test with empty metadata', () => {
      return expect(actor.test({ context: new ActionContext(), metadata: {}})).rejects
        .toThrow(new Error('Actor actor requires a \'traverse\' metadata entry.'));
    });

    it('should test with traverse in metadata', () => {
      return expect(actor.test({ context: new ActionContext(), metadata: { traverse: true }}))
        .resolves.toEqual(true);
    });

    it('should fail to test when traverse is disable in the context', () => {
      return expect(actor.test({ context: new ActionContext({
        [ActorRdfResolveHypermediaLinksTraverse.CONTEXT_KEY_TRAVERSE.name]: false,
      }),
      metadata: { traverse: true }})).rejects
        .toThrow(new Error('Link traversal has been disabled via the context.'));
    });

    it('should run', () => {
      return expect(actor.run({ context: new ActionContext(), metadata: { traverse: [{ url: 'a' }, { url: 'b' }]}}))
        .resolves.toMatchObject({ links: [{ url: 'a' }, { url: 'b' }]});
    });

    it('should run and remove hashes from URLs', () => {
      return expect(actor.run({ context: new ActionContext(),
        metadata: { traverse: [
          { url: 'http://example.org?abc' },
          { url: 'http://example.org#abc' },
        ]}}))
        .resolves.toMatchObject({ links: [
          { url: 'http://example.org?abc' },
          { url: 'http://example.org' },
        ]});
    });
  });
});
