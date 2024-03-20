import type { MediatorExtractLinks } from '@comunica/bus-extract-links';
import { Bus } from '@comunica/core';
import { ActorRdfMetadataExtractTraverse } from '../lib/ActorRdfMetadataExtractTraverse';

describe('ActorRdfMetadataExtractTraverse', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfMetadataExtractTraverse instance', () => {
    let mediatorExtractLinks: MediatorExtractLinks;
    let actor: ActorRdfMetadataExtractTraverse;

    beforeEach(() => {
      mediatorExtractLinks = <any> {
        mediate: jest.fn(() => ({
          links: [{ url: 'a' }],
          linksConditional: [{ url: 'b' }],
        })),
      };
      actor = new ActorRdfMetadataExtractTraverse({ name: 'actor', bus, mediatorExtractLinks });
    });

    it('should test', async() => {
      await expect(actor.test(<any> {})).resolves.toBe(true);
    });

    it('should run', async() => {
      await expect(actor.run(<any> {})).resolves.toEqual({
        metadata: {
          traverse: [{ url: 'a' }],
          traverseConditional: [{ url: 'b' }],
        },
      });
    });
  });
});
