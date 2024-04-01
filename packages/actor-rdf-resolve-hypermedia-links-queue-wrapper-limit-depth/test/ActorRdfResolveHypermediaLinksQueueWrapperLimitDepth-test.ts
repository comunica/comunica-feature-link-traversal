import type {
  IActionRdfResolveHypermediaLinksQueue,
  IActorRdfResolveHypermediaLinksQueueOutput,
} from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import type { Actor, IActorTest, Mediator } from '@comunica/core';
import { ActionContext, Bus } from '@comunica/core';
import { KEY_CONTEXT_WRAPPED, LinkQueueLimitDepth } from '..';
import {
  ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth,
} from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth';

describe('ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth instance', () => {
    let actor: ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth;
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
      actor = new ActorRdfResolveHypermediaLinksQueueWrapperLimitDepth(
        { name: 'actor', bus, limit: 10, mediatorRdfResolveHypermediaLinksQueue },
      );
    });

    it('should test', async() => {
      await expect(actor.test({ firstUrl: 'first', context: new ActionContext() })).resolves.toBeTruthy();
    });

    it('should not test when called recursively', async() => {
      await expect(actor.test({
        firstUrl: 'first',
        context: new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: true,
        }),
      })).rejects.toThrow('Unable to wrap link queues multiple times');
    });

    it('should run', async() => {
      await expect(actor.run({ firstUrl: 'first', context: new ActionContext() })).resolves.toMatchObject({
        linkQueue: new LinkQueueLimitDepth(<any> 'inner', 10),
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
