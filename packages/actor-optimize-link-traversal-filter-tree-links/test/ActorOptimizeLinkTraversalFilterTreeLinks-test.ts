import { Bus } from '@comunica/core';
import type { ActorOptimizeLinkTraversalFilterTreeLinks } from '../lib/ActorOptimizeLinkTraversalFilterTreeLinks';

describe('ActorOptimizeLinkTraversalFilterTreeLinks', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeLinkTraversalFilterTreeLinks instance', () => {
    let actor: ActorOptimizeLinkTraversalFilterTreeLinks;

    beforeEach(() => {
      // Actor = new ActorOptimizeLinkTraversalFilterTreeLinks({ name: 'actor', bus });
    });

    it('should test', () => {
      // Return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      // Return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
