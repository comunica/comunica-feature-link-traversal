import {ActorRdfResolveHypermediaLinks} from "@comunica/bus-rdf-resolve-hypermedia-links";
import {Bus} from "@comunica/core";
import {ActorRdfResolveHypermediaLinksTraverse} from "../lib/ActorRdfResolveHypermediaLinksTraverse";

describe('ActorRdfResolveHypermediaLinksTraverse', () => {
  let bus;

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

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
