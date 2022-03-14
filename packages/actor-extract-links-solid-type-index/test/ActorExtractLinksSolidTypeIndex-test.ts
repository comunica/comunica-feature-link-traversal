import type { Readable } from 'stream';
import type { ActorInitQuery } from '@comunica/actor-init-query';
import { BindingsFactory } from '@comunica/bindings-factory';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import { ActionContext, Bus } from '@comunica/core';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { ActorExtractLinksSolidTypeIndex } from '../lib/ActorExtractLinksSolidTypeIndex';
const quad = require('rdf-quad');
const stream = require('streamify-array');

const DF = new DataFactory();
const BF = new BindingsFactory();

describe('ActorExtractLinksSolidTypeIndex', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorExtractLinksSolidTypeIndex instance', () => {
    let actor: ActorExtractLinksSolidTypeIndex;
    let mediatorDereferenceRdf: MediatorDereferenceRdf;
    let actorInitQuery: ActorInitQuery;
    let input: Readable;
    let context: ActionContext;

    beforeEach(() => {
      mediatorDereferenceRdf = <any> {
        mediate: jest.fn(async() => ({
          data: new ArrayIterator([], { autoStart: false }),
        })),
      };
      actorInitQuery = <any> {};
      actor = new ActorExtractLinksSolidTypeIndex({
        name: 'actor',
        bus,
        typeIndexPredicates: [
          'ex:typeIndex1',
          'ex:typeIndex2',
        ],
        mediatorDereferenceRdf,
        actorInitQuery,
      });
      (<any> actor).queryEngine = {
        queryBindings: jest.fn(async() => ({
          toArray: async() => [
            BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
            BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
          ],
        })),
      };
      input = stream([]);
      context = new ActionContext();
    });

    it('should test', () => {
      return expect(actor.test(<any>{})).resolves.toBeTruthy();
    });

    it('should run on an empty stream', () => {
      return expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [],
        });
    });

    it('should run on a stream without type index predicates', () => {
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      return expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [],
        });
    });

    it('should run on a stream with type index predicates', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s2', 'ex:typeIndex2', 'ex:index2'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
              metadata: { class: 'ex:class1' },
            },
            {
              url: 'ex:file2',
              metadata: { class: 'ex:class2' },
            },
            {
              url: 'ex:file1',
              metadata: { class: 'ex:class1' },
            },
            {
              url: 'ex:file2',
              metadata: { class: 'ex:class2' },
            },
          ],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(2);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index2', context });
    });
  });
});
