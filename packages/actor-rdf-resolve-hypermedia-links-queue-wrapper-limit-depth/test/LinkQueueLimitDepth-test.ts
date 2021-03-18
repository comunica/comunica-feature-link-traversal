import type { ILinkQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { LinkQueueLimitDepth } from '..';

describe('LinkQueueLimitDepth', () => {
  let inner: ILinkQueue;
  let queue: LinkQueueLimitDepth;

  beforeEach(() => {
    inner = <any> {
      push: jest.fn(() => true),
    };
    queue = new LinkQueueLimitDepth(inner, 3);
  });

  describe('push', () => {
    it('invokes the inner queue', () => {
      expect(queue.push({ url: 'a' }, { url: 'parent' })).toBeTruthy();
      expect(inner.push).toHaveBeenCalledWith(
        { url: 'a', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 1 }},
        { url: 'parent', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 0 }},
      );
    });

    it('invokes the inner queue for empty metadatas', () => {
      expect(queue.push({ url: 'a', metadata: {}}, { url: 'parent', metadata: {}})).toBeTruthy();
      expect(inner.push).toHaveBeenCalledWith(
        { url: 'a', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 1 }},
        { url: 'parent', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 0 }},
      );
    });

    it('invokes the inner queue for given parent depth', () => {
      expect(queue.push(
        { url: 'a' },
        { url: 'parent', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 1 }},
      )).toBeTruthy();
      expect(inner.push).toHaveBeenCalledWith(
        { url: 'a', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 2 }},
        { url: 'parent', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 1 }},
      );
    });

    it('does not invoke the inner queue for a too high parent depth', () => {
      expect(queue.push(
        { url: 'a' },
        { url: 'parent', metadata: { 'actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth:depth': 3 }},
      )).toBeFalsy();
      expect(inner.push).not.toHaveBeenCalled();
    });
  });
});
