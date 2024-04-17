import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';
import { LinkQueueLogger } from '../lib/LinkQueueLogger';

jest.mock('node:fs');

describe('LinkQueueFilterLinks', () => {
  const filePath = '';
  const query = 'foo';
  describe('constructor', () => {
    it('should construct', () => {
      const linkqueue: any = {
        isEmpty: () => true,
      };

      const expectedHistory = {
        iris_popped: [],
        iris_pushed: [],
        started_empty: true,
        query,
      };

      const wrapper = new LinkQueueLogger(linkqueue, filePath, query);

      expect(wrapper.filePath).toBe(filePath);
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
    });

    it('should construct with a link with filters', () => {
      const filterMap = new Map([[ 'foo', 'bar' ]]);
      const linkqueue: any = {
        filterMap,
        isEmpty: () => true,
      };
      const expectedHistory = {
        iris_popped: [],
        iris_pushed: [],
        started_empty: true,
        query,
      };

      const wrapper = new LinkQueueLogger(linkqueue, filePath, query);

      expect(wrapper.filePath).toBe(filePath);
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
    });

    it('should construct with a non empty link with filters', () => {
      const filterMap = new Map([[ 'foo', 'bar' ]]);
      const linkqueue: any = {
        filterMap,
        isEmpty: () => false,
      };
      const expectedHistory = {
        iris_popped: [],
        iris_pushed: [],
        started_empty: false,
        query,
      };

      const wrapper = new LinkQueueLogger(linkqueue, filePath, query);

      expect(wrapper.filePath).toBe(filePath);
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
    });
  });

  describe('push', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should push the history to a file if a new link is successfuly pushed', () => {
      const iri = {
        url: 'foo',
      };
      const linkQueue: any = {
        push: (_link: any, _parent: any) => true,
        isEmpty: () => true,
      };

      const expectedHistory = {
        iris_popped: [],
        iris_pushed: [{ url: iri.url, reachability_criteria: null, timestamp: 1 }],
        started_empty: true,
        query,
      };

      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, filePath, query);
      const resp = wrapper.push(iri, iri);

      expect(resp).toBe(true);
      expect(<jest.Mock>writeFileSync).toHaveBeenCalledTimes(1);
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
      expect(<jest.Mock>writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(expectedHistory));
    });

    it('should not push to the history to a file if a new link not successfuly pushed', () => {
      const iri = {
        url: 'foo',
      };
      const linkQueue: any = {
        push: (_link: any, _parent: any) => false,
        isEmpty: () => true,
      };

      const expectedHistory = {
        iris_popped: [],
        iris_pushed: [],
        started_empty: true,
        query,
      };

      const wrapper = new LinkQueueLogger(linkQueue, filePath, query);
      const resp = wrapper.push(iri, iri);

      expect(resp).toBe(false);
      expect(<jest.Mock>writeFileSync).not.toHaveBeenCalled();
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
    });

    it('should push the history adequatly with multiple push events', () => {
      let i = 0;
      const n = 10;
      const linkQueue: any = {
        push: (_link: any, _parent: any) => i % 2 === 0,
        isEmpty: () => false,
      };
      jest.spyOn(Date, 'now').mockImplementation(() => i);
      const wrapper = new LinkQueueLogger(linkQueue, filePath, query);
      const iris_pushed: any[] = [];
      for (; i < n; i++) {
        let iri: any = {
          url: String(i),
        };
        if (i % 4 === 0 && i !== 0) {
          iris_pushed.push({ url: String(i), reachability_criteria: 'abc', timestamp: i });
          iri = {
            url: String(i),
            metadata: { [PRODUCED_BY_ACTOR]: { name: 'abc' }},
          };
        } else if (i % 2 === 0) {
          iris_pushed.push({ url: String(i), reachability_criteria: null, timestamp: i });
        }
        const expectedHistory = {
          iris_popped: [],
          iris_pushed,
          started_empty: false,
          query,
        };

        const resp = wrapper.push(iri, iri);

        expect(resp).toBe(i % 2 === 0);
        expect(<jest.Mock>writeFileSync).toHaveBeenCalledTimes(Math.floor(i / 2) + 1);
        expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
        expect(<jest.Mock>writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(expectedHistory));
      }
    });
  });

  describe('pop', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should push the history if a new link is pop', () => {
      const iri = {
        url: 'foo',
      };
      const linkQueue: any = {
        pop: (_link: any, _parent: any) => iri,
        isEmpty: () => true,
      };

      const expectedHistory = {
        iris_popped: [{ url: iri.url, reachability_criteria: null, timestamp: 1 }],
        iris_pushed: [],
        started_empty: true,
        query,
      };
      jest.spyOn(Date, 'now').mockImplementation().mockReturnValueOnce(1);

      const wrapper = new LinkQueueLogger(linkQueue, filePath, query);
      const resp = wrapper.pop();

      expect(resp).toStrictEqual(iri);
      expect(<jest.Mock>writeFileSync).toHaveBeenCalledTimes(1);
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
      expect(<jest.Mock>writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(expectedHistory));
    });

    it('should not push the history to a file if pop return undefined', () => {
      const linkQueue: any = {
        pop() {},
        isEmpty: () => false,
      };

      const expectedHistory = {
        iris_popped: [],
        iris_pushed: [],
        started_empty: false,
        query,
      };

      const wrapper = new LinkQueueLogger(linkQueue, filePath, query);
      const resp = wrapper.pop();

      expect(resp).toBeUndefined();
      expect(<jest.Mock>writeFileSync).not.toHaveBeenCalled();
      expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
    });

    it('should push the history adequatly with multiple pop events', () => {
      let i = 0;
      const n = 10;
      const linkQueue: any = {
        pop() {
          let link: any;

          if (i % 4 === 0 && i !== 0) {
            link = {
              url: String(i),
              metadata: { [PRODUCED_BY_ACTOR]: { name: 'abc' }, timestamp: i },
            };
          } else if (i % 2 === 0) {
            link = { url: String(i), timestamp: i };
          }
          return link;
        },
        isEmpty: () => false,
      };
      jest.spyOn(Date, 'now').mockImplementation(() => i);
      const wrapper = new LinkQueueLogger(linkQueue, filePath, query);
      const iris_popped: any[] = [];
      for (; i < n; i++) {
        if (i % 4 === 0 && i !== 0) {
          iris_popped.push({ url: String(i), reachability_criteria: 'abc', timestamp: i });
        } else if (i % 2 === 0) {
          iris_popped.push({ url: String(i), reachability_criteria: null, timestamp: i });
        }
        const expectedHistory = {
          iris_popped,
          iris_pushed: [],
          started_empty: false,
          query,
        };
        let expectedLink: any;
        const resp = wrapper.pop();
        if (i % 4 === 0 && i !== 0) {
          expectedLink = { url: String(i), metadata: { [PRODUCED_BY_ACTOR]: { name: 'abc' }, timestamp: i }};
        } else if (i % 2 === 0) {
          expectedLink = { url: String(i), timestamp: i };
        }
        expect(resp).toStrictEqual(expectedLink);
        expect(<jest.Mock>writeFileSync).toHaveBeenCalledTimes(Math.floor(i / 2) + 1);
        expect(wrapper.getHistory()).toStrictEqual(expectedHistory);
        expect(<jest.Mock>writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(expectedHistory));
      }
    });
  });
});
