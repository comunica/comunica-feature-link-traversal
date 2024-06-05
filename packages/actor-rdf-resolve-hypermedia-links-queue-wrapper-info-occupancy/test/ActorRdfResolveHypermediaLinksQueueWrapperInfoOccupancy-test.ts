import { KeysInitQuery } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import { LoggerPretty } from '@comunica/logger-pretty';
import {
  ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy,
  KEY_CONTEXT_WRAPPED,
} from '../lib/ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy';
import { LinkQueueLogger } from '../lib/LinkQueueLogger';

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

        const query = { q: true, metadata: { abc: 'dfg' }};

        jest.spyOn(action.context, 'get').mockImplementation((key: any) => {
          if (key.name === KeysInitQuery.query.name) {
            return query;
          }
          return undefined;
        });

        const logger = new LoggerPretty({ level: 'trace' });

        const queryWithoutMetadata = JSON.parse(JSON.stringify(query, (key, value) => {
          if (key === 'metadata') {
            return;
          }
          return value;
        }));

        const expectedLinkQueueWrapper = new LinkQueueLogger(linkQueue, queryWithoutMetadata, logger);

        await expect(actor.run(action)).resolves.toStrictEqual({ linkQueue: expectedLinkQueueWrapper });
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

        const query = { q: true };

        jest.spyOn(action.context, 'get').mockImplementation((key: any) => {
          if (key.name === KeysInitQuery.query.name) {
            return query;
          }
          return undefined;
        });

        const logger = new LoggerPretty({ level: 'trace' });

        const expectedLinkQueueWrapper = new LinkQueueLogger(linkQueue, query, logger);

        await expect(actor.run(action)).resolves.toStrictEqual({ linkQueue: expectedLinkQueueWrapper });
        expect(action.context.set).toHaveBeenCalledTimes(1);
        expect(action.context.set).toHaveBeenLastCalledWith(KEY_CONTEXT_WRAPPED, true);
      });
    });
  });
});
