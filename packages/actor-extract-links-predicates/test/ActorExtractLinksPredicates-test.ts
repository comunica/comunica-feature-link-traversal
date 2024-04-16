import type { Readable } from 'node:stream';
import { ActionContext, Bus } from '@comunica/core';
import { PRODUCED_BY_ACTOR } from '@comunica/types-link-traversal';
import { ActorExtractLinksPredicates } from '../lib/ActorExtractLinksPredicates';

const quad = require('rdf-quad');
const stream = require('streamify-array');

describe('ActorExtractLinksTraversePredicates', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorExtractLinksTraversePredicates instance with check subject', () => {
    let actor: ActorExtractLinksPredicates;
    let input: Readable;
    let predicateRegexes: string[];

    beforeEach(() => {
      predicateRegexes = [
        'http://www.w3.org/ns/ldp#contains',
      ];
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: true,
        predicateRegexes,
      });
      input = stream([
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r1', 'ex:gx'),
        quad('ex:s#abc', 'http://www.w3.org/ns/ldp#contains', 'ex:r2'),
        quad('ex:s', 'ex:px', 'ex:r3'),
        quad('ex:s2', 'http://www.w3.org/ns/ldp#contains', 'ex:r3'),
      ]);
    });

    it('should test ', async() => {
      await expect(actor.test({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toBe(true);
    });

    it('should run on a stream and return all ldp:contains values', async() => {
      await expect(actor.run({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: 'ex:r1' },
            { url: 'ex:r2' },
          ].map((link) => {
            return {
              ...link,
              metadata: {
                [PRODUCED_BY_ACTOR]: {
                  name: actor.name,
                  predicates: predicateRegexes,
                  matchingPredicate: 'http://www.w3.org/ns/ldp#contains',
                  checkSubject: true,
                },
              },
            };
          }),
        });
    });
  });

  describe('An ActorExtractLinksTraversePredicates instance without check subject', () => {
    let actor: ActorExtractLinksPredicates;
    let input: Readable;
    let predicateRegexes: string[];

    beforeEach(() => {
      predicateRegexes = [
        'http://www.w3.org/ns/ldp#contains',
      ];
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes,
      });
      input = stream([
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r1', 'ex:gx'),
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r2'),
        quad('ex:s', 'ex:px', 'ex:r3'),
        quad('ex:s2', 'http://www.w3.org/ns/ldp#contains', 'ex:r3'),
      ]);
    });

    it('should run on a stream and return all ldp:contains values', async() => {
      await expect(actor.run({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: 'ex:r1' },
            { url: 'ex:r2' },
            { url: 'ex:r3' },
          ].map((link) => {
            return {
              ...link,
              metadata: {
                [PRODUCED_BY_ACTOR]: {
                  name: actor.name,
                  predicates: predicateRegexes,
                  matchingPredicate: 'http://www.w3.org/ns/ldp#contains',
                  checkSubject: false,
                },
              },
            };
          }),
        });
    });
  });
});
