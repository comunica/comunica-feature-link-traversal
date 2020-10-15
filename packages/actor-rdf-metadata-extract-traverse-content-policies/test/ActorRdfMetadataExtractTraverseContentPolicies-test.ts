import type { Readable } from 'stream';
import { Bindings } from '@comunica/bus-query-operation';
import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import { ActorRdfMetadataExtractTraverseContentPolicies, ContentPolicy } from '..';
const quad = require('rdf-quad');
const stream = require('streamify-array');
const factory = new Factory();
const DF = new DataFactory();

describe('ActorRdfMetadataExtractTraverseContentPolicies', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfMetadataExtractTraverseContentPolicies instance', () => {
    let queryEngine: any;
    let actor: ActorRdfMetadataExtractTraverseContentPolicies;
    let input: Readable;

    beforeEach(() => {
      queryEngine = {
        query: jest.fn(() => ({
          bindings: () => [
            Bindings({ '?varA': DF.namedNode('ex:match1') }),
            Bindings({ '?varA': DF.blankNode('ex:match2'), '?varB': DF.namedNode('ex:match2Bis') }),
            Bindings({ '?varA': DF.namedNode('ex:match3') }),
          ],
        })),
      };
      actor = new ActorRdfMetadataExtractTraverseContentPolicies({ name: 'actor', bus, queryEngine });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
    });

    it('should test', () => {
      return expect(actor.test({ url: '', metadata: input })).resolves.toEqual(true);
    });

    it('should run without context', () => {
      return expect(actor.run({ url: '', metadata: input })).resolves.toEqual({
        metadata: {
          traverse: [],
        },
      });
    });

    it('should run with empty context', () => {
      const context = ActionContext({});
      return expect(actor.run({ url: '', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [],
        },
      });
    });

    it('should run with one content policy that produces no matches', () => {
      const context = ActionContext({
        contentPolicies: [
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varUnknown'),
              ),
            ]),
            [{ name: 'varUnknown', withPolicies: false }],
          ),
        ],
      });
      return expect(actor.run({ url: '', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [],
        },
      });
    });

    it('should run with one content policy that produces matches', () => {
      const context = ActionContext({
        contentPolicies: [
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varA'),
              ),
            ]),
            [{ name: 'varA', withPolicies: false }],
          ),
        ],
      });
      return expect(actor.run({ url: '', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [
            'ex:match1',
            'ex:match3',
          ],
        },
      });
    });

    it('should run with two content policies that produce matches', () => {
      const context = ActionContext({
        contentPolicies: [
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varA'),
              ),
            ]),
            [{ name: 'varA', withPolicies: false }],
          ),
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varB'),
              ),
            ]),
            [{ name: 'varB', withPolicies: false }],
          ),
        ],
      });
      return expect(actor.run({ url: '', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [
            'ex:match1',
            'ex:match3',
            'ex:match2Bis',
          ],
        },
      });
    });
  });
});
