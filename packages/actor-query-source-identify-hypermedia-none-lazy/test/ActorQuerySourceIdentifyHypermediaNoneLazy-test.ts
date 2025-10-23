import { QuerySourceRdfJs } from '@comunica/actor-query-source-identify-rdfjs';
import type { MediatorQuerySourceIdentifyHypermedia } from '@comunica/bus-query-source-identify-hypermedia';
import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import type { BindingsStream, IActionContext } from '@comunica/types';
import { AlgebraFactory } from '@comunica/utils-algebra';
import { BindingsFactory } from '@comunica/utils-bindings-factory';
import { MetadataValidationState } from '@comunica/utils-metadata';
import { DataFactory } from 'rdf-data-factory';
import { RdfStore } from 'rdf-stores';
import {
  ActorQuerySourceIdentifyHypermediaNoneLazy,
} from '../lib/ActorQuerySourceIdentifyHypermediaNoneLazy';
import { QuerySourceFileLazy } from '../lib/QuerySourceFileLazy';
import '@comunica/utils-jest';

const quad = require('rdf-quad');
const streamifyArray = require('streamify-array');

const DF = new DataFactory();
const AF = new AlgebraFactory();
const BF = new BindingsFactory(DF);
const v1 = DF.variable('v1');
const v2 = DF.variable('v2');
const v3 = DF.variable('v3');

describe('ActorQuerySourceIdentifyHypermediaNoneLazy', () => {
  let bus: any;
  let mediatorQuerySourceIdentifyHypermedia: MediatorQuerySourceIdentifyHypermedia;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorQuerySourceIdentifyHypermedia = <any> {
      mediate: jest.fn(async() => {
        const source = RdfStore.createDefault();
        source.addQuad(quad('s1', 'p1', 'o1'));
        source.addQuad(quad('s2', 'p2', 'o2'));
        return { source: new QuerySourceRdfJs(source, DF, new BindingsFactory(DF)) };
      }),
    };
  });

  describe('An ActorQuerySourceIdentifyHypermediaNoneLazy instance', () => {
    let actor: ActorQuerySourceIdentifyHypermediaNoneLazy;
    let context: IActionContext;

    beforeEach(() => {
      actor = new ActorQuerySourceIdentifyHypermediaNoneLazy({
        name: 'actor',
        bus,
        mediatorQuerySourceIdentifyHypermedia,
      });
      context = new ActionContext({ [KeysInitQuery.dataFactory.name]: DF });
    });

    it('should test', async() => {
      await expect(actor.test({ metadata: <any> null, quads: <any> null, url: '', context }))
        .resolves.toPassTest({ filterFactor: 0 });
    });

    it('should run and delegate queryQuads calls', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      expect(source.queryQuads(AF.createPattern(v1, v1, v1, v1), new ActionContext())).toBe(quads);
      expect(mediatorQuerySourceIdentifyHypermedia.mediate).toHaveBeenCalledTimes(0);
    });

    it('should run and throw on queryQuads with not all variables', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      expect(() => source.queryQuads(AF.createPattern(v1, v1, v1), new ActionContext()))
        .toThrow('queryQuads is not implemented in QuerySourceFileLazy');
    });

    it('should run and throw on multiple queryQuads calls', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      expect(source.queryQuads(AF.createPattern(v1, v1, v1, v1), new ActionContext())).toBe(quads);
      expect(() => source.queryQuads(AF.createPattern(v1, v1, v1, v1), new ActionContext()))
        .toThrow('Illegal invocation of queryQuads, as the lazy quads stream has already been consumed.');
    });

    it('should run and throw on multiple queryBindings and queryQuads calls', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      await source.queryBindings(AF.createPattern(v1, v2, v3), new ActionContext()).toArray();
      expect(() => source.queryQuads(AF.createPattern(v1, v1, v1, v1), new ActionContext()))
        .toThrow('Illegal invocation of queryQuads, as the lazy quads stream has already been consumed.');
    });

    it('should run and throw on multiple queryQuads and queryBindings calls', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      source.queryQuads(AF.createPattern(v1, v1, v1, v1), new ActionContext());
      expect(() => source.queryBindings(AF.createPattern(v1, v1, v1, v1), new ActionContext()))
        .toThrow('Illegal invocation of queryBindings, as the lazy quads stream has already been consumed.');
    });

    it('should run and delegate queryBindings calls', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      await expect(source.getFilterFactor(context)).resolves.toBe(0);
      await expect(source.getSelectorShape(context)).resolves.toBeDefined();
      const stream: BindingsStream = source.queryBindings(AF.createPattern(v1, v2, v3), new ActionContext());
      await expect(new Promise((resolve, reject) => {
        stream.getProperty('metadata', resolve);
        stream.on('error', reject);
      })).resolves.toEqual({
        state: expect.any(MetadataValidationState),
        cardinality: { type: 'exact', value: 2 },
        availableOrders: undefined,
        order: undefined,
        variables: [
          { variable: v1, canBeUndef: false },
          { variable: v2, canBeUndef: false },
          { variable: v3, canBeUndef: false },
        ],
        requestTime: 0,
      });
      await expect(stream).toEqualBindingsStream([
        BF.fromRecord({
          v1: DF.namedNode('s1'),
          v2: DF.namedNode('p1'),
          v3: DF.namedNode('o1'),
        }),
        BF.fromRecord({
          v1: DF.namedNode('s2'),
          v2: DF.namedNode('p2'),
          v3: DF.namedNode('o2'),
        }),
      ]);
      expect(mediatorQuerySourceIdentifyHypermedia.mediate).toHaveBeenCalledTimes(1);
    });

    it('should run and delegate multiple queryBindings calls', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      const stream: BindingsStream = source.queryBindings(AF.createPattern(v1, v2, v3), new ActionContext());
      await expect(new Promise((resolve, reject) => {
        stream.getProperty('metadata', resolve);
        stream.on('error', reject);
      })).resolves.toEqual({
        state: expect.any(MetadataValidationState),
        cardinality: { type: 'exact', value: 2 },
        availableOrders: undefined,
        order: undefined,
        variables: [
          { variable: v1, canBeUndef: false },
          { variable: v2, canBeUndef: false },
          { variable: v3, canBeUndef: false },
        ],
        requestTime: 0,
      });
      await expect(stream).toEqualBindingsStream([
        BF.fromRecord({
          v1: DF.namedNode('s1'),
          v2: DF.namedNode('p1'),
          v3: DF.namedNode('o1'),
        }),
        BF.fromRecord({
          v1: DF.namedNode('s2'),
          v2: DF.namedNode('p2'),
          v3: DF.namedNode('o2'),
        }),
      ]);
      await expect(source.queryBindings(AF.createPattern(v1, v2, v3), new ActionContext())).toEqualBindingsStream([
        BF.fromRecord({
          v1: DF.namedNode('s1'),
          v2: DF.namedNode('p1'),
          v3: DF.namedNode('o1'),
        }),
        BF.fromRecord({
          v1: DF.namedNode('s2'),
          v2: DF.namedNode('p2'),
          v3: DF.namedNode('o2'),
        }),
      ]);
      expect(mediatorQuerySourceIdentifyHypermedia.mediate).toHaveBeenCalledTimes(1);
    });

    it('should run and throw on queryBoolean', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      expect(() => source.queryBoolean(AF.createAsk(<any> undefined), new ActionContext()))
        .toThrow('queryBoolean is not implemented in QuerySourceFileLazy');
    });

    it('should run and throw on queryVoid', async() => {
      const quads = streamifyArray([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
      const { source } = await actor.run({ metadata: <any> null, quads, url: 'URL', context });
      expect(source).toBeInstanceOf(QuerySourceFileLazy);
      expect(source.toString()).toBe(`QuerySourceFileLazy(URL)`);
      expect(() => source.queryVoid(AF.createCompositeUpdate([]), new ActionContext()))
        .toThrow('queryVoid is not implemented in QuerySourceFileLazy');
    });
  });
});
