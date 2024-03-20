import type { Readable, TransformCallback } from 'node:stream';
import { Transform } from 'node:stream';
import type { MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import { ActionContext, Bus } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import arrayifyStream from 'arrayify-stream';
import { DataFactory } from 'rdf-data-factory';
import {
  ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph,
} from '../lib/ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

describe('ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph', () => {
  let bus: any;
  let context: IActionContext;
  let mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    context = new ActionContext()
      .set(KeysRdfResolveHypermediaLinks.annotateSources, 'graph');
    mediatorRdfResolveHypermediaLinks = <any> {
      mediate: jest.fn(() => ({
        links: [
          {
            url: 'ex:link1',
          },
          {
            url: 'ex:link2',
          },
        ],
      })),
    };
  });

  describe('An ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph instance', () => {
    let actor: ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph;

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph({
        name: 'actor',
        bus,
        mediatorRdfResolveHypermediaLinks,
      });
    });

    describe('test', () => {
      it('should pass on annotateSources graph in the context', async() => {
        await expect(actor.test({ context, metadata: {}})).resolves.toBeTruthy();
      });

      it('should not pass on annotateSources non-graph in the context', async() => {
        context = context.set(KeysRdfResolveHypermediaLinks.annotateSources, 'non-graph');
        await expect(actor.test({ context, metadata: {}})).rejects
          .toThrow(`Actor actor can only work when graph annotation is enabled.`);
      });

      it('should not pass on no annotateSources in the context', async() => {
        context = context.delete(KeysRdfResolveHypermediaLinks.annotateSources);
        await expect(actor.test({ context, metadata: {}})).rejects
          .toThrow(`Context entry @comunica/bus-rdf-resolve-hypermedia-links:annotateSources is required but not available`);
      });
    });

    describe('run', () => {
      it('should attach a transformer to links', async() => {
        const { links } = await actor.run({ context, metadata: {}});

        expect(links).toHaveLength(2);
        await expect(arrayifyStream(await links[0].transform!(streamifyArray([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ])))).resolves.toEqual([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1'), DF.namedNode('ex:link1')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2'), DF.namedNode('ex:link1')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ]);
        await expect(arrayifyStream(await links[1].transform!(streamifyArray([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ])))).resolves.toEqual([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1'), DF.namedNode('ex:link2')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2'), DF.namedNode('ex:link2')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ]);
      });

      it('should build upon existing transformers in links', async() => {
        mediatorRdfResolveHypermediaLinks.mediate = <any> jest.fn(() => ({
          links: [
            {
              url: 'ex:link1',
              transform: input => (<Readable> input).pipe(new Transform({
                objectMode: true,
                transform(chunk: any, encoding: string, callback: TransformCallback) {
                  callback(undefined, chunk);
                },
                flush(callback: TransformCallback) {
                  return callback(undefined, DF.quad(
                    DF.namedNode('ex:end'),
                    DF.namedNode('ex:end'),
                    DF.namedNode('ex:end'),
                  ));
                },
              })),
            },
            {
              url: 'ex:link2',
            },
          ],
        }));

        const { links } = await actor.run({ context, metadata: {}});

        expect(links).toHaveLength(2);
        await expect(arrayifyStream(await links[0].transform!(streamifyArray([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ])))).resolves.toEqual([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1'), DF.namedNode('ex:link1')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2'), DF.namedNode('ex:link1')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
          DF.quad(DF.namedNode('ex:end'), DF.namedNode('ex:end'), DF.namedNode('ex:end'), DF.namedNode('ex:link1')),
        ]);
        await expect(arrayifyStream(await links[1].transform!(streamifyArray([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ])))).resolves.toEqual([
          DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1'), DF.namedNode('ex:link2')),
          DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2'), DF.namedNode('ex:link2')),
          DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3'), DF.namedNode('ex:g1')),
        ]);
      });
    });
  });
});
