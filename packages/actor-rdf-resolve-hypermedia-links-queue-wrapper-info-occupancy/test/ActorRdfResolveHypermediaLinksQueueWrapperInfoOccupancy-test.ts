import { KeysCore } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import {
  ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy,
  KEY_CONTEXT_WRAPPED,
} from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy';
import { LinkQueueLogger } from '../lib/LinkQueueLogger';
import '@comunica/utils-jest';

describe('ActorRdfResolveHypermediaLinksQueueRdfResolveHypermediaLinkQueueWrapperDebugLinksInformation', () => {
  let bus: any;

  describe('ActorRdfResolveHypermediaLinkQueueWrapperDebugLinksInformation instance', () => {
    let actor: any;

    describe('test', () => {
      const mediatorRdfResolveHypermediaLinksQueue: any = {};
      beforeEach(() => {
        bus = new Bus({ name: 'bus' });
        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          mediatorRdfResolveHypermediaLinksQueue,
        });
      });

      it('should test', async() => {
        const context = new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: false,
          [KeysCore.log.name]: jest.fn(),
        });
        await expect(actor.test({ firstUrl: 'first', context })).resolves.toPassTestVoid();
      });

      it('should not test when there is no logger', async() => {
        const context = new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: false,
        });
        await expect(actor.test({ firstUrl: 'first', context }))
          .resolves.toFailTest('A logger is required when reporting link queue occupancy');
      });

      it('should not test when called recursively', async() => {
        await expect(actor.test({
          firstUrl: 'first',
          context: new ActionContext({
            [KEY_CONTEXT_WRAPPED.name]: true,
          }),
        })).resolves.toFailTest('Unable to wrap link queues multiple times');
      });
    });

    describe('run', () => {
      let action: any;
      const linkQueue: any = {
        isEmpty: () => true,
      };

      beforeEach(() => {
        action = {
          context: {
            set: jest.fn(),
            get: jest.fn().mockReturnValue('foo'),
          },
        };
        bus = new Bus({ name: 'bus' });
      });

      it('should rejects given the mediator promise is rejected', async() => {
        const mediator: any = {
          mediate: jest.fn().mockRejectedValueOnce(new Error('foo')),
        };

        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          mediatorRdfResolveHypermediaLinksQueue: mediator,
        });

        await expect(actor.run(action)).rejects.toBeInstanceOf(Error);
      });

      it(`should returns the link queue and add the context wrapped flag in the context given a query with metadata`, async() => {
        const mediator: any = {
          mediate: jest.fn().mockResolvedValue({ linkQueue }),
        };
        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          mediatorRdfResolveHypermediaLinksQueue: mediator,
        });

        const expectedLinkQueueWrapper = new LinkQueueLogger(linkQueue, <any>'foo');

        await expect(actor.run(action)).resolves.toEqual({ linkQueue: expectedLinkQueueWrapper });
        expect(action.context.set).toHaveBeenCalledTimes(1);
        expect(action.context.set).toHaveBeenLastCalledWith(KEY_CONTEXT_WRAPPED, true);
      });

      it(`should returns the link queue and add the context wrapped flag in the context given a query`, async() => {
        const mediator: any = {
          mediate: jest.fn().mockResolvedValue({ linkQueue }),
        };
        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          mediatorRdfResolveHypermediaLinksQueue: mediator,
        });

        const expectedLinkQueueWrapper = new LinkQueueLogger(linkQueue, <any>'foo');

        await expect(actor.run(action)).resolves.toEqual({ linkQueue: expectedLinkQueueWrapper });
        expect(action.context.set).toHaveBeenCalledTimes(1);
        expect(action.context.set).toHaveBeenLastCalledWith(KEY_CONTEXT_WRAPPED, true);
      });
    });
  });
});
