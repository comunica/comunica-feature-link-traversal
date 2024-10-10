import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysQuerySourceIdentify } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfResolveHypermediaLinksTraverse } from '../lib/ActorRdfResolveHypermediaLinksTraverse';
import '@comunica/utils-jest';

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
      expect(() => {
        (<any> ActorRdfResolveHypermediaLinksTraverse)();
      }).toThrow(`Class constructor ActorRdfResolveHypermediaLinksTraverse cannot be invoked without 'new'`);
    });
  });

  describe('An ActorRdfResolveHypermediaLinksTraverse instance', () => {
    let actor: ActorRdfResolveHypermediaLinksTraverse;

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksTraverse({ name: 'actor', bus });
    });

    it('should fail to test with empty metadata', async() => {
      await expect(actor.test({ context: new ActionContext(), metadata: {}})).resolves
        .toFailTest('Actor actor requires a \'traverse\' metadata entry.');
    });

    it('should test with traverse in metadata', async() => {
      await expect(actor.test({ context: new ActionContext(), metadata: { traverse: true }}))
        .resolves.toPassTestVoid();
    });

    it('should fail to test when traverse is disable in the context', async() => {
      await expect(actor.test({ context: new ActionContext({
        [KeysQuerySourceIdentify.traverse.name]: false,
      }), metadata: { traverse: true }})).resolves
        .toFailTest('Link traversal has been disabled via the context.');
    });

    it('should run', async() => {
      await expect(actor.run({ context: new ActionContext(), metadata: { traverse: [{ url: 'a' }, { url: 'b' }]}}))
        .resolves.toMatchObject({ links: [{ url: 'a' }, { url: 'b' }]});
    });

    it('should run and remove hashes from URLs', async() => {
      await expect(actor.run({ context: new ActionContext(), metadata: { traverse: [
        { url: 'http://example.org?abc' },
        { url: 'http://example.org#abc' },
      ]}}))
        .resolves.toMatchObject({ links: [
          { url: 'http://example.org?abc' },
          { url: 'http://example.org' },
        ]});
    });

    it('should run and convert insecure links to https in the browser', async() => {
      globalThis.window = <any> { location: new URL('https://mywebapp.com') };
      actor = new ActorRdfResolveHypermediaLinksTraverse({ name: 'actor', bus });
      const result = actor.run({ context: new ActionContext(), metadata: { traverse: [
        { url: 'http://example.org?abc' },
        { url: 'http://example.org' },
      ]}});
      globalThis.window = <any> { location: new URL('http://localhost') };
      await expect(result)
        .resolves.toMatchObject({ links: [
          { url: 'https://example.org?abc' },
          { url: 'https://example.org' },
        ]});
    });

    it('should run and keep insecure links when running from an insecure context', async() => {
      globalThis.window = <any> { location: new URL('http://mywebapp.com') };
      actor = new ActorRdfResolveHypermediaLinksTraverse({ name: 'actor', bus });
      const result = actor.run({ context: new ActionContext(), metadata: { traverse: [
        { url: 'http://example.org?abc' },
        { url: 'http://example.org' },
      ]}});
      globalThis.window = <any> { location: new URL('http://localhost') };
      await expect(result)
        .resolves.toMatchObject({ links: [
          { url: 'http://example.org?abc' },
          { url: 'http://example.org' },
        ]});
    });

    it('should run and not convert insecure links to https when upgradeInsecureRequests is set to false', async() => {
      globalThis.window = <any> { location: new URL('https://mywebapp.com') };
      actor = new ActorRdfResolveHypermediaLinksTraverse({
        name: 'actor',
        bus,
        upgradeInsecureRequests: false,
      });
      const result = actor.run({ context: new ActionContext(), metadata: { traverse: [
        { url: 'http://example.org?abc' },
        { url: 'http://example.org' },
      ]}});
      globalThis.window = <any> { location: new URL('http://localhost') };
      await expect(result)
        .resolves.toMatchObject({ links: [
          { url: 'http://example.org?abc' },
          { url: 'http://example.org' },
        ]});
    });

    it('should run and convert insecure links to https when upgradeInsecureRequests is set to true', async() => {
      globalThis.window = <any> { location: new URL('http://mywebapp.com') };
      actor = new ActorRdfResolveHypermediaLinksTraverse({
        name: 'actor',
        bus,
        upgradeInsecureRequests: true,
      });
      const result = actor.run({ context: new ActionContext(), metadata: { traverse: [
        { url: 'http://example.org?abc' },
        { url: 'http://example.org' },
      ]}});
      globalThis.window = <any> { location: new URL('http://localhost') };
      await expect(result)
        .resolves.toMatchObject({ links: [
          { url: 'https://example.org?abc' },
          { url: 'https://example.org' },
        ]});
    });
  });
});
