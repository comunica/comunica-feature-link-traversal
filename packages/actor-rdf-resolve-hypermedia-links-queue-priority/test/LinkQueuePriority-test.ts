import { LinkQueuePriority } from '../lib';

describe('LinkQueuePriority', () => {
  let queue: LinkQueuePriority;

  beforeEach(() => {
    queue = new LinkQueuePriority();
  });

  describe('push', () => {
    it('increases the internal array size', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 1 }});
      queue.push({ url: 'c', metadata: { priority: 2 }});
      expect(queue.links).toEqual([
        { url: 'c', metadata: { priority: 2, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
        { url: 'b', metadata: { priority: 1, index: 2 }},
      ]);
    });
    it('maintains max-heap property', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      queue.push({ url: 'd', metadata: { priority: 4 }});
      queue.push({ url: 'e', metadata: { priority: 2 }});
      queue.push({ url: 'f', metadata: { priority: 7 }});

      expect(queue.links).toEqual([
        { url: 'f', metadata: { priority: 7, index: 0 }},
        { url: 'd', metadata: { priority: 4, index: 1 }},
        { url: 'c', metadata: { priority: 5, index: 2 }},
        { url: 'a', metadata: { priority: 0, index: 3 }},
        { url: 'e', metadata: { priority: 2, index: 4 }},
        { url: 'b', metadata: { priority: 3, index: 5 }},
      ]);
    });
    it('assigns correct index when incorrect index is supplied', () => {
      queue.push({ url: 'a', metadata: { priority: 0, index: 5 }});
      queue.push({ url: 'b', metadata: { priority: 3, index: -1 }});
      expect(queue.links).toEqual([
        { url: 'b', metadata: { priority: 3, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
      ]);
    });
    it('assigns zero priority when no priority is given', () => {
      queue.push({ url: 'a', metadata: { index: 5 }});
      queue.push({ url: 'b', metadata: { index: -1 }});
      expect(queue.links).toEqual([
        { url: 'a', metadata: { priority: 0, index: 0 }},
        { url: 'b', metadata: { priority: 0, index: 1 }},
      ]);
    });
    it('instantiates metadata object if no metadata is given', () => {
      queue.push({ url: 'a' });
      queue.push({ url: 'b' });
      expect(queue.links).toEqual([
        { url: 'a', metadata: { priority: 0, index: 0 }},
        { url: 'b', metadata: { priority: 0, index: 1 }},
      ]);
    });
  });

  describe('getSize', () => {
    it('checks the internal array size', () => {
      expect(queue.getSize()).toBe(0);
      expect(queue.push({ url: 'a', metadata: { priority: 0 }})).toBeTruthy();
      expect(queue.getSize()).toBe(1);
      expect(queue.push({ url: 'b', metadata: { priority: 0 }})).toBeTruthy();
      expect(queue.getSize()).toBe(2);
      expect(queue.push({ url: 'c', metadata: { priority: 0 }})).toBeTruthy();
      expect(queue.getSize()).toBe(3);
    });
  });

  describe('isEmpty', () => {
    it('checks the internal array size', () => {
      expect(queue.isEmpty()).toBeTruthy();
      expect(queue.push({ url: 'a', metadata: { priority: 0 }})).toBeTruthy();
      expect(queue.isEmpty()).toBeFalsy();
      expect(queue.push({ url: 'b', metadata: { priority: 0 }})).toBeTruthy();
      expect(queue.isEmpty()).toBeFalsy();
      expect(queue.push({ url: 'c', metadata: { priority: 0 }})).toBeTruthy();
      expect(queue.isEmpty()).toBeFalsy();
    });
  });

  describe('pop', () => {
    it('reduces internal array size', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      queue.push({ url: 'd', metadata: { priority: 4 }});
      queue.push({ url: 'e', metadata: { priority: 2 }});
      queue.push({ url: 'f', metadata: { priority: 7 }});

      expect(queue.pop()).toEqual({ url: 'f', metadata: { priority: 7, index: 0 }});
      expect(queue.links).toEqual([
        { url: 'c', metadata: { priority: 5, index: 0 }},
        { url: 'd', metadata: { priority: 4, index: 1 }},
        { url: 'b', metadata: { priority: 3, index: 2 }},
        { url: 'a', metadata: { priority: 0, index: 3 }},
        { url: 'e', metadata: { priority: 2, index: 4 }},
      ]);

      expect(queue.pop()).toEqual({ url: 'c', metadata: { priority: 5, index: 0 }});
      expect(queue.links).toEqual([
        { url: 'd', metadata: { priority: 4, index: 0 }},
        { url: 'e', metadata: { priority: 2, index: 1 }},
        { url: 'b', metadata: { priority: 3, index: 2 }},
        { url: 'a', metadata: { priority: 0, index: 3 }},
      ]);

      expect(queue.pop()).toEqual({ url: 'd', metadata: { priority: 4, index: 0 }});
      expect(queue.links).toEqual([
        { url: 'b', metadata: { priority: 3, index: 0 }},
        { url: 'e', metadata: { priority: 2, index: 1 }},
        { url: 'a', metadata: { priority: 0, index: 2 }},
      ]);

      expect(queue.pop()).toEqual({ url: 'b', metadata: { priority: 3, index: 0 }});
      expect(queue.links).toEqual([
        { url: 'e', metadata: { priority: 2, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
      ]);

      expect(queue.pop()).toEqual({ url: 'e', metadata: { priority: 2, index: 0 }});
      expect(queue.links).toEqual([
        { url: 'a', metadata: { priority: 0, index: 0 }},
      ]);

      expect(queue.pop()).toEqual({ url: 'a', metadata: { priority: 0, index: 0 }});
      expect(queue.links).toEqual([]);
    });
  });
  describe('updateAllPriority', () => {
    beforeEach(() => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
    });

    it('correctly updates all priorities in record', () => {
      queue.updateAllPriority({ b: 6, c: -1 });
      expect(queue.links).toEqual([
        { url: 'b', metadata: { priority: 6, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
        { url: 'c', metadata: { priority: -1, index: 2 }},

      ]);
    });
    it('updates only the priorities in the queue', () => {
      queue.updateAllPriority({ b: -1, c: -3, notin: 3 });
      expect(queue.links).toEqual([
        { url: 'a', metadata: { priority: 0, index: 0 }},
        { url: 'c', metadata: { priority: -3, index: 1 }},
        { url: 'b', metadata: { priority: -1, index: 2 }},
      ]);
    });
  });

  describe('updatePriority', () => {
    beforeEach(() => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
    });

    it('correctly updates priority to higher value', () => {
      const success = queue.updatePriority('a', 6);
      expect(success).toBeTruthy();
      expect(queue.links).toEqual([
        { url: 'a', metadata: { priority: 6, index: 0 }},
        { url: 'c', metadata: { priority: 5, index: 1 }},
        { url: 'b', metadata: { priority: 3, index: 2 }},
      ]);
    });

    it('correctly updates priority to lower value', () => {
      const success = queue.updatePriority('b', -5);
      expect(success).toBeTruthy();
      expect(queue.links).toEqual([
        { url: 'c', metadata: { priority: 5, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
        { url: 'b', metadata: { priority: -5, index: 2 }},
      ]);
    });

    it('returns false if link to update is not in the queue', () => {
      const success = queue.updatePriority('notinqueue', -5);
      expect(success).toBeFalsy();
      expect(queue.links).toEqual([
        { url: 'c', metadata: { priority: 5, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
        { url: 'b', metadata: { priority: 3, index: 2 }},
      ]);
    });

    it('returns false if change to priority is zero', () => {
      const success = queue.updatePriority('b', 3);
      expect(success).toBeFalsy();
      expect(queue.links).toEqual([
        { url: 'c', metadata: { priority: 5, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
        { url: 'b', metadata: { priority: 3, index: 2 }},
      ]);
    });
  });

  describe('increasePriority', () => {
    it('error on negative number', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      expect(() => queue.increasePriority('c', -1)).toThrow(`Can only increase priority of links by non-zero postive number`);
    });

    it('error on invalid index', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      expect(queue.increasePriority('f', 3)).toBeFalsy();
    });

    it('increases priority link', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      queue.push({ url: 'd', metadata: { priority: 4 }});
      queue.push({ url: 'e', metadata: { priority: 2 }});
      queue.push({ url: 'f', metadata: { priority: 7 }});
      queue.increasePriority('c', 5);
      expect(queue.links[0]).toEqual({ url: 'c', metadata: { priority: 10, index: 0 }});
    });
    it('maintains max-heap property', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      queue.push({ url: 'd', metadata: { priority: 4 }});
      queue.push({ url: 'e', metadata: { priority: 2 }});
      queue.push({ url: 'f', metadata: { priority: 7 }});

      queue.increasePriority('b', 3);
      expect(queue.links).toEqual([
        { url: 'f', metadata: { priority: 7, index: 0 }},
        { url: 'd', metadata: { priority: 4, index: 1 }},
        { url: 'b', metadata: { priority: 6, index: 2 }},
        { url: 'a', metadata: { priority: 0, index: 3 }},
        { url: 'e', metadata: { priority: 2, index: 4 }},
        { url: 'c', metadata: { priority: 5, index: 5 }},
      ]);
      queue.increasePriority('a', 10);
      expect(queue.links).toEqual([
        { url: 'a', metadata: { priority: 10, index: 0 }},
        { url: 'f', metadata: { priority: 7, index: 1 }},
        { url: 'b', metadata: { priority: 6, index: 2 }},
        { url: 'd', metadata: { priority: 4, index: 3 }},
        { url: 'e', metadata: { priority: 2, index: 4 }},
        { url: 'c', metadata: { priority: 5, index: 5 }},
      ]);
    });
  });

  describe('decreasePriority', () => {
    it('error on negative number', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      expect(() => queue.decreasePriority('a', -1)).toThrow(`Can only decrease priority of links by non-zero postive number`);
    });

    it('error on invalid index', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      expect(queue.decreasePriority('d', 3)).toBeFalsy();
    });

    it('decreases priority link', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      queue.push({ url: 'd', metadata: { priority: 4 }});
      queue.push({ url: 'e', metadata: { priority: 2 }});
      queue.push({ url: 'f', metadata: { priority: 7 }});
      queue.decreasePriority('c', 5);
      expect(queue.links[queue.getSize() - 1])
        .toEqual({ url: 'c', metadata: { priority: 0, index: queue.getSize() - 1 }});
    });

    it('maintains max-heap property', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 3 }});
      queue.push({ url: 'c', metadata: { priority: 5 }});
      queue.push({ url: 'd', metadata: { priority: 4 }});
      queue.push({ url: 'e', metadata: { priority: 2 }});
      queue.push({ url: 'f', metadata: { priority: 7 }});

      queue.decreasePriority('b', 1);
      expect(queue.links).toEqual([
        { url: 'f', metadata: { priority: 7, index: 0 }},
        { url: 'd', metadata: { priority: 4, index: 1 }},
        { url: 'c', metadata: { priority: 5, index: 2 }},
        { url: 'a', metadata: { priority: 0, index: 3 }},
        { url: 'e', metadata: { priority: 2, index: 4 }},
        { url: 'b', metadata: { priority: 2, index: 5 }},
      ]);
      queue.decreasePriority('d', 3);
      expect(queue.links).toEqual([
        { url: 'f', metadata: { priority: 7, index: 0 }},
        { url: 'e', metadata: { priority: 2, index: 1 }},
        { url: 'c', metadata: { priority: 5, index: 2 }},
        { url: 'a', metadata: { priority: 0, index: 3 }},
        { url: 'd', metadata: { priority: 1, index: 4 }},
        { url: 'b', metadata: { priority: 2, index: 5 }},
      ]);
    });
  });

  describe('peek', () => {
    it('does not change internal array size', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.push({ url: 'b', metadata: { priority: 1 }});
      queue.push({ url: 'c', metadata: { priority: 2 }});

      expect(queue.peek()).toEqual({ url: 'c', metadata: { priority: 2, index: 0 }});
      expect(queue.links).toEqual([
        { url: 'c', metadata: { priority: 2, index: 0 }},
        { url: 'a', metadata: { priority: 0, index: 1 }},
        { url: 'b', metadata: { priority: 1, index: 2 }},
      ]);
    });
  });
  describe('upHeap', () => {
    it('throws on negative index', () => {
      expect(() => queue.upHeap(-1)).toThrow(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on index > size of heap', () => {
      expect(() => queue.upHeap(1)).toThrow(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on empty heap', () => {
      expect(() => queue.upHeap(0)).toThrow(`Invalid index passed to upheap in priority queue`);
    });
    it('works on singleton heap', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.upHeap(0);
      expect(queue.links).toEqual([{ url: 'a', metadata: { priority: 0, index: 0 }}]);
    });
  });
  describe('downHeap', () => {
    it('throws on negative index', () => {
      expect(() => queue.downHeap(-1)).toThrow(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on index > size of heap', () => {
      expect(() => queue.downHeap(1)).toThrow(`Invalid index passed to upheap in priority queue`);
    });
    it('throws on empty heap', () => {
      expect(() => queue.downHeap(0)).toThrow(`Invalid index passed to upheap in priority queue`);
    });
    it('works on singleton heap', () => {
      queue.push({ url: 'a', metadata: { priority: 0 }});
      queue.downHeap(0);
      expect(queue.links).toEqual([{ url: 'a', metadata: { priority: 0, index: 0 }}]);
    });
  });
});
