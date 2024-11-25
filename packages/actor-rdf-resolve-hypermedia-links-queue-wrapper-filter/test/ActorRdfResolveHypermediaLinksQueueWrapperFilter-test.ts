import type { MediatorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import { ActionContext, Bus } from '@comunica/core';
import {
  ActorRdfResolveHypermediaLinksQueueWrapperFilter,
} from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperFilter';
import { LinkQueueWrapperFilter } from '../lib/LinkQueueWrapperFilter';
import '@comunica/utils-jest';

describe('ActorRdfResolveHypermediaLinksQueueWrapperFilter', () => {
  let bus: any;
  let mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
  let actor: ActorRdfResolveHypermediaLinksQueueWrapperFilter;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorRdfResolveHypermediaLinksQueue = <any> {
      mediate: jest.fn(() => ({ linkQueue: 'inner' })),
    };
    actor = new ActorRdfResolveHypermediaLinksQueueWrapperFilter({
      bus,
      name: 'actor',
      mediatorRdfResolveHypermediaLinksQueue,
    });
  });

  describe('test', () => {
    it('should accept', async() => {
      await expect(actor.test({
        firstUrl: 'first',
        context: new ActionContext({ [KeysRdfResolveHypermediaLinks.linkFilters.name]: []}),
      })).resolves.toPassTestVoid();
    });

    it('should reject with a missing filter list', async() => {
      await expect(actor.test({
        firstUrl: 'first',
        context: new ActionContext(),
      })).resolves.toFailTest('Unable to wrap link queue with missing filter list');
    });

    it('should reject when wrapped already', async() => {
      await expect(actor.test({
        firstUrl: 'first',
        context: new ActionContext({
          [(<any>ActorRdfResolveHypermediaLinksQueueWrapperFilter).keyWrapped.name]: true,
          [KeysRdfResolveHypermediaLinks.linkFilters.name]: [],
        }),
      })).resolves.toFailTest('Unable to wrap link queues multiple times');
    });
  });

  describe('run', () => {
    it('should execute successfully', async() => {
      await expect(actor.run({
        firstUrl: 'first',
        context: new ActionContext({ [KeysRdfResolveHypermediaLinks.linkFilters.name]: []}),
      })).resolves.toEqual({ linkQueue: expect.any(LinkQueueWrapperFilter) });
    });
  });
});
