import { QuerySourceRdfJs } from '@comunica/actor-query-source-identify-rdfjs';
import type { MediatorQuerySourceDereferenceLink } from '@comunica/bus-query-source-dereference-link';
import type { MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysHttp, KeysQueryOperation, KeysStatistics } from '@comunica/context-entries';
import type {
  ComunicaDataFactory,
  IActionContext,
  IDiscoverEventData,
  ILink,
  ILinkQueue,
  IQuerySource,
  IStatisticBase,
} from '@comunica/types';
import type { IAggregatedStore, ILinkTraversalManager } from '@comunica/types-link-traversal';
import type { BindingsFactory } from '@comunica/utils-bindings-factory';
import type { AsyncIterator } from 'asynciterator';
import type { AsyncReiterable } from 'asyncreiterable';
import { AsyncReiterableArray } from 'asyncreiterable';

/**
 * A link traversal manager that traverses over the link queue by resolving query sources for each link, extracting
 * additional links, and appending those to the queue.
 */
export class LinkTraversalManagerMediated implements ILinkTraversalManager {
  protected running = false;
  protected ended = false;
  protected readonly handledUrls: Record<string, boolean> = {};
  protected linksDereferencing: Set<AbortController> = new Set();
  protected querySourceAggregated: IQuerySource;
  protected querySourcesNonAggregated: AsyncReiterable<IQuerySource>;
  protected rejectionHandler: ((error: Error) => void) | undefined;
  protected readonly stopListeners: (() => void)[] = [];
  private allIteratorsClosedListener: (() => void) | undefined;
  protected linkParallelization: number;

  public constructor(
    protected readonly linkParallelizationDefault: number,
    protected readonly linkParallelizationLimit: number,
    public readonly seeds: ILink[],
    public readonly linkQueue: ILinkQueue,
    public readonly aggregatedStore: IAggregatedStore,
    protected readonly context: IActionContext,
    protected readonly dataFactory: ComunicaDataFactory,
    protected readonly bindingsFactory: BindingsFactory,
    protected readonly mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks,
    protected readonly mediatorQuerySourceDereferenceLink: MediatorQuerySourceDereferenceLink,
  ) {
    this.linkParallelization = linkParallelizationDefault;
    this.querySourceAggregated = new QuerySourceRdfJs(
      this.aggregatedStore,
      this.dataFactory,
      this.bindingsFactory,
    );
    this.querySourcesNonAggregated = AsyncReiterableArray.fromInitialEmpty();
  }

  public get started(): boolean {
    return this.running;
  }

  public get stopped(): boolean {
    return this.ended;
  }

  public start(rejectionHandler: (error: Error) => void, context: IActionContext): void {
    if (this.started) {
      throw new Error('Tried to start link traversal manager more than once');
    }

    // Reduce parallelization if we have a LIMIT clause
    // This ensures we do not spam the event loop with traverse events if we need to prioritize query processing events.
    if (context.get(KeysQueryOperation.limitIndicator)) {
      this.linkParallelization = this.linkParallelizationLimit;
    }

    // Prepare link queue iteration
    this.rejectionHandler = rejectionHandler;
    this.running = true;
    for (const link of this.seeds) {
      this.linkQueue.push(link);
    }

    // Stop link queue iteration when all iterators from the aggregated store are closed.
    this.allIteratorsClosedListener = (): void => this.stop();
    this.aggregatedStore.addAllIteratorsClosedListener(this.allIteratorsClosedListener);

    // Kickstart continuous iteration over the link queue
    this.tryTraversingNextLinks();
  }

  public stop(): void {
    if (!this.ended) {
      this.running = false;
      this.ended = true;
      setTimeout(() => this.tryTraversingNextLinks());
    }
  }

  public getQuerySourceAggregated(): IQuerySource {
    return this.querySourceAggregated;
  }

  public getQuerySourcesNonAggregated(): AsyncIterator<IQuerySource> {
    return this.querySourcesNonAggregated.iterator();
  }

  public addStopListener(cb: () => void): void {
    this.stopListeners.push(cb);
  }

  protected tryTraversingNextLinks(): void {
    // Stop traversal if needed
    if (!this.running) {
      if (!this.querySourcesNonAggregated.isEnded()) {
        this.querySourcesNonAggregated.push(null);
        this.aggregatedStore.end();
        this.aggregatedStore.removeAllIteratorsClosedListener(this.allIteratorsClosedListener!);
        // If any HTTP requests are still pending, abort them to avoid a hanging Node.js process
        for (const abortController of this.linksDereferencing) {
          abortController.abort();
        }
        for (const cb of this.stopListeners) {
          cb();
        }
      }
      return;
    }

    // Traverse multiple links in parallel
    while (this.linksDereferencing.size < this.linkParallelization) {
      const nextLink = this.linkQueue.pop();
      if (nextLink) {
        this.followLink(nextLink);
      } else {
        break;
      }
    }

    // If there are no further links to be traversed, we terminate
    if (this.linksDereferencing.size === 0 && this.linkQueue.isEmpty()) {
      this.stop();
    }
  }

  protected async getSourceLinks(metadata: Record<string, any>, startLink: ILink): Promise<ILink[]> {
    const { links } = await this.mediatorRdfResolveHypermediaLinks.mediate({ context: this.context, metadata });

    // Update discovery event statistic if available
    const traversalTracker: IStatisticBase<IDiscoverEventData> | undefined =
      this.context.get(KeysStatistics.discoveredLinks);
    if (traversalTracker) {
      for (const link of links) {
        traversalTracker.updateStatistic({ url: link.url, metadata: { ...link.metadata }}, startLink);
      }
    }

    // Filter URLs to avoid cyclic link loops
    return links.filter((link) => {
      if (this.handledUrls[link.url]) {
        return false;
      }
      this.handledUrls[link.url] = true;
      return true;
    });
  }

  protected followLink(nextLink: ILink): void {
    const abortController = new AbortController();
    this.linksDereferencing.add(abortController);

    this.mediatorQuerySourceDereferenceLink.mediate({
      link: nextLink,
      context: this.context.set(KeysHttp.httpAbortSignal, abortController.signal),
    })
      .then(async({ source, metadata }) => {
        // Determine next links
        for (const link of await this.getSourceLinks(metadata, nextLink)) {
          this.linkQueue.push(link);
        }

        // If the source is a document, add to aggregate store.
        // Otherwise, append to non-document sources.
        if (await source.getFilterFactor(this.context) === 0) {
          this.aggregatedStore.setBaseMetadata(metadata, this.aggregatedStore.containedSources.size > 0);
          await this.aggregatedStore.importSource(nextLink.url, source, this.context);
        } else {
          this.querySourcesNonAggregated.push(source);
        }

        // Queue next iteration
        this.linksDereferencing.delete(abortController);
        setTimeout(() => this.tryTraversingNextLinks());
      })
      .catch((error) => {
        this.linksDereferencing.delete(abortController);
        this.stop();
        this.rejectionHandler!(error);
      });
  }
}
