import { ActionContext, Bus } from '@comunica/core';
import { LinkQueuePriority } from '../lib';
import { ActorRdfResolveHypermediaLinksQueuePriority } from '../lib/ActorRdfResolveHypermediaLinksQueuePriority';

describe('ActorRdfResolveHypermediaLinksQueueFifo', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveHypermediaLinksQueueFifo instance', () => {
    let actor: ActorRdfResolveHypermediaLinksQueuePriority;

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksQueuePriority({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ firstUrl: 'A', context: new ActionContext() }))
        .resolves.toEqual(true);
    });

    it('should run', () => {
      return expect(actor.run({ firstUrl: 'A', context: new ActionContext() }))
        .resolves.toEqual({ linkQueue: new LinkQueuePriority() });
    });
  });
});
