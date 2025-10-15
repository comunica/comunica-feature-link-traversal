import { AggregatedStoreMemory } from '@comunica/actor-factory-aggregated-store-memory';
import { QuerySourceRdfJs } from '@comunica/actor-query-source-identify-rdfjs';
import { LinkQueueFifo } from '@comunica/actor-rdf-resolve-hypermedia-links-queue-fifo';
import type { MediatorQuerySourceHypermediaResolve } from '@comunica/bus-query-source-hypermedia-resolve';
import type { MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysStatistics } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';
import type { IActionContext } from '@comunica/types';
import { BindingsFactory } from '@comunica/utils-bindings-factory';
import { DataFactory } from 'rdf-data-factory';
import { storeStream } from 'rdf-store-stream';
import { Readable } from 'readable-stream';
import { Factory } from 'sparqlalgebrajs';
import { LinkTraversalManagerMediated } from '../lib';
import '@comunica/utils-jest';

const DF = new DataFactory();
const AF = new Factory();
const BF = new BindingsFactory(DF);

describe('LinkTraversalManagerMediated', () => {
  let mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
  let mediatorQuerySourceHypermediaResolve: MediatorQuerySourceHypermediaResolve;
  let mgr: LinkTraversalManagerMediated;
  let rejectionHandler: (error: Error) => void;
  let onDereferenceLink: ((url: string) => void) | undefined;

  beforeEach(() => {
    onDereferenceLink = undefined;
    mediatorRdfResolveHypermediaLinks = <any> {
      mediate: jest.fn(async({ metadata }: any) => {
        if (metadata.next.length === 11) {
          return { links: []};
        }
        let context: IActionContext | undefined;
        if (metadata.next.length === 10) {
          context = new ActionContext();
        }
        return { links: [{ url: metadata.next, context }]};
      }),
    };
    mediatorQuerySourceHypermediaResolve = <any> {
      mediate: jest.fn(async({ url }: any) => {
        if (onDereferenceLink) {
          onDereferenceLink(url);
        }
        return {
          source: new QuerySourceRdfJs(
            await storeStream(Readable.from([
              DF.quad(DF.namedNode(url), DF.namedNode('p'), DF.namedNode('o')),
            ])),
            DF,
            new BindingsFactory(DF),
          ),
          metadata: { next: `${url}-`, url },
        };
      }),
    };
    mgr = new LinkTraversalManagerMediated(
      2,
      [
        { url: 'a' },
        { url: 'b' },
      ],
      new LinkQueueFifo(),
      new AggregatedStoreMemory(
        undefined,
        async(left, right) => ({ ...left, ...right }),
        false,
        DF,
      ),
      new ActionContext(),
      DF,
      new BindingsFactory(DF),
      mediatorRdfResolveHypermediaLinks,
      mediatorQuerySourceHypermediaResolve,
    );
    rejectionHandler = jest.fn();
  });

  describe('started', () => {
    it('to be false when not started', () => {
      expect(mgr.started).toBe(false);
    });

    it('to be true when started', () => {
      mgr.start(rejectionHandler);
      expect(mgr.started).toBe(true);
    });
  });

  describe('stopped', () => {
    it('to be false when not started', () => {
      expect(mgr.stopped).toBe(false);
    });

    it('to be true when stopped', () => {
      mgr.stop();
      expect(mgr.stopped).toBe(true);
    });
  });

  describe('start', () => {
    it('to throw when starting twice', () => {
      mgr.start(rejectionHandler);
      expect(() => mgr.start(rejectionHandler)).toThrow('Tried to start link traversal manager more than once');
    });

    it('performs traversal', async() => {
      // Start and wait until done
      mgr.start(rejectionHandler);
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      expect(mgr.linkQueue.isEmpty()).toBe(true);
      await expect(mgr.aggregatedStore.match().toArray()).resolves.toHaveLength(20);
      expect([ ...mgr.aggregatedStore.containedSources ]).toHaveLength(20);
      expect(mgr.aggregatedStore.hasEnded()).toBe(true);
      expect(mgr.aggregatedStore.hasRunningIterators()).toBe(false);
      expect(mediatorRdfResolveHypermediaLinks.mediate).toHaveBeenCalledTimes(20);
      expect(mediatorQuerySourceHypermediaResolve.mediate).toHaveBeenCalledTimes(20);
    });

    it('performs traversal and tracks discovered links', async() => {
      const stat = new StatisticLinkDiscovery();
      mgr = new LinkTraversalManagerMediated(
        2,
        [
          { url: 'a' },
          { url: 'b' },
        ],
        new LinkQueueFifo(),
        new AggregatedStoreMemory(
          undefined,
          async(left, right) => ({ ...left, ...right }),
          false,
          DF,
        ),
        new ActionContext()
          .set(KeysStatistics.discoveredLinks, stat),
        DF,
        new BindingsFactory(DF),
        mediatorRdfResolveHypermediaLinks,
        mediatorQuerySourceHypermediaResolve,
      );

      // Start and wait until done
      mgr.start(rejectionHandler);
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      expect(mgr.linkQueue.isEmpty()).toBe(true);
      await expect(mgr.aggregatedStore.match().toArray()).resolves.toHaveLength(20);
      expect([ ...mgr.aggregatedStore.containedSources ]).toHaveLength(20);
      expect(mgr.aggregatedStore.hasEnded()).toBe(true);
      expect(mgr.aggregatedStore.hasRunningIterators()).toBe(false);
      expect(mediatorRdfResolveHypermediaLinks.mediate).toHaveBeenCalledTimes(20);
      expect(mediatorQuerySourceHypermediaResolve.mediate).toHaveBeenCalledTimes(20);
      expect(stat.count).toBe(18);
    });

    it('performs traversal and avoids link cycles', async() => {
      mediatorRdfResolveHypermediaLinks.mediate = <any> jest.fn(async({ metadata }: any) => {
        if (metadata.next.length === 11) {
          return { links: []};
        }
        return { links: [{ url: metadata.next }, { url: metadata.url }]};
      });

      // Start and wait until done
      mgr.start(rejectionHandler);
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      expect(mgr.linkQueue.isEmpty()).toBe(true);
      await expect(mgr.aggregatedStore.match().toArray()).resolves.toHaveLength(20);
      expect([ ...mgr.aggregatedStore.containedSources ]).toHaveLength(20);
      expect(mgr.aggregatedStore.hasEnded()).toBe(true);
      expect(mgr.aggregatedStore.hasRunningIterators()).toBe(false);
      expect(mediatorRdfResolveHypermediaLinks.mediate).toHaveBeenCalledTimes(22);
      expect(mediatorQuerySourceHypermediaResolve.mediate).toHaveBeenCalledTimes(22);
    });

    it('stops early when all iterators are closed early', async() => {
      // Start traversal and an iterator
      mgr.start(rejectionHandler);
      const it1 = mgr.aggregatedStore.match();

      // Close pending iterators once a certain link is reached
      onDereferenceLink = (url: string) => {
        if (url.length === 5) {
          it1.destroy();
        }
      };

      // Wait until done
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      expect(mgr.linkQueue.isEmpty()).toBe(false);
      expect((await mgr.aggregatedStore.match().toArray()).length).toBeGreaterThanOrEqual(8);
      expect((await mgr.aggregatedStore.match().toArray()).length).toBeLessThanOrEqual(10);
      expect(mgr.aggregatedStore.hasEnded()).toBe(true);
      expect(mgr.aggregatedStore.hasRunningIterators()).toBe(false);
    });

    it('stops when a link fails to resolve', async() => {
      mediatorQuerySourceHypermediaResolve.mediate = () => Promise
        .reject(new Error('LinkTraversalManagerMediated rejection'));

      // Start traversal and an iterator
      mgr.start(rejectionHandler);
      mgr.aggregatedStore.match();

      // Wait until done
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).toHaveBeenCalledWith(new Error('LinkTraversalManagerMediated rejection'));
      expect(mgr.aggregatedStore.hasEnded()).toBe(true);
    });
  });

  describe('getQuerySourceAggregated', () => {
    it('allows querying over the aggregate store', async() => {
      // Start and wait until done
      mgr.start(rejectionHandler);
      const bindingsStream1 = mgr.getQuerySourceAggregated().queryBindings(
        AF.createPattern(DF.namedNode('a---------'), DF.variable('p'), DF.variable('o')),
        new ActionContext(),
      );
      const bindingsStream2 = mgr.getQuerySourceAggregated().queryBindings(
        AF.createPattern(DF.variable('s'), DF.variable('p'), DF.variable('o')),
        new ActionContext(),
      );
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      await expect(bindingsStream1).toEqualBindingsStream([
        BF.fromRecord({
          p: DF.namedNode('p'),
          o: DF.namedNode('o'),
        }),
      ]);
      await expect(bindingsStream2.toArray()).resolves.toHaveLength(20);
    });

    it('provides no non-aggregated sources when traversing over plain documents', async() => {
      // Start and wait until done
      mgr.start(rejectionHandler);
      const bindingsStream1 = mgr.getQuerySourceAggregated().queryBindings(
        AF.createPattern(DF.namedNode('a---------'), DF.variable('p'), DF.variable('o')),
        new ActionContext(),
      );
      const nonAggregatedSourcesIterator = mgr.getQuerySourcesNonAggregated();
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      await expect(nonAggregatedSourcesIterator.toArray()).resolves.toEqual([]);
      await expect(bindingsStream1).toEqualBindingsStream([
        BF.fromRecord({
          p: DF.namedNode('p'),
          o: DF.namedNode('o'),
        }),
      ]);
    });

    it('provides non-aggregated sources when traversing over non-documents', async() => {
      mediatorQuerySourceHypermediaResolve.mediate = <any> jest.fn(async({ url }: any) => {
        const source = new QuerySourceRdfJs(
          await storeStream(Readable.from([
            DF.quad(DF.namedNode(url), DF.namedNode('p'), DF.namedNode('o')),
          ])),
          DF,
          new BindingsFactory(DF),
        );
        source.getFilterFactor = async() => 1;
        return {
          source,
          metadata: { next: `${url}-` },
        };
      });

      // Start and wait until done
      mgr.start(rejectionHandler);
      const bindingsStream1 = mgr.getQuerySourceAggregated().queryBindings(
        AF.createPattern(DF.namedNode('a---------'), DF.variable('p'), DF.variable('o')),
        new ActionContext(),
      );
      const nonAggregatedSourcesIterator = mgr.getQuerySourcesNonAggregated();
      await new Promise<void>(resolve => mgr.addStopListener(resolve));

      // Check end state
      expect(rejectionHandler).not.toHaveBeenCalled();
      await expect(nonAggregatedSourcesIterator.toArray()).resolves.toHaveLength(20);
      await expect(bindingsStream1).toEqualBindingsStream([]);
    });
  });
});
