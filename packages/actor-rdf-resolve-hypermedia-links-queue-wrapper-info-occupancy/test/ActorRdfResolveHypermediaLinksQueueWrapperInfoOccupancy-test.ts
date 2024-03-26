import { KeysInitQuery } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import {
  ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy,
  KEY_CONTEXT_WRAPPED,
  KEY_QUERY_IDENTIFIER,
} from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy';
import { LinkQueueSaveOnDiskInfo } from '../lib/LinkQueueSaveOnDiskInfo';

describe('ActorRdfResolveHypermediaLinksQueueRdfResolveHypermediaLinkQueueWrapperDebugLinksInformation', () => {
  let bus: any;
  const filePath = 'bar.json';

  describe('ActorRdfResolveHypermediaLinkQueueWrapperDebugLinksInformation instance', () => {
    let actor: any;

    describe('test', () => {
      const mediatorRdfResolveHypermediaLinksQueue: any = {};
      beforeEach(() => {
        bus = new Bus({ name: 'bus' });
        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          filePath,
          mediatorRdfResolveHypermediaLinksQueue,
        });
      });

      it('should test', async() => {
        await expect(actor.test({ firstUrl: 'first', context: new ActionContext() })).resolves.toBe(true);
      });

      it('should not test when called recursively', async() => {
        await expect(actor.test({
          firstUrl: 'first',
          context: new ActionContext({
            [KEY_CONTEXT_WRAPPED.name]: true,
          }),
        })).rejects.toThrow('Unable to wrap link queues multiple times');
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
      });

      it('should rejects given the mediator promise is rejected', async() => {
        const mediator: any = {
          mediate: jest.fn().mockRejectedValueOnce(new Error('foo')),
        };

        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          filePath,
          mediatorRdfResolveHypermediaLinksQueue: mediator,
        });

        await expect(actor.run(action)).rejects.toBeInstanceOf(Error);
      });

      it(`should returns the link queue and 
      add the context wrapped flag in the context for multiple queries`, async() => {
        const mediator: any = {
          mediate: jest.fn().mockResolvedValue({ linkQueue }),
        };
        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          filePath,
          mediatorRdfResolveHypermediaLinksQueue: mediator,
        });

        jest.spyOn(action.context, 'get').mockImplementation((key: any) => {
          if (key.name === KEY_QUERY_IDENTIFIER.name) {
            return undefined;
          }
          if (key.name === KeysInitQuery.query.name) {
            return { q: true, metadata: { abc: 'dfg' }};
          }
          return undefined;
        });

        for (let i = 0; i < 10; ++i) {
          const expectedFilePath = `bar_${i}.json`;

          const expectedLinkQueueWrapper = new LinkQueueSaveOnDiskInfo(linkQueue, expectedFilePath, <any>{ q: true });

          await expect(actor.run(action)).resolves.toStrictEqual({ linkQueue: expectedLinkQueueWrapper });
          expect(action.context.set).toHaveBeenCalledTimes(i + 1);
          expect(action.context.set).toHaveBeenLastCalledWith(KEY_CONTEXT_WRAPPED, true);
        }
      });

      it(`should returns the link queue with the right path if a query identifier is defined
       and add the context wrapped flag in the context`, async() => {
        const mediator: any = {
          mediate: jest.fn().mockResolvedValueOnce({ linkQueue }),
        };

        actor = new ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy({
          name: 'actor',
          bus,
          filePath,
          mediatorRdfResolveHypermediaLinksQueue: mediator,
        });
        jest.spyOn(action.context, 'get').mockImplementation((key: any) => {
          if (key.name === KEY_QUERY_IDENTIFIER.name) {
            return 'Q1';
          }
          return 'foo';
        });
        const expectedFilePath = 'bar_Q1.json';

        const expectedLinkQueueWrapper = new LinkQueueSaveOnDiskInfo(linkQueue, expectedFilePath, 'Q1');

        await expect(actor.run(action)).resolves.toStrictEqual({ linkQueue: expectedLinkQueueWrapper });
        expect(action.context.set).toHaveBeenCalledTimes(1);
        expect(action.context.set).toHaveBeenLastCalledWith(KEY_CONTEXT_WRAPPED, true);
      });
    });
  });
});
