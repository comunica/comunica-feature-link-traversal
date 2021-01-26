import type { Readable } from 'stream';
import { Bindings } from '@comunica/bus-query-operation';
import { ActionContext, Bus } from '@comunica/core';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import {
  ActorRdfMetadataExtractTraverseContentPolicies,
  ContentPolicy,
  KEY_CONTEXT_POLICIES,
  KEY_CONTEXT_WITHPOLICIES,
} from '..';
const arrayifyStream = require('arrayify-stream');
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
        query: jest.fn(pattern => {
          if (typeof pattern === 'string') {
            // Query in getContentPoliciesFromDocument
            return {
              bindings() {
                if (pattern.includes('one_policy')) {
                  return Promise.resolve([
                    Bindings({ '?scope': DF.literal(`
      FOLLOW (?varA WITH POLICIES) {
        <> <ex:p> ?varA.
      }`) }),
                  ]);
                }
                if (pattern.includes('two_policies')) {
                  return Promise.resolve([
                    Bindings({ '?scope': DF.literal(`
      FOLLOW (?varA WITH POLICIES) {
        <> <ex:p> ?varA.
      }`) }),
                    Bindings({ '?scope': DF.literal(`
      FOLLOW ?varB {
        <> <ex:p> ?varB.
      }`) }),
                  ]);
                }
                return Promise.resolve([]);
              },
            };
          }
          if (pattern.type === 'construct') {
            // INCLUDE filter
            return {
              quadStream: new ArrayIterator([
                DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
              ]),
            };
          }
          // FOLLOW clause
          return {
            bindings: () => [
              Bindings({ '?varA': DF.namedNode('ex:match1') }),
              Bindings({ '?varA': DF.blankNode('ex:match2'), '?varB': DF.namedNode('ex:match2Bis') }),
              Bindings({ '?varA': DF.namedNode('ex:match3') }),
            ],
          };
        }),
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
        [KEY_CONTEXT_POLICIES]: [
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
        [KEY_CONTEXT_POLICIES]: [
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
            { url: 'ex:match1' },
            { url: 'ex:match3' },
          ],
        },
      });
    });

    it('should run with two content policies that produce matches', () => {
      const context = ActionContext({
        [KEY_CONTEXT_POLICIES]: [
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
            { url: 'ex:match1' },
            { url: 'ex:match3' },
            { url: 'ex:match2Bis' },
          ],
        },
      });
    });

    it('should run with one content policy with a filter that produces matches', async() => {
      const filter = factory.createConstruct(
        factory.createBgp([
          factory.createPattern(
            DF.variable('friend'),
            DF.namedNode('http://xmlns.com/foaf/0.1/name'),
            DF.variable('name'),
          ),
        ]),
        [
          factory.createPattern(
            DF.variable('friend'),
            DF.namedNode('http://xmlns.com/foaf/0.1/name'),
            DF.variable('name'),
          ),
        ],
      );
      const context = ActionContext({
        [KEY_CONTEXT_POLICIES]: [
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varA'),
              ),
            ]),
            [{ name: 'varA', withPolicies: false }],
            filter,
          ),
        ],
      });

      const result = await actor.run({ url: '', metadata: input, context });
      expect(result).toEqual({
        metadata: {
          traverse: [
            { url: 'ex:match1', transform: expect.anything() },
            { url: 'ex:match3', transform: expect.anything() },
          ],
        },
      });
      expect(result.metadata.traverse[0].transform).toBeInstanceOf(Function);
      expect(result.metadata.traverse[1].transform).toBeInstanceOf(Function);

      expect(queryEngine.query).toHaveBeenCalledTimes(1);
      expect(await arrayifyStream(await result.metadata.traverse[0].transform(new ArrayIterator()))).toEqual([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      ]);
      expect(queryEngine.query).toHaveBeenCalledTimes(2);
      expect(queryEngine.query).toHaveBeenNthCalledWith(2, filter, { sources: [ expect.anything() ]});
      expect(await arrayifyStream(await result.metadata.traverse[1].transform(new ArrayIterator()))).toEqual([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      ]);
      expect(queryEngine.query).toHaveBeenCalledTimes(3);
      expect(queryEngine.query).toHaveBeenNthCalledWith(3, filter, { sources: [ expect.anything() ]});
    });

    it('should run with one content policy that produces withPolicies matches', () => {
      const context = ActionContext({
        [KEY_CONTEXT_POLICIES]: [
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varA'),
              ),
            ]),
            [{ name: 'varA', withPolicies: true }],
          ),
        ],
      });
      return expect(actor.run({ url: '', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'ex:match1', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
            { url: 'ex:match3', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
          ],
        },
      });
    });

    it('should run withPolicies with one content policy over a doc without policies', () => {
      const context = ActionContext({
        [KEY_CONTEXT_WITHPOLICIES]: true,
      });
      return expect(actor.run({ url: 'no_policies', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [],
        },
      });
    });

    it('should run withPolicies with one content policy over a doc with one policy', () => {
      const context = ActionContext({
        [KEY_CONTEXT_WITHPOLICIES]: true,
      });
      return expect(actor.run({ url: 'one_policy', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'ex:match1', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
            { url: 'ex:match3', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
          ],
        },
      });
    });

    it('should run withPolicies with one content policy over a doc with two policies', () => {
      const context = ActionContext({
        [KEY_CONTEXT_WITHPOLICIES]: true,
      });
      return expect(actor.run({ url: 'two_policies', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'ex:match1', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
            { url: 'ex:match3', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
            { url: 'ex:match2Bis' },
          ],
        },
      });
    });

    it('should run withPolicies with one content policy over a doc with one policy and an input policy', () => {
      const context = ActionContext({
        [KEY_CONTEXT_WITHPOLICIES]: true,
        [KEY_CONTEXT_POLICIES]: [
          new ContentPolicy(
            factory.createBgp([
              factory.createPattern(
                DF.namedNode('ex:s'),
                DF.namedNode('ex:p'),
                DF.variable('varA'),
              ),
            ]),
            [{ name: 'varB', withPolicies: false }],
          ),
        ],
      });
      return expect(actor.run({ url: 'one_policy', metadata: input, context })).resolves.toEqual({
        metadata: {
          traverse: [
            { url: 'ex:match2Bis' },
            { url: 'ex:match1', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
            { url: 'ex:match3', context: ActionContext({ [KEY_CONTEXT_WITHPOLICIES]: true }) },
          ],
        },
      });
    });
  });
});
