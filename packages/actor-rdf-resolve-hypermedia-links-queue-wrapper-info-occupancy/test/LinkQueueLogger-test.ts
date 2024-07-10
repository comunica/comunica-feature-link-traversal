import { LinkQueueLogger } from '../lib/LinkQueueLogger';

Object.defineProperty(globalThis, 'performance', {
  writable: true,
});

globalThis.performance = <any>{ now: jest.fn() };
jest.spyOn(globalThis.performance, 'now').mockImplementation();

const PRODUCED_BY_ACTOR = 'producedByActor';
const LINK_QUEUE_EVENT_NAME = 'Link queue changed';

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

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, iri);

      expect(resp).toBe(true);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: 'push',
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
          push: { [reachabilityCriteria]: 1 },
          pop: {},
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LINK_QUEUE_EVENT_NAME);
      expect(logger.trace.mock.calls[0][1].data).toStrictEqual(expectedEvent);
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

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, parent);

      expect(resp).toBe(true);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: 'push',
        link: {
          url: 'foo',
          timestamp: 1,
          parent: 'bar',
          [PRODUCED_BY_ACTOR]: undefined,
        },
        query,
        queue: {
          size: queueSize,
          push: { unknown: 1 },
          pop: {},

        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LINK_QUEUE_EVENT_NAME);
      expect(logger.trace.mock.calls[0][1].data).toStrictEqual(expectedEvent);
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

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.push(iri, parent);

      expect(resp).toBe(true);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: 'push',
        link: {
          url: 'foo',
          timestamp: 1,
          [PRODUCED_BY_ACTOR]: undefined,
          parent: 'bar',
        },
        query,
        queue: {
          size: queueSize,
          push: { unknown: 1 },
          pop: {},
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LINK_QUEUE_EVENT_NAME);
      expect(logger.trace.mock.calls[0][1].data).toStrictEqual(expectedEvent);
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

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

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
      jest.spyOn(performance, 'now').mockImplementation(() => i);
      const wrapper = new LinkQueueLogger(linkQueue, query, logger);

      const reachabilityRatio = {
        push: {},
        pop: {},
      };
      for (; i < n; i++) {
        let iri: any;
        let parent: any;
        let currentEvent: any = {};
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
          if (reachabilityRatio.push[reachabilityCriteria]) {
            reachabilityRatio.push[reachabilityCriteria] += 1;
          } else {
            reachabilityRatio.push[reachabilityCriteria] = 1;
          }
          currentEvent = {
            type: 'push',
            link: {
              url: String(i),
              timestamp: i,
              producedByActor: {
                metadata: undefined,
                name: reachabilityCriteria,
              },
              parent: String(i - 1),
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          };
        } else if (i % 2 === 0) {
          iri = {
            url: String(i),
          };

          parent = iri;
          if (reachabilityRatio.push.unknown) {
            reachabilityRatio.push.unknown += 1;
          } else {
            reachabilityRatio.push.unknown = 1;
          }
          currentEvent = {
            type: 'push',
            link: {
              url: String(i),
              timestamp: i,
              [PRODUCED_BY_ACTOR]: undefined,
              parent: String(i),
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          };
        }

        const resp = wrapper.push(iri, parent);
        expect(resp).toBe(i % 2 === 0);

        if (i % 2 === 0) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(logger.trace.mock.calls.at(-1)[0]).toBe(LINK_QUEUE_EVENT_NAME);
          // eslint-disable-next-line jest/no-conditional-expect
          expect(logger.trace.mock.calls.at(-1)[1].data).toStrictEqual(currentEvent);
        }
      }

      expect(logger.trace).toHaveBeenCalledTimes(Math.floor(n / 2));
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

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.pop();

      expect(resp).toBe(iri);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: 'pop',
        link: {
          parent: undefined,
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
          push: {},
          pop: { [reachabilityCriteria]: 1 },
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LINK_QUEUE_EVENT_NAME);
      expect(logger.trace.mock.calls[0][1].data).toStrictEqual(expectedEvent);
    });

    it('should not log the event if no link are popped', () => {
      const linkQueue: any = {
        pop: jest.fn(),
        isEmpty: () => true,
      };

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

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

      jest.spyOn(performance, 'now').mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      const resp = wrapper.pop();

      expect(resp).toBe(iri);

      expect(logger.trace).toHaveBeenCalledTimes(1);
      const expectedEvent = {
        type: 'pop',
        link: {
          url: 'foo',
          timestamp: 1,
          parent: undefined,
          [PRODUCED_BY_ACTOR]: undefined,
        },
        query,
        queue: {
          size: queueSize,
          push: {},
          pop: { unknown: 1 },
        },
      };

      expect(logger.trace.mock.calls[0][0]).toBe(LINK_QUEUE_EVENT_NAME);
      expect(logger.trace.mock.calls[0][1].data).toStrictEqual(expectedEvent);
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

      jest.spyOn(performance, 'now').mockImplementation(() => i);
      const wrapper = new LinkQueueLogger(linkQueue, query, logger);
      let expectedLink: any;
      const reachabilityRatio = {
        push: {},
        pop: {},
      };
      for (; i < n; i++) {
        let currentEvent: any = {};
        if (i % 4 === 0 && i !== 0) {
          expectedLink = {
            url: String(i),
            metadata: {
              [PRODUCED_BY_ACTOR]: {
                name: reachabilityCriteria,
              },
            },
          };
          if (reachabilityRatio.pop[reachabilityCriteria]) {
            reachabilityRatio.pop[reachabilityCriteria] += 1;
          } else {
            reachabilityRatio.pop[reachabilityCriteria] = 1;
          }
          currentEvent = {
            type: 'pop',
            link: {
              url: String(i),
              timestamp: i,
              producedByActor: {
                name: reachabilityCriteria,
                metadata: undefined,
              },
              parent: undefined,
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          };
        } else if (i % 2 === 0) {
          expectedLink = { url: String(i) };
          if (reachabilityRatio.pop.unknown) {
            reachabilityRatio.pop.unknown += 1;
          } else {
            reachabilityRatio.pop.unknown = 1;
          }
          currentEvent = {
            type: 'pop',
            link: {
              url: String(i),
              [PRODUCED_BY_ACTOR]: undefined,
              parent: undefined,
              timestamp: i,
            },
            query,
            queue: {
              size: i,
              ...JSON.parse(JSON.stringify(reachabilityRatio)),
            },
          };
        } else {
          expectedLink = undefined;
        }
        const resp = wrapper.pop();
        expect(resp).toStrictEqual(expectedLink);

        if (i % 2 === 0) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(logger.trace.mock.calls.at(-1)[0]).toBe(LINK_QUEUE_EVENT_NAME);
          // eslint-disable-next-line jest/no-conditional-expect
          expect(logger.trace.mock.calls.at(-1)[1].data).toStrictEqual(currentEvent);
        }
      }
    });
  });
});
