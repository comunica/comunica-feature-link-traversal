import type { ILink, ILinkQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
/**
 * A link queue based on priority, using binary heap.
 */
export class LinkQueuePriority implements ILinkQueue {
  /**
   * Max heap with links and their priorities
   */
  public readonly links: ILinkPriority[] = [];
  /**
   * Data structure to track URLs in the queue and allow for constant time lookup of links in queue based 
   * on link URL
  */ 
  public readonly urlToLink: Record<string, ILinkPriority> = {};
  /**
   * Pushes element to heap by appending it to array and up-heaping the new element
   */
  public push(link: ILinkPriority, parent: ILinkPriority): boolean {
    this.links.push(link);
    // Add to Records to allow fast updates in priority
    this.urlToLink[link.url] = link;
    const idx: number = this.links.length - 1;
    this.upHeap(idx);
    return true;
  }

  /**
   * Pops the highest priority link and returns it. Then it sets the last element as root and
   * down-heaps it.
   * @returns popped element
   */
  public pop(): ILinkPriority {
    const max = this.links[0];
    const endArray = this.links.pop();
    if (max){
      delete this.urlToLink[max.url];
    }
    if (this.links.length > 0){
      this.links[0] = endArray!;
      this.downHeap(0);
    }
    return max;
  }

  /**
   * Changes all priorities in queue in O(n + m*log m ) time, with n is size of urlPriorities entry 
   * and m size of the queue. Will only update priorities of urls that are actually in queue.
   * @param urlPriorities A record with url and new priority
   */
  public updateAllPriority(urlPriorities: Record<string, number>){
    for (const url in urlPriorities){
      if (this.urlToLink[url]){
        this.updatePriority(url, urlPriorities[url]);
      }
    }
  }
  /**
   * Update priority of link in queue if it is in queue
   * @param nodeUrl URL of link to update
   * @param newValue new priority value
   * @returns boolean indicating if priority was changed successfully
   */
  public updatePriority(nodeUrl: string, newValue: number){
    if (this.urlToLink[nodeUrl]){
      const link = this.urlToLink[nodeUrl];
      if (link.index === undefined){
        throw new Error("Link in queue without an index");
      }
      const idx = link.index;
      const previousPriority = link.priority;
      const change = newValue - previousPriority;
      if (change == 0){
        return false;
      }
      change > 0 ? this.increasePriority(idx, change) : this.decreasePriority(idx, -change);
      return true
    }
    return false
  }

  /**
   * Function to increase priority of element of heap. First we increase priority using
   * the given index. Then we reheap our array.
   */
  public increasePriority(idx: number, increaseBy: number): void {
    if (!this.links[idx] || this.links[idx].priority === undefined) {
      throw new Error(`Access invalid ILinkPriority in heap: ${this.links[idx]?.url}, ${this.links[idx]?.priority}`);
    }
    if (increaseBy <= 0) {
      throw new Error(`Can only increase priority of links by non-zero postive number`);
    }
    this.links[idx].priority += increaseBy;
    this.upHeap(idx);
  }

  /**
   * Function to decrease priority of element of heap. First we decrease priority at the given index.
   * Then we reheap our array.
   */

  public decreasePriority(idx: number, decreaseBy: number): void {
    if (!this.links[idx] || this.links[idx].priority === undefined) {
      throw new Error(`Access invalid ILinkPriority in heap: ${this.links[idx]?.url}, ${this.links[idx]?.priority}`);
    }
    if (decreaseBy <= 0) {
      throw new Error(`Can only decrease priority of links by non-zero postive number`);
    }
    this.links[idx].priority += -decreaseBy;
    this.downHeap(idx);
  }

  /**
   * Bubbles up the element at index until the max-heap property is satifisfied
   * @param idx Index of element to up-heap
   */
  public upHeap(idx: number): void {
    if (idx < 0 || idx > this.links.length - 1) {
      throw new Error(`Invalid index passed to upheap in priority queue`);
    }
    if (idx === 0 && !this.links[idx].index) {
      this.links[idx].index = 0;
    }
    const element: ILinkPriority = this.links[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.links[parentIdx];
      if (element.priority <= parent.priority) {
        element.index = idx;
        break;
      }
      this.links[parentIdx] = element;
      // Update indices
      element.index = parentIdx;
      this.links[idx] = parent;
      parent.index = idx;
      idx = parentIdx;
    }
  }

  /**
   * Bubbles down the element at input index untill max-heap property is satisifed
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
        if (leftChild.priority > element.priority) {
          swap = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.links[rightChildIdx];
        // Only swap with right child if we either: don't swap a left child and the right child has higher
        // priority or if we do swap and left child has lower priority than right
        if (
          swap === null && rightChild.priority > element.priority ||
          swap !== null && leftChild && rightChild.priority > leftChild.priority
        ) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) {
        // If we don't perform any swap operations we update index
        if (!performedSwap) {
          element.index = idx;
        }
        // This is only for linter..
        keepSwapping = false;
        break;
      }
      performedSwap = true;
      // We swap the elements and their stored indexes
      this.links[idx] = this.links[swap];
      this.links[idx].index = idx;
      this.links[swap] = element;
      this.links[swap].index = swap;
      idx = swap;
    }
  }

  public getSize(): number {
    return this.links.length;
  }

  public isEmpty(): boolean {
    return this.links.length === 0;
  }

  public peek(): ILinkPriority | undefined {
    return this.links[0];
  }
}

export interface ILinkPriority extends ILink{
  /**
   * Priority associated with link
   */
  priority: number;
  /**
   * Index in heap, this is tracked internally
   */
  index?: number;
}
