import { ActionContext, Bus } from '@comunica/core';
import { LinkQueuePriority } from '../lib';
import { ActorRdfResolveHypermediaLinksQueuePriority } from '../lib/ActorRdfResolveHypermediaLinksQueuePriority';
import '@comunica/utils-jest';

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

    it('should test', async() => {
      await expect(actor.test({ firstUrl: 'A', context: new ActionContext() }))
        .resolves.toPassTestVoid();
    });

    it('should run', async() => {
      await expect(actor.run({ firstUrl: 'A', context: new ActionContext() }))
        .resolves.toEqual({ linkQueue: new LinkQueuePriority() });
    });
  });
});
