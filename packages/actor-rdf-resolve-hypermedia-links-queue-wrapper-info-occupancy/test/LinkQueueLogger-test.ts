import { EventType, LinkQueueLogger } from '../lib/LinkQueueLogger';

const PRODUCED_BY_ACTOR = 'producedByActor';

describe('LinkQueueFilterLinks', () => {
  const query = 'SELECT * {?s ?p ?o}';
  const logger: any = {
    warn: jest.fn(),
    trace: jest.fn(),
  };

  describe('constructor', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should construct', () => {
      const linkqueue: any = {
        isEmpty: () => {
          return false;
        },
      };

      expect(new LinkQueueLogger(linkqueue, query, logger)).toBeDefined();
    });
  });

  describe('push', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should log the event of a new link with reachability annotation pushed to the queue', () => {
      const reachabilityCriteria = 'reachability';

      const iri = {
        url: 'foo',
        metadata: {
          [PRODUCED_BY_ACTOR]: {
            name: reachabilityCriteria,
            extra: '',
            detail: true,
          },
        },
      };
      const queueSize = 23;
      const linkQueue: any = {
        push: jest.fn().mockReturnValueOnce(true),
        isEmpty: () => true,
        getSize: () => queueSize,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, iri);

      expect(resp).toBe(true);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: EventType[EventType.PUSH],
        link: {
          url: 'foo',
          producedByActor: {
            name: reachabilityCriteria,
            metadata: {
              extra: '',
              detail: true,
            },
          },
          timestamp: 1,
          parent: 'foo',
        },
        query,
        queue: {
          size: queueSize,
          pushEvent: { [reachabilityCriteria]: 1 },
          popEvent: {},
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
      expect(JSON.parse(logger.trace.mock.calls[0][1].data)).toStrictEqual(expectedEvent);
    });

    it('should log the event of a new link without reachability annotation pushed to the queue', () => {
      const reachabilityCriteria = '123';
      const iri = {
        url: 'foo',
        metadata: {},
      };

      const parent = {
        url: 'bar',
        metadata: {
          [PRODUCED_BY_ACTOR]: {
            name: reachabilityCriteria,
          },
        },
      };

      const queueSize = 2;
      const linkQueue: any = {
        push: jest.fn().mockReturnValueOnce(true),
        isEmpty: () => true,
        getSize: () => queueSize,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, parent);

      expect(resp).toBe(true);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: EventType[EventType.PUSH],
        link: {
          url: 'foo',
          timestamp: 1,
          producedByActor: null,
          parent: 'bar',
        },
        query,
        queue: {
          size: queueSize,
          pushEvent: { unknown: 1 },
          popEvent: {},

        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
      expect(JSON.parse(logger.trace.mock.calls[0][1].data)).toStrictEqual(expectedEvent);
    });

    it(`should log the event of a new link without reachability annotation 
      but with linked metadata pushed to the queue`, () => {
      const reachabilityCriteria = '123';
      const iri = {
        url: 'foo',
        metadata: {
          [PRODUCED_BY_ACTOR]: {
            extra: '',
            detail: true,
          },
        },
      };

      const parent = {
        url: 'bar',
        metadata: {
          [PRODUCED_BY_ACTOR]: {
            name: reachabilityCriteria,
          },
        },
      };

      const queueSize = 2;
      const linkQueue: any = {
        push: jest.fn().mockReturnValueOnce(true),
        isEmpty: () => true,
        getSize: () => queueSize,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, parent);

      expect(resp).toBe(true);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: EventType[EventType.PUSH],
        link: {
          url: 'foo',
          timestamp: 1,
          producedByActor: null,
          parent: 'bar',
        },
        query,
        queue: {
          size: queueSize,
          pushEvent: { unknown: 1 },
          popEvent: {},
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
      expect(JSON.parse(logger.trace.mock.calls[0][1].data)).toStrictEqual(expectedEvent);
    });

    it('should not push to the history to a file if a new link not successfuly pushed', () => {
      const reachabilityCriteria = 'reachability';

      const iri = {
        url: 'foo',
        metadata: {
          [PRODUCED_BY_ACTOR]: {
            name: reachabilityCriteria,
          },
        },
      };
      const linkQueue: any = {
        push: jest.fn().mockReturnValueOnce(false),
        isEmpty: () => true,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, iri);

      expect(resp).toBe(false);

      expect(logger.trace).not.toHaveBeenCalled();
    });

    it('should push the history adequatly with multiple push events', () => {
      const reachabilityCriteria = 'reachability';

      let i = 0;
      const n = 10;
      const linkQueue: any = {
        push: (_link: any, _parent: any) => i % 2 === 0,
        isEmpty: () => true,
        getSize: () => i,
      };
      jest.spyOn(Date, 'now').mockImplementation(() => i);
      const wrapper = new LinkQueueLogger(linkQueue, query, logger);

      const eventHistory: any[] = [];
      const reachabilityRatio = {
        pushEvent: {},
        popEvent: {},
      };
      reachabilityRatio.pushEvent.unknown = 0;

      for (; i < n; i++) {
        let iri: any;
        let parent: any;
        if (i % 4 === 0 && i !== 0) {
          iri = {
            url: String(i),
            metadata: {
              [PRODUCED_BY_ACTOR]: {
                name: reachabilityCriteria,
              },
            },
          };

          parent = {
            url: String(i - 1),
            metadata: {
              [PRODUCED_BY_ACTOR]: {
                name: `${reachabilityCriteria}_${i}`,
              },
            },
          };
          reachabilityRatio.pushEvent[reachabilityCriteria] = 1;
          eventHistory.push({
            type: EventType[EventType.PUSH],
            link: {
              url: String(i),
              timestamp: i,
              producedByActor: {
                name: reachabilityCriteria,
              },
              parent: String(i - 1),
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          });
        } else if (i % 2 === 0) {
          iri = {
            url: String(i),
          };

          parent = iri;
          reachabilityRatio.pushEvent.unknown += 1;
          eventHistory.push({
            type: EventType[EventType.PUSH],
            link: {
              url: String(i),
              timestamp: i,
              producedByActor: null,
              parent: String(i),
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          });
        }

        const resp = wrapper.push(iri, parent);
        expect(resp).toBe(i % 2 === 0);
      }

      expect(logger.trace).toHaveBeenCalledTimes(Math.floor(n / 2));
      for (let j = 1; j < Math.floor(n / 2); ++j) {
        expect(logger.trace.mock.calls[j - 1][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
        expect(JSON.parse(logger.trace.mock.calls[j - 1][1].data)).toStrictEqual(eventHistory[j - 1]);
      }
    });
  });

  describe('pop', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should log the event of a new link with reachability annotation popped from the queue', () => {
      const reachabilityCriteria = 'reachability';

      const iri = {
        url: 'foo',
        metadata: {
          [PRODUCED_BY_ACTOR]: {
            name: reachabilityCriteria,
            extra: '',
            detail: true,
          },
        },
      };
      const queueSize = 23;
      const linkQueue: any = {
        pop: jest.fn().mockReturnValueOnce(iri),
        isEmpty: () => true,
        getSize: () => queueSize,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.pop();

      expect(resp).toBe(iri);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: EventType[EventType.POP],
        link: {
          url: 'foo',
          producedByActor: {
            name: reachabilityCriteria,
            metadata: {
              extra: '',
              detail: true,
            },
          },
          timestamp: 1,
        },
        query,
        queue: {
          size: queueSize,
          pushEvent: {},
          popEvent: { [reachabilityCriteria]: 1 },
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
      expect(JSON.parse(logger.trace.mock.calls[0][1].data)).toStrictEqual(expectedEvent);
    });

    it('should not log the event if no link are popped', () => {
      const linkQueue: any = {
        pop: jest.fn(),
        isEmpty: () => true,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      wrapper.pop();

      expect(logger.trace).not.toHaveBeenCalled();
    });

    it('should log the event of a new link without reachability without annotation popped to the queue', () => {
      const iri = {
        url: 'foo',
      };

      const queueSize = 23;
      const linkQueue: any = {
        pop: jest.fn().mockReturnValueOnce(iri),
        isEmpty: () => true,
        getSize: () => queueSize,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.pop();

      expect(resp).toBe(iri);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: EventType[EventType.POP],
        link: {
          url: 'foo',
          timestamp: 1,
          producedByActor: null,
        },
        query,
        queue: {
          size: queueSize,
          pushEvent: {},
          popEvent: { unknown: 1 },
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
      expect(JSON.parse(logger.trace.mock.calls[0][1].data)).toStrictEqual(expectedEvent);
    });

    it('should log the events of multiple links popped out of the queue', () => {
      const reachabilityCriteria = 'reachability';

      let i = 0;
      const n = 10;
      const linkQueue: any = {
        pop() {
          let link: any;

          if (i % 4 === 0 && i !== 0) {
            link = {
              url: String(i),
              metadata: {
                [PRODUCED_BY_ACTOR]: {
                  name: reachabilityCriteria,
                },
              },
            };
          } else if (i % 2 === 0) {
            link = { url: String(i) };
          }
          return link;
        },
        isEmpty: () => false,
        getSize: () => i,
      };

      jest.spyOn(Date, 'now').mockImplementation(() => i);
      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      let expectedLink: any;
      const eventHistory: any = [];
      const reachabilityRatio = {
        pushEvent: {},
        popEvent: {},
      };
      reachabilityRatio.popEvent.unknown = 0;
      for (; i < n; i++) {
        if (i % 4 === 0 && i !== 0) {
          expectedLink = {
            url: String(i),
            metadata: {
              [PRODUCED_BY_ACTOR]: {
                name: reachabilityCriteria,
              },
            },
          };
          reachabilityRatio.popEvent[reachabilityCriteria] = 1;
          const expectedLinkStatisticLink = {
            type: EventType[EventType.POP],
            link: {
              url: String(i),
              timestamp: i,
              producedByActor: {
                name: reachabilityCriteria,
              },
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          };
          eventHistory.push(expectedLinkStatisticLink);
        } else if (i % 2 === 0) {
          expectedLink = { url: String(i) };
          reachabilityRatio.popEvent.unknown += 1;
          const expectedLinkStatisticLink = {
            type: EventType[EventType.POP],
            link: {
              url: String(i),
              producedByActor: null,
              timestamp: i,
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          };
          eventHistory.push(expectedLinkStatisticLink);
        } else {
          expectedLink = undefined;
        }
        const resp = wrapper.pop();
        expect(resp).toStrictEqual(expectedLink);
      }

      expect(logger.trace).toHaveBeenCalledTimes(Math.floor(n / 2));
      for (let j = 1; j < Math.floor(n / 2); ++j) {
        expect(logger.trace.mock.calls[j - 1][0]).toBe(LinkQueueLogger.LINK_QUEUE_EVENT_NAME);
        expect(JSON.parse(logger.trace.mock.calls[j - 1][1].data)).toStrictEqual(eventHistory[j - 1]);
      }
    });
  });
});
