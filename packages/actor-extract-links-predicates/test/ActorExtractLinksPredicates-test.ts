import type { Readable } from 'node:stream';
import { ActionContext, Bus } from '@comunica/core';
import { REACHABILITY_LABEL } from '@comunica/types-link-traversal';
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

    beforeEach(() => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: true,
        predicateRegexes: [
          'http://www.w3.org/ns/ldp#contains',
        ],
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
          ],
        });
    });
    it('should run on a stream and return all ldp:contains values with annotation', async() => {
      await expect(actor.run({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: 'ex:r1' },
            { url: 'ex:r2' },
          ],
        });
    });
  });

  describe('An ActorExtractLinksTraversePredicates instance without check subject', () => {
    let actor: ActorExtractLinksPredicates;
    let input: Readable;

    beforeEach(() => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'http://www.w3.org/ns/ldp#contains',
        ],
      });
      input = stream([
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r1', 'ex:gx'),
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r2'),
        quad('ex:s', 'ex:px', 'ex:r3'),
        quad('ex:s2', 'http://www.w3.org/ns/ldp#contains', 'ex:r3'),
      ]);
    });

    it('should run on a stream and return all ldp:contains values', async() => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'http://www.w3.org/ns/ldp#contains',
        ],
        labelLinksWithReachability: true,
      });
      await expect(actor.run({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: 'ex:r1', metadata: { [REACHABILITY_LABEL]: 'cLDP' }},
            { url: 'ex:r2', metadata: { [REACHABILITY_LABEL]: 'cLDP' }},
            { url: 'ex:r3', metadata: { [REACHABILITY_LABEL]: 'cLDP' }},
          ],
        });
    });

    it('should run on a stream and return all ldp:contains values with annotation', async() => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'http://www.w3.org/ns/ldp#contains',
        ],
        labelLinksWithReachability: true,
      });
      await expect(actor.run({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: 'ex:r1', metadata: { [REACHABILITY_LABEL]: 'cLDP' }},
            { url: 'ex:r2', metadata: { [REACHABILITY_LABEL]: 'cLDP' }},
            { url: 'ex:r3', metadata: { [REACHABILITY_LABEL]: 'cLDP' }},
          ],
        });
    });
  });

  describe('generateLink', () => {
    let actor: ActorExtractLinksPredicates | undefined;
    const url = 'foo';
    beforeEach(() => {
      actor = undefined;
    });

    it('should anotate link with the common reachability given the common predicate', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'http://www.w3.org/2000/01/rdf-schema#seeAlso',
          'http://www.w3.org/2002/07/owl##sameAs',
          'http://xmlns.com/foaf/0.1/isPrimaryTopicOf',
        ],
        labelLinksWithReachability: true,
      });
      const expectedLink = { url, metadata: { [REACHABILITY_LABEL]: 'cCommon' }};
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });

    it('should anotate link with the LDP reachability given the LDP predicate', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'http://www.w3.org/ns/ldp#contains',
        ],
        labelLinksWithReachability: true,
      });
      const expectedLink = { url, metadata: { [REACHABILITY_LABEL]: 'cLDP' }};
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });

    it('should anotate link with the solid storage reachability given the solid storage predicate', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'http://www.w3.org/ns/pim/space#storage',
        ],
        labelLinksWithReachability: true,
      });
      const expectedLink = { url, metadata: { [REACHABILITY_LABEL]: 'cSolidStorage' }};
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });

    it('should anotate link with cPredicateNothing reachability given no predicate', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
        ],
        labelLinksWithReachability: true,
      });
      const expectedLink = { url, metadata: { [REACHABILITY_LABEL]: 'cPredicateNothing' }};
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });

    it('should anotate link with a reachability given a predicate ', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'foo',
        ],
        labelLinksWithReachability: true,
      });
      const expectedLink = { url, metadata: { [REACHABILITY_LABEL]: 'cPredicate_foo' }};
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });

    it('should anotate link with a reachability given multiple predicates ', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'foo',
          'bar',
          'boo',
        ],
        labelLinksWithReachability: true,
      });
      const expectedLink = { url, metadata: { [REACHABILITY_LABEL]: 'cPredicate_foo_bar_boo' }};
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });

    it('should not anotate a link given the flag is set to fake', () => {
      actor = new ActorExtractLinksPredicates({
        name: 'actor',
        bus,
        checkSubject: false,
        predicateRegexes: [
          'foo',
          'bar',
          'boo',
        ],
        labelLinksWithReachability: false,
      });
      const expectedLink = { url };
      expect(actor.generateLink(url)).toStrictEqual(expectedLink);
    });
  });
});
