import type { Readable } from 'node:stream';
import { BindingsFactory } from '@comunica/bindings-factory';
import { KeysQueryOperation } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import arrayifyStream from 'arrayify-stream';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import {
  ActorExtractLinksContentPolicies,
  ContentPolicy,
  KEY_CONTEXT_POLICIES,
  KEY_CONTEXT_WITHPOLICIES,
} from '..';

const quad = require('rdf-quad');
const stream = require('streamify-array');

const factory = new Factory();
const DF = new DataFactory();
const BF = new BindingsFactory(DF);

describe('ActorExtractLinksContentPolicies', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorExtractLinksContentPolicies instance', () => {
    let queryEngine: any;
    let actor: ActorExtractLinksContentPolicies;
    let input: Readable;

    beforeEach(() => {
      queryEngine = {
        queryQuads: jest.fn(() => {
          // INCLUDE filter
          return new ArrayIterator([
            DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
          ]);
        }),
        queryBindings: jest.fn((pattern) => {
          if (typeof pattern === 'string') {
            // Query in getContentPoliciesFromDocument
            return {
              toArray() {
                if (pattern.includes('one_policy')) {
                  return Promise.resolve([
                    BF.bindings([
                      [ DF.variable('scope'), DF.literal(`
      FOLLOW (?varA WITH POLICIES) {
        <> <ex:p> ?varA.
      }`) ],
                    ]),
                  ]);
                }
                if (pattern.includes('two_policies')) {
                  return Promise.resolve([
                    BF.bindings([
                      [ DF.variable('scope'), DF.literal(`
      FOLLOW (?varA WITH POLICIES) {
        <> <ex:p> ?varA.
      }`) ],
                    ]),
                    BF.bindings([
                      [ DF.variable('scope'), DF.literal(`
      FOLLOW ?varB {
        <> <ex:p> ?varB.
      }`) ],
                    ]),
                  ]);
                }
                if (pattern.includes('two_includes')) {
                  return Promise.resolve([
                    BF.bindings([
                      [ DF.variable('scope'), DF.literal(`
      FOLLOW (?varA WITH POLICIES) {
        <> <ex:p> ?varA.
      } INCLUDE WHERE {
        <> <ex:p1> ?varA.
      }`) ],
                    ]),
                    BF.bindings([
                      [ DF.variable('scope'), DF.literal(`
      FOLLOW ?varB {
        <> <ex:p> ?varB.
      } INCLUDE WHERE {
        <> <ex:p2> ?varA.
      }`) ],
                    ]),
                  ]);
                }
                return Promise.resolve([]);
              },
            };
          }
          // FOLLOW clause
          return {
            toArray: () => [
              BF.bindings([[ DF.variable('varA'), DF.namedNode('ex:match1') ]]),
              BF.bindings([
                [ DF.variable('varA'), DF.blankNode('ex:match2') ],
                [ DF.variable('varB'), DF.namedNode('ex:match2Bis') ],
              ]),
              BF.bindings([[ DF.variable('varA'), DF.namedNode('ex:match3') ]]),
            ],
          };
        }),
      };
      actor = new ActorExtractLinksContentPolicies({
        name: 'actor',
        bus,
        actorInitQuery: <any> {},
        traverseConditional: false,
      });
      (<any> actor).queryEngine = queryEngine;
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
    });

    it('should test', async() => {
      await expect(actor.test({ url: '', metadata: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toBe(true);
    });

    it('should run without context', async() => {
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toEqual({
          links: [],
        });
    });

    it('should run with empty context', async() => {
      const context = new ActionContext({});
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [],
      });
    });

    it('should run with one content policy that produces no matches', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_POLICIES.name]: [
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
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [],
      });
    });

    it('should run with one content policy that produces matches', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_POLICIES.name]: [
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
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          {
            url: 'ex:match1',
            transform: undefined,
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }),
          },
          {
            url: 'ex:match3',
            transform: undefined,
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }),
          },
        ],
      });
    });

    it('should run with one content policy that produces matches and traverseConditional', async() => {
      actor = new ActorExtractLinksContentPolicies({
        name: 'actor',
        bus,
        actorInitQuery: <any> {},
        traverseConditional: true,
      });
      (<any> actor).queryEngine = queryEngine;
      const context = new ActionContext({
        [KEY_CONTEXT_POLICIES.name]: [
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
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [],
        linksConditional: [
          {
            url: 'ex:match1',
            transform: undefined,
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }),
          },
          {
            url: 'ex:match3',
            transform: undefined,
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }),
          },
        ],
      });
    });

    it('should run with two content policies that produce matches', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_POLICIES.name]: [
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
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          { url: 'ex:match1', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
          { url: 'ex:match3', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
          { url: 'ex:match2Bis', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
        ],
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
      const context = new ActionContext({
        [KEY_CONTEXT_POLICIES.name]: [
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

      const result = await actor.run({ url: '', metadata: input, requestTime: 0, context });
      expect(result).toEqual({
        links: [
          {
            url: 'ex:match1',
            transform: expect.anything(),
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }),
          },
          {
            url: 'ex:match3',
            transform: expect.anything(),
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }),
          },
        ],
      });
      expect(result.links[0].transform).toBeInstanceOf(Function);
      expect(result.links[1].transform).toBeInstanceOf(Function);

      expect(queryEngine.queryBindings).toHaveBeenCalledTimes(1);
      expect(queryEngine.queryQuads).toHaveBeenCalledTimes(0);
      await expect(arrayifyStream(await result.links[0].transform!(new ArrayIterator()))).resolves.toEqual([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      ]);
      expect(queryEngine.queryBindings).toHaveBeenCalledTimes(1);
      expect(queryEngine.queryQuads).toHaveBeenCalledTimes(1);
      expect(queryEngine.queryQuads).toHaveBeenNthCalledWith(1, filter, {
        sources: [ expect.anything() ],
        initialBindings: BF.bindings([[ DF.variable('varA'), DF.namedNode('ex:match1') ]]),
      });
      await expect(arrayifyStream(await result.links[1].transform!(new ArrayIterator()))).resolves.toEqual([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      ]);
      expect(queryEngine.queryBindings).toHaveBeenCalledTimes(1);
      expect(queryEngine.queryQuads).toHaveBeenCalledTimes(2);
      expect(queryEngine.queryQuads).toHaveBeenNthCalledWith(2, filter, {
        sources: [ expect.anything() ],
        initialBindings: BF.bindings([[ DF.variable('varA'), DF.namedNode('ex:match3') ]]),
      });
    });

    it('should run with one content policy that produces withPolicies matches', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_POLICIES.name]: [
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
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          { url: 'ex:match1', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
          { url: 'ex:match3', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
        ],
      });
    });

    it('should run withPolicies with one content policy over a doc without policies', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_WITHPOLICIES.name]: true,
      });
      await expect(actor.run({ url: 'no_policies', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [],
      });
    });

    it('should run withPolicies with one content policy over a doc with one policy', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_WITHPOLICIES.name]: true,
      });
      await expect(actor.run({ url: 'one_policy', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          { url: 'ex:match1', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
          { url: 'ex:match3', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
        ],
      });
    });

    it('should run withPolicies with one content policy over a doc with two policies', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_WITHPOLICIES.name]: true,
      });
      await expect(actor.run({ url: 'two_policies', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          { url: 'ex:match1', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
          { url: 'ex:match3', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
          { url: 'ex:match2Bis', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
        ],
      });
    });

    it('should run withPolicies with one content policy over a doc with one policy and an input policy', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_WITHPOLICIES.name]: true,
        [KEY_CONTEXT_POLICIES.name]: [
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
      await expect(actor.run({ url: 'one_policy', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          { url: 'ex:match2Bis', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
          { url: 'ex:match1', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
          { url: 'ex:match3', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
        ],
      });
    });

    it('should run over a doc with two policies with include', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_WITHPOLICIES.name]: true,
      });
      await expect(actor.run({ url: 'two_policies_include', metadata: input, requestTime: 0, context }))
        .resolves.toEqual({
          links: [
            { url: 'ex:match1', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
            { url: 'ex:match3', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }) },
            { url: 'ex:match2Bis', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
          ],
        });
    });

    it('should run with current quad pattern over a doc with two policies and match include', async() => {
      const context = new ActionContext({
        [KEY_CONTEXT_WITHPOLICIES.name]: true,
        [KeysQueryOperation.operation.name]: factory.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:p1'),
          DF.variable('o'),
        ),
      });
      await expect(actor.run({ url: 'two_includes', metadata: input, requestTime: 0, context })).resolves.toEqual({
        links: [
          {
            url: 'ex:match1',
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }),
            transform: expect.anything(),
          },
          {
            url: 'ex:match3',
            context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: true }),
            transform: expect.anything(),
          },
          // URL match2Bis will not match the query operation pattern
          // { url: 'ex:match2Bis', context: new ActionContext({ [KEY_CONTEXT_WITHPOLICIES.name]: false }) },
        ],
      });
    });

    describe('isContentPolicyApplicableForPattern', () => {
      it('should be true for no filter', () => {
        expect(ActorExtractLinksContentPolicies.isContentPolicyApplicableForPattern(
          new ContentPolicy(
            factory.createBgp([]),
            [{ name: 'varUnknown', withPolicies: false }],
          ),
          factory.createPattern(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.variable('varUnknown'),
          ),
        )).toBeTruthy();
      });

      it('should be true for no query pattern', () => {
        expect(ActorExtractLinksContentPolicies.isContentPolicyApplicableForPattern(
          new ContentPolicy(
            factory.createBgp([]),
            [{ name: 'varUnknown', withPolicies: false }],
            factory.createConstruct(<any> undefined, <any> undefined),
          ),
        )).toBeTruthy();
      });

      it('should be false for no policy patterns matching query pattern', () => {
        expect(ActorExtractLinksContentPolicies.isContentPolicyApplicableForPattern(
          new ContentPolicy(
            factory.createBgp([]),
            [{ name: 'varUnknown', withPolicies: false }],
            factory.createConstruct(<any> undefined, [
              factory.createPattern(
                DF.namedNode('ex:s1'),
                DF.namedNode('ex:p1'),
                DF.variable('varUnknown'),
              ),
              factory.createPattern(
                DF.namedNode('ex:s2'),
                DF.namedNode('ex:p2'),
                DF.variable('varUnknown'),
              ),
            ]),
          ),
          factory.createPattern(
            DF.variable('varS'),
            DF.namedNode('ex:p3'),
            DF.variable('varUnknown'),
          ),
        )).toBeFalsy();
      });

      it('should be true for policy pattern matching query pattern', () => {
        expect(ActorExtractLinksContentPolicies.isContentPolicyApplicableForPattern(
          new ContentPolicy(
            factory.createBgp([]),
            [{ name: 'varUnknown', withPolicies: false }],
            factory.createConstruct(<any> undefined, [
              factory.createPattern(
                DF.namedNode('ex:s1'),
                DF.namedNode('ex:p1'),
                DF.variable('varUnknown'),
              ),
              factory.createPattern(
                DF.namedNode('ex:s2'),
                DF.namedNode('ex:p2'),
                DF.variable('varUnknown'),
              ),
            ]),
          ),
          factory.createPattern(
            DF.variable('varS'),
            DF.namedNode('ex:p1'),
            DF.variable('varUnknown'),
          ),
        )).toBeTruthy();
      });

      it('should be true for query pattern matching policy pattern', () => {
        expect(ActorExtractLinksContentPolicies.isContentPolicyApplicableForPattern(
          new ContentPolicy(
            factory.createBgp([]),
            [{ name: 'varUnknown', withPolicies: false }],
            factory.createConstruct(<any> undefined, [
              factory.createPattern(
                DF.variable('varS'),
                DF.namedNode('ex:p1'),
                DF.variable('varUnknown'),
              ),
              factory.createPattern(
                DF.variable('varS'),
                DF.namedNode('ex:p2'),
                DF.variable('varUnknown'),
              ),
            ]),
          ),
          factory.createPattern(
            DF.namedNode('ex:s1'),
            DF.namedNode('ex:p2'),
            DF.variable('varUnknown'),
          ),
        )).toBeTruthy();
      });
    });
  });
});
