import { KeysInitQuery, KeysCore } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import { translate, toSparql } from 'sparqlalgebrajs';
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
        const context = new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: false,
          [KeysCore.log.name]: jest.fn(),
        });
        await expect(actor.test({ firstUrl: 'first', context })).resolves.toBe(true);
      });

      it('should not test when there is no logger', async() => {
        const context = new ActionContext({
          [KEY_CONTEXT_WRAPPED.name]: false,
        });
        await expect(actor.test({ firstUrl: 'first', context }))
          .rejects.toThrow('A logger is required when reporting link queue occupancy');
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

        const query = toSparql(translate(`SELECT ?personId ?firstName ?lastName WHERE {
        <http://localhost:3000/pods/00000000000000000150/comments/Mexico#68719564521> <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/id> ?messageId.
        <http://localhost:3000/pods/00000000000000000150/comments/Mexico#68719564521> <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasCreator> ?creator.
        ?creator <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/id> ?personId.
        ?creator <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/firstName> ?firstName.
        ?creator <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/lastName> ?lastName.
        }`));

        const logger: any = jest.fn();

        jest.spyOn(action.context, 'get').mockImplementation((key: any) => {
          if (key.name === KeysInitQuery.query.name) {
            return translate(query);
          }
          if (key.name === KeysCore.log.name) {
            return logger;
          }
          return undefined;
        });

        const expectedLinkQueueWrapper = new LinkQueueLogger(linkQueue, query, logger);

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

        const query = toSparql(translate(`SELECT ?personId ?firstName ?lastName WHERE {
          <http://localhost:3000/pods/00000000000000000150/comments/Mexico#68719564521> <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/id> ?messageId.
          <http://localhost:3000/pods/00000000000000000150/comments/Mexico#68719564521> <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasCreator> ?creator.
          ?creator <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/id> ?personId.
          ?creator <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/firstName> ?firstName.
          ?creator <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/lastName> ?lastName.
          }`));

        const logger: any = jest.fn();
        jest.spyOn(action.context, 'get').mockImplementation((key: any) => {
          if (key.name === KeysInitQuery.query.name) {
            return translate(query);
          }
          if (key.name === KeysCore.log.name) {
            return logger;
          }
          return undefined;
        });

        const expectedLinkQueueWrapper = new LinkQueueLogger(linkQueue, query, logger);

        await expect(actor.run(action)).resolves.toStrictEqual({ linkQueue: expectedLinkQueueWrapper });
        expect(action.context.set).toHaveBeenCalledTimes(1);
        expect(action.context.set).toHaveBeenLastCalledWith(KEY_CONTEXT_WRAPPED, true);
      });
    });
  });
});
