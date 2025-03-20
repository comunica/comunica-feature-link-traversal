import { Bus } from '@comunica/core';
import { ActorRdfResolveHypermediaLinksQueueWrapperPrioritizeSparqlEndpoints } from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperPrioritizeSparqlEndpoints';

describe('ActorRdfResolveHypermediaLinksQueueWrapperPrioritizeSparqlEndpoints', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveHypermediaLinksQueueWrapperPrioritizeSparqlEndpoints instance', () => {
    let actor: ActorRdfResolveHypermediaLinksQueueWrapperPrioritizeSparqlEndpoints;

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksQueueWrapperPrioritizeSparqlEndpoints({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
