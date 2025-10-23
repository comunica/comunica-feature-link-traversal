import { AggregatedStoreMemory } from '@comunica/actor-factory-aggregated-store-memory';
import {
  LinkTraversalManagerMediated,
} from '@comunica/actor-optimize-query-operation-initialize-link-traversal-manager';
import { QuerySourceRdfJs } from '@comunica/actor-query-source-identify-rdfjs';
import { LinkQueueFifo } from '@comunica/actor-rdf-resolve-hypermedia-links-queue-fifo';
import type { MediatorQuerySourceDereferenceLink } from '@comunica/bus-query-source-dereference-link';
import type { MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActionContext } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type { ILinkTraversalManager } from '@comunica/types-link-traversal';
import { AlgebraFactory } from '@comunica/utils-algebra';
import { BindingsFactory } from '@comunica/utils-bindings-factory';
import { MetadataValidationState } from '@comunica/utils-metadata';
import { DataFactory } from 'rdf-data-factory';
import { storeStream } from 'rdf-store-stream';
import { Readable } from 'readable-stream';
import { QuerySourceLinkTraversal } from '../lib/QuerySourceLinkTraversal';
import '@comunica/utils-jest';
import 'jest-rdf';

const DF = new DataFactory();
const AF = new AlgebraFactory();
const BF = new BindingsFactory(DF);

describe('QuerySourceLinkTraversal', () => {
  let ctx: IActionContext;
  let mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
  let mediatorQuerySourceDereferenceLink: MediatorQuerySourceDereferenceLink;
  let linkTraversalManager: ILinkTraversalManager;
  let source: QuerySourceLinkTraversal;

  beforeEach(() => {
    ctx = new ActionContext();
    mediatorRdfResolveHypermediaLinks = <any> {
      mediate: jest.fn(async({ metadata }: any) => {
        if (metadata.next.length === 4) {
          return { links: []};
        }
        return { links: [{ url: metadata.next }]};
      }),
    };
    mediatorQuerySourceDereferenceLink = <any> {
      mediate: jest.fn(async({ link }: any) => {
        return {
          source: new QuerySourceRdfJs(
            await storeStream(Readable.from([
              DF.quad(DF.namedNode(link.url), DF.namedNode('p'), DF.namedNode('o')),
            ])),
            DF,
            new BindingsFactory(DF),
          ),
          metadata: { next: `${link.url}-` },
        };
      }),
    };
    linkTraversalManager = new LinkTraversalManagerMediated(
      2,
      1,
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
      BF,
      mediatorRdfResolveHypermediaLinks,
      mediatorQuerySourceDereferenceLink,
    );
    jest.spyOn(linkTraversalManager, 'start');
    jest.spyOn(linkTraversalManager, 'stop');
    source = new QuerySourceLinkTraversal(linkTraversalManager);
  });

  describe('getSelectorShape', () => {
    it('should return a selector shape', async() => {
      await expect(source.getSelectorShape(ctx)).resolves.toEqual({
        type: 'operation',
        operation: {
          operationType: 'pattern',
          pattern: AF.createPattern(DF.variable('s'), DF.variable('p'), DF.variable('o')),
        },
        variablesOptional: [
          DF.variable('s'),
          DF.variable('p'),
          DF.variable('o'),
        ],
      });
    });
  });

  describe('getFilterFactor', () => {
    it('should return 0', async() => {
      await expect(source.getFilterFactor()).resolves.toBe(0);
    });
  });

  describe('toString', () => {
    it('should return a string representation', async() => {
      expect(source.toString()).toBe('QuerySourceLinkTraversal(a,b)');
    });
  });

  describe('queryBindings', () => {
    it('should return bindings over the union of all discovered documents', async() => {
      const data = source.queryBindings(
        AF.createPattern(DF.variable('s'), DF.namedNode('p'), DF.variable('o')),
        ctx,
      );
      await expect(data).toEqualBindingsStream([
        BF.fromRecord({ s: DF.namedNode('a'), o: DF.namedNode('o') }),
        BF.fromRecord({ s: DF.namedNode('b'), o: DF.namedNode('o') }),
        BF.fromRecord({ s: DF.namedNode('a-'), o: DF.namedNode('o') }),
        BF.fromRecord({ s: DF.namedNode('b-'), o: DF.namedNode('o') }),
        BF.fromRecord({ s: DF.namedNode('a--'), o: DF.namedNode('o') }),
        BF.fromRecord({ s: DF.namedNode('b--'), o: DF.namedNode('o') }),
      ]);
      await expect(new Promise(resolve => data.getProperty('metadata', resolve))).resolves
        .toEqual({
          cardinality: { type: 'estimate', value: 0 },
          state: expect.any(MetadataValidationState),
          variables: [
            { variable: DF.variable('s'), canBeUndef: false },
            { variable: DF.variable('o'), canBeUndef: false },
          ],
        });
      expect(linkTraversalManager.start).toHaveBeenCalledTimes(1);
      expect(linkTraversalManager.linkQueue.getSize()).toBe(0);
    });

    it('should return bindings over the union of all discovered documents and query sources', async() => {
      mediatorQuerySourceDereferenceLink.mediate = <any> jest.fn(async({ link }: any) => {
        const source = new QuerySourceRdfJs(
          await storeStream(Readable.from([
            DF.quad(DF.namedNode(link.url), DF.namedNode('p'), DF.namedNode('o')),
          ])),
          DF,
          new BindingsFactory(DF),
        );
        if (link.url.startsWith('b')) {
          source.getFilterFactor = async() => 1;
        }
        return {
          source,
          metadata: { next: `${link.url}-` },
        };
      });

      const data = source.queryBindings(
        AF.createPattern(DF.variable('s'), DF.namedNode('p'), DF.variable('o')),
        ctx,
      );
      await expect(data.toArray()).resolves.toHaveLength(6);
      await expect(new Promise(resolve => data.getProperty('metadata', resolve))).resolves
        .toEqual({
          cardinality: { type: 'estimate', value: 0 },
          state: expect.any(MetadataValidationState),
          variables: [
            { variable: DF.variable('s'), canBeUndef: false },
            { variable: DF.variable('o'), canBeUndef: false },
          ],
        });
    });

    it('does not restart traversal if already started', async() => {
      linkTraversalManager.start(<any>undefined, ctx);
      const data = source.queryBindings(
        AF.createPattern(DF.variable('s'), DF.namedNode('p'), DF.variable('o')),
        ctx,
      );
      await expect(data.toArray()).resolves.toHaveLength(6);
      expect(linkTraversalManager.start).toHaveBeenCalledTimes(1);
      expect(linkTraversalManager.linkQueue.getSize()).toBe(0);
    });

    it('propagates close events', async() => {
      const data = source.queryBindings(
        AF.createPattern(DF.variable('s'), DF.namedNode('p'), DF.variable('o')),
        ctx,
      );
      data.destroy();
      await new Promise(setImmediate);
      expect(linkTraversalManager.stop).toHaveBeenCalledTimes(1);
      expect(linkTraversalManager.linkQueue.getSize()).toBe(2);
    });

    it('propagates rejections to destroy', async() => {
      const data = source.queryBindings(
        AF.createPattern(DF.variable('s'), DF.namedNode('p'), DF.variable('o')),
        ctx,
      );
      let error: Error | undefined;
      data.on('error', (err) => {
        error = err;
      });
      (<any> linkTraversalManager).rejectionHandler(new Error('QuerySourceLinkTraversal rejection'));
      expect(error).toEqual(new Error('QuerySourceLinkTraversal rejection'));
      await new Promise(setImmediate);
      expect(linkTraversalManager.stop).toHaveBeenCalledTimes(1);
      expect(linkTraversalManager.linkQueue.getSize()).toBe(2);
    });
  });

  describe('queryQuads', () => {
    it('should throw', () => {
      expect(() => source.queryQuads())
        .toThrow(`queryQuads is not implemented in QuerySourceLinkTraversal`);
    });
  });

  describe('queryBoolean', () => {
    it('should throw', () => {
      expect(() => source.queryBoolean())
        .toThrow(`queryBoolean is not implemented in QuerySourceLinkTraversal`);
    });
  });

  describe('queryVoid', () => {
    it('should throw', () => {
      expect(() => source.queryVoid())
        .toThrow(`queryVoid is not implemented in QuerySourceLinkTraversal`);
    });
  });
});
