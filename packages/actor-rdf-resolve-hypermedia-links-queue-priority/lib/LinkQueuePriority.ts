import type { ILink, ILinkQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';

/**
 * A link queue based on priority, using binary heap.
 */
export class LinkQueuePriority implements ILinkQueue {
  /**
   * Max heap with links and their priorities
   */
  public readonly links: ILink[] = [];
  /**
   * Data structure to track URLs in the queue and allow for constant time lookup of links in queue based
   * on link URL
   */
  public readonly urlToLink: Record<string, ILink> = {};

  /**
   * Pushes element to heap by appending it to array and up-heaping the new element
   */
  public push(link: ILink): boolean {
    const idx: number = this.links.length;

    // If we push a link that has no metadata or has metadata but no priority
    // we set priority to 0 and always set index to end of array (and upheap from there)
    if (link.metadata) {
      link.metadata.priority ??= 0;
      link.metadata.index = idx;
    } else {
      link.metadata = { priority: 0, index: idx };
    }

    this.links.push(link);

    // Add to Records to allow fast updates in priority
    this.urlToLink[link.url] = link;
    this.upHeap(idx);
    return true;
  }

  /**
   * Pops the highest priority link and returns it. Then it sets the last element as root and
   * down-heaps it.
   * @returns popped element
   */
  public pop(): ILink | undefined {
    if (this.getSize() > 0) {
      const max = this.links[0];
      const endArray = this.links.pop();

      // If we remove link, remove it from records to reflect new state of queue
      if (max) {
        delete this.urlToLink[max.url];
      }

      // Set last element to root and downheap to maintain heap property
      if (this.links.length > 0) {
        this.links[0] = endArray!;
        this.downHeap(0);
      }
      return max;
    }
  }

  /**
   * Changes all priorities in queue in O(n + m*log m ) time, with n is size of urlPriorities entry
   * and m size of the queue. Will only update priorities of urls that are actually in queue.
   * @param urlPriorities A record with url and new priority
   */
  public setAllPriority(urlPriorities: Record<string, number>): void {
    for (const url in urlPriorities) {
      if (this.urlToLink[url]) {
        this.setPriority(url, urlPriorities[url]);
      }
    }
  }

  /**
   * Update priority of link in queue if it is in queue
   * @param nodeUrl URL of link to update
   * @param newValue new priority value
   * @returns boolean indicating if priority was changed successfully
   */
  public setPriority(nodeUrl: string, newValue: number): boolean {
    const link = this.urlToLink[nodeUrl];
    if (link) {
      const delta = newValue - link.metadata!.priority;
      return this.modifyPriority(nodeUrl, delta);
    }
    return false;
  }

  /**
   * Function to change priority of element of heap with certain number.
   * Based on whether the delta is positive or negative, we upheap or downheap.
   */

  public modifyPriority(nodeUrl: string, delta: number): boolean {
    const link = this.urlToLink[nodeUrl];
    if (link) {
      const idx = link.metadata!.index;
      this.links[idx].metadata!.priority += delta;

      if (delta < 0) {
        this.downHeap(idx);
        return true;
      }
      if (delta > 0) {
        this.upHeap(idx);
        return true;
      }
    }
    return false;
  }

  /**
   * Bubbles up the element at index until the max-heap property is satifisfied
   * @param idx Index of element to up-heap
   */
  public upHeap(idx: number): void {
    if (idx < 0 || idx > this.links.length - 1) {
      throw new Error(`Invalid index passed to upheap in priority queue`);
    }
    if (idx === 0 && !this.links[idx].metadata!.index) {
      this.links[idx].metadata!.index = 0;
    }
    const element: ILink = this.links[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.links[parentIdx];
      if (element.metadata!.priority <= parent.metadata!.priority) {
        element.metadata!.index = idx;
        break;
      }
      this.links[parentIdx] = element;
      // Update indices
      element.metadata!.index = parentIdx;
      this.links[idx] = parent;
      parent.metadata!.index = idx;
      idx = parentIdx;
    }
  }

  /**
   * Bubbles down the element at input index until max-heap property is satisifed
   * @param idx Index of element to down-heap
   */
  public downHeap(idx: number): void {
    if (idx < 0 || idx > this.links.length - 1) {
      throw new Error(`Invalid index passed to upheap in priority queue`);
    }

    const length = this.links.length;
    const element = this.links[idx];
    let performedSwap = false;
    let keepSwapping = true;

    while (keepSwapping) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild,
        rightChild;
      let swap = null;

      // If there exist a left/right child we do comparison
      if (leftChildIdx < length) {
        leftChild = this.links[leftChildIdx];
        if (leftChild.metadata!.priority > element.metadata!.priority) {
          swap = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.links[rightChildIdx];
        // Only swap with right child if we either: don't swap a left child and the right child has higher
        // priority or if we do swap and left child has lower priority than right
        if (
          (swap === null && rightChild.metadata!.priority > element.metadata!.priority) ||
          (swap !== null && leftChild && rightChild.metadata!.priority > leftChild.metadata!.priority)
        ) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) {
        // If we don't perform any swap operations we update index
        if (!performedSwap) {
          element.metadata!.index = idx;
        }
        // This is only for linter..
        keepSwapping = false;
        break;
      }
      performedSwap = true;
      // We swap the elements and their stored indexes
      this.links[idx] = this.links[swap];
      this.links[idx].metadata!.index = idx;
      this.links[swap] = element;
      this.links[swap].metadata!.index = swap;
      idx = swap;
    }
  }

  public getSize(): number {
    return this.links.length;
  }

  public isEmpty(): boolean {
    return this.links.length === 0;
  }

  public peek(): ILink | undefined {
    return this.links[0];
  }
}
