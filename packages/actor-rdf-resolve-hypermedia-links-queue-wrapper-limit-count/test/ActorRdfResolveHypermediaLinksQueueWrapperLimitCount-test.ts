import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Actor, IActorTest, Mediator } from '@comunica/core';
import { ActionContext, Bus } from '@comunica/core';
import { KEY_CONTEXT_WRAPPED, LinkQueueLimitCount } from '..';
import {
  ActorRdfResolveHypermediaLinksQueueWrapperLimitCount,
} from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperLimitCount';
import '@comunica/utils-jest';

describe('ActorRdfResolveHypermediaLinksQueueWrapperLimitCount', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveHypermediaLinksQueueWrapperLimitCount instance', () => {
    let actor: ActorRdfResolveHypermediaLinksQueueWrapperLimitCount;
    let mediatorRdfResolveHypermediaLinksQueue: Mediator<
    Actor<IActionRdfResolveHypermediaLinksQueue, IActorTest, IActorRdfResolveHypermediaLinksQueueOutput>,
    IActionRdfResolveHypermediaLinksQueue,
IActorTest,
IActorRdfResolveHypermediaLinksQueueOutput
>;

    beforeEach(() => {
      mediatorRdfResolveHypermediaLinksQueue = <any> {
        mediate: jest.fn(() => ({ linkQueue: 'inner' })),
      };
      actor = new ActorRdfResolveHypermediaLinksQueueWrapperLimitCount(
        { name: 'actor', bus, limit: 10, mediatorRdfResolveHypermediaLinksQueue },
      );
    });

    it('should test', async() => {
      await expect(actor.test({ firstUrl: 'first', context: new ActionContext() })).resolves.toPassTestVoid();
    });

    it('should not test when called recursively', async() => {
      await expect(actor.test({
        firstUrl: 'first',
        context: new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: true,
        }),
      })).resolves.toFailTest('Unable to wrap link queues multiple times');
    });

    it('should run', async() => {
      await expect(actor.run({ firstUrl: 'first', context: new ActionContext() })).resolves.toMatchObject({
        linkQueue: new LinkQueueLimitCount(<any> 'inner', 10),
      });
      expect(mediatorRdfResolveHypermediaLinksQueue.mediate).toHaveBeenCalledWith({
        firstUrl: 'first',
        context: new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: true,
        }),
      });
    });
  });
});
