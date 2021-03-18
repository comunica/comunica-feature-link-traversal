import type { ILinkQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueLimitCount } from '..';

describe('LinkQueueLimitCount', () => {
  let inner: ILinkQueue;
  let queue: LinkQueueLimitCount;

  beforeEach(() => {
    inner = <any> {
      push: jest.fn(() => true),
    };
    queue = new LinkQueueLimitCount(inner, 3);
  });

  describe('push', () => {
    it('invokes the inner queue', () => {
      expect(queue.push({ url: 'a' }, { url: 'parent' })).toBeTruthy();
      expect(inner.push).toHaveBeenCalledWith({ url: 'a' }, { url: 'parent' });
    });

    it('only allows limit pushes', () => {
      expect(queue.push({ url: 'a' }, { url: 'parent' })).toBeTruthy();
      expect(queue.push({ url: 'b' }, { url: 'parent' })).toBeTruthy();
      expect(queue.push({ url: 'c' }, { url: 'parent' })).toBeTruthy();
      expect(queue.push({ url: 'd' }, { url: 'parent' })).toBeFalsy();
      expect(inner.push).toHaveBeenCalledWith({ url: 'a' }, { url: 'parent' });
      expect(inner.push).toHaveBeenCalledWith({ url: 'b' }, { url: 'parent' });
      expect(inner.push).toHaveBeenCalledWith({ url: 'c' }, { url: 'parent' });
      expect(inner.push).not.toHaveBeenCalledWith({ url: 'd' }, { url: 'parent' });
    });
  });
});
