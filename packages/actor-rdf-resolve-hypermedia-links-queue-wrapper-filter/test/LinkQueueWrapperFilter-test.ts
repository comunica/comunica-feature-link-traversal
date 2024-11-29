import type { ILink, ILinkQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueWrapperFilter } from '../lib/LinkQueueWrapperFilter';

describe('LinkQueueWrapperFilter', () => {
  let queue: ILinkQueue;
  let links: ILink[];
  let wrapper: LinkQueueWrapperFilter;

  beforeEach(() => {
    links = [];
    queue = <any> {
      pop: jest.fn(() => links.shift()),
    };
    wrapper = new LinkQueueWrapperFilter(queue, [ link => link.url.startsWith('https://') ]);
  });

  describe('pop', () => {
    it('retrieves from the wrapped queue', () => {
      expect(queue.pop).not.toHaveBeenCalled();
      expect(wrapper.pop()).toBeUndefined();
      expect(queue.pop).toHaveBeenCalledTimes(1);
    });

    it('filters out links that are rejected by the filter functions', () => {
      const httpUri = { url: 'http://localhost' };
      const httpsUri = { url: 'https://localhost' };
      links.push(httpUri, httpsUri);
      expect(queue.pop).not.toHaveBeenCalled();
      expect(wrapper.pop()).toBe(httpsUri);
      expect(queue.pop).toHaveBeenCalledTimes(2);
    });
  });
});
