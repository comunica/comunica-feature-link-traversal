import { LinkQueuePriority } from '../lib';

describe('LinkQueueFifo', () => {
  let queue: LinkQueuePriority;

  beforeEach(() => {
    queue = new LinkQueuePriority();
  });

  describe('push', () => {
    it('increases the internal array size', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 1 });
      queue.push({ url: 'c', priority: 2 });
      expect(queue.links).toEqual([
        { url: 'c', priority: 2, index: 0 },
        { url: 'a', priority: 0, index: 1 },
        { url: 'b', priority: 1, index: 2 },
      ]);
    });
    it('maintains max-heap property', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      queue.push({ url: 'd', priority: 4 });
      queue.push({ url: 'e', priority: 2 });
      queue.push({ url: 'f', priority: 7 });
      expect(queue.links).toEqual([
        { url: 'f', priority: 7, index: 0 },
        { url: 'd', priority: 4, index: 1 },
        { url: 'c', priority: 5, index: 2 },
        { url: 'a', priority: 0, index: 3 },
        { url: 'e', priority: 2, index: 4 },
        { url: 'b', priority: 3, index: 5 },
      ]);
    });
  });

  describe('getSize', () => {
    it('checks the internal array size', () => {
      expect(queue.getSize()).toEqual(0);
      expect(queue.push({ url: 'a', priority: 0, index: 0 })).toBeTruthy();
      expect(queue.getSize()).toEqual(1);
      expect(queue.push({ url: 'b', priority: 0, index: 0 })).toBeTruthy();
      expect(queue.getSize()).toEqual(2);
      expect(queue.push({ url: 'c', priority: 0, index: 0 })).toBeTruthy();
      expect(queue.getSize()).toEqual(3);
    });
  });

  describe('isEmpty', () => {
    it('checks the internal array size', () => {
      expect(queue.isEmpty()).toBeTruthy();
      expect(queue.push({ url: 'a', priority: 0, index: 0 })).toBeTruthy();
      expect(queue.isEmpty()).toBeFalsy();
      expect(queue.push({ url: 'b', priority: 0, index: 0 })).toBeTruthy();
      expect(queue.isEmpty()).toBeFalsy();
      expect(queue.push({ url: 'c', priority: 0, index: 0 })).toBeTruthy();
      expect(queue.isEmpty()).toBeFalsy();
    });
  });

  describe('pop', () => {
    it('reduces internal array size', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      queue.push({ url: 'd', priority: 4 });
      queue.push({ url: 'e', priority: 2 });
      queue.push({ url: 'f', priority: 7 });

      expect(queue.pop()).toEqual({ url: 'f', priority: 7, index: 0 });
      expect(queue.links).toEqual([
        { url: 'c', priority: 5, index: 0 },
        { url: 'd', priority: 4, index: 1 },
        { url: 'b', priority: 3, index: 2 },
        { url: 'a', priority: 0, index: 3 },
        { url: 'e', priority: 2, index: 4 },
      ]);

      expect(queue.pop()).toEqual({ url: 'c', priority: 5, index: 0 });
      expect(queue.links).toEqual([
        { url: 'd', priority: 4, index: 0 },
        { url: 'e', priority: 2, index: 1 },
        { url: 'b', priority: 3, index: 2 },
        { url: 'a', priority: 0, index: 3 },
      ]);

      expect(queue.pop()).toEqual({ url: 'd', priority: 4, index: 0 });
      expect(queue.links).toEqual([
        { url: 'b', priority: 3, index: 0 },
        { url: 'e', priority: 2, index: 1 },
        { url: 'a', priority: 0, index: 2 },
      ]);

      expect(queue.pop()).toEqual({ url: 'b', priority: 3, index: 0 });
      expect(queue.links).toEqual([
        { url: 'e', priority: 2, index: 0 },
        { url: 'a', priority: 0, index: 1 },
      ]);

      expect(queue.pop()).toEqual({ url: 'e', priority: 2, index: 0 });
      expect(queue.links).toEqual([
        { url: 'a', priority: 0, index: 0 },
      ]);

      expect(queue.pop()).toEqual({ url: 'a', priority: 0, index: 0 });
      expect(queue.links).toEqual([]);
    });
  });

  describe('increasePriority', () => {
    it('error on negative number', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      expect(() => queue.increasePriority(0, -1)).toThrowError(`Can only increase priority of links by non-zero postive number`);
    });

    it('error on invalid index', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      expect(() => queue.increasePriority(4, 3)).toThrowError(`Access invalid ILinkPriority in heap: undefined, undefined`);
    });

    it('increases priority link', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      queue.push({ url: 'd', priority: 4 });
      queue.push({ url: 'e', priority: 2 });
      queue.push({ url: 'f', priority: 7 });
      queue.increasePriority(2, 5);
      expect(queue.links[0]).toEqual({ url: 'c', priority: 10, index: 0 });
    });
    it('maintains max-heap property', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      queue.push({ url: 'd', priority: 4 });
      queue.push({ url: 'e', priority: 2 });
      queue.push({ url: 'f', priority: 7 });

      queue.increasePriority(queue.getSize() - 1, 3);
      expect(queue.links).toEqual([
        { url: 'f', priority: 7, index: 0 },
        { url: 'd', priority: 4, index: 1 },
        { url: 'b', priority: 6, index: 2 },
        { url: 'a', priority: 0, index: 3 },
        { url: 'e', priority: 2, index: 4 },
        { url: 'c', priority: 5, index: 5 },
      ]);
      queue.increasePriority(3, 10);
      expect(queue.links).toEqual([
        { url: 'a', priority: 10, index: 0 },
        { url: 'f', priority: 7, index: 1 },
        { url: 'b', priority: 6, index: 2 },
        { url: 'd', priority: 4, index: 3 },
        { url: 'e', priority: 2, index: 4 },
        { url: 'c', priority: 5, index: 5 },
      ]);
    });
  });

  describe('decreasePriority', () => {
    it('error on negative number', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      expect(() => queue.decreasePriority(0, -1)).toThrowError(`Can only decrease priority of links by non-zero postive number`);
    });

    it('error on invalid index', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      expect(() => queue.decreasePriority(4, 3)).toThrowError(`Access invalid ILinkPriority in heap: undefined, undefined`);
    });

    it('decreases priority link', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      queue.push({ url: 'd', priority: 4 });
      queue.push({ url: 'e', priority: 2 });
      queue.push({ url: 'f', priority: 7 });
      queue.decreasePriority(2, 5);
      expect(queue.links[queue.getSize() - 1]).toEqual({ url: 'c', priority: 0, index: queue.getSize() - 1 });
    });

    it('maintains max-heap property', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 3 });
      queue.push({ url: 'c', priority: 5 });
      queue.push({ url: 'd', priority: 4 });
      queue.push({ url: 'e', priority: 2 });
      queue.push({ url: 'f', priority: 7 });

      queue.decreasePriority(queue.getSize() - 1, 1);
      expect(queue.links).toEqual([
        { url: 'f', priority: 7, index: 0 },
        { url: 'd', priority: 4, index: 1 },
        { url: 'c', priority: 5, index: 2 },
        { url: 'a', priority: 0, index: 3 },
        { url: 'e', priority: 2, index: 4 },
        { url: 'b', priority: 2, index: 5 },
      ]);
      queue.decreasePriority(1, 3);
      expect(queue.links).toEqual([
        { url: 'f', priority: 7, index: 0 },
        { url: 'e', priority: 2, index: 1 },
        { url: 'c', priority: 5, index: 2 },
        { url: 'a', priority: 0, index: 3 },
        { url: 'd', priority: 1, index: 4 },
        { url: 'b', priority: 2, index: 5 },
      ]);
    });
  });

  describe('peek', () => {
    it('does not change internal array size', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.push({ url: 'b', priority: 1 });
      queue.push({ url: 'c', priority: 2 });

      expect(queue.peek()).toEqual({ url: 'c', priority: 2, index: 0 });
      expect(queue.links).toEqual([
        { url: 'c', priority: 2, index: 0 },
        { url: 'a', priority: 0, index: 1 },
        { url: 'b', priority: 1, index: 2 },
      ]);
    });
  });
  describe('upHeap', () => {
    it('throws on negative index', () => {
      expect(() => queue.upHeap(-1)).toThrowError(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on index > size of heap', () => {
      expect(() => queue.upHeap(1)).toThrowError(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on empty heap', () => {
      expect(() => queue.upHeap(0)).toThrowError(`Invalid index passed to upheap in priority queue`);
    });
    it('works on singleton heap', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.upHeap(0);
      expect(queue.links).toEqual([{ url: 'a', priority: 0, index: 0 }]);
    });
  });
  describe('downHeap', () => {
    it('throws on negative index', () => {
      expect(() => queue.downHeap(-1)).toThrowError(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on index > size of heap', () => {
      expect(() => queue.downHeap(1)).toThrowError(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on empty heap', () => {
      expect(() => queue.downHeap(0)).toThrowError(`Invalid index passed to upheap in priority queue`);
    });
    it('works on singleton heap', () => {
      queue.push({ url: 'a', priority: 0 });
      queue.downHeap(0);
      expect(queue.links).toEqual([{ url: 'a', priority: 0, index: 0 }]);
    });
  });
});
