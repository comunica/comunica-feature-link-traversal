import type { Readable } from 'stream';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfMetadataExtractTraversePredicates } from '../lib/ActorRdfMetadataExtractTraversePredicates';
const quad = require('rdf-quad');
const stream = require('streamify-array');

describe('ActorRdfMetadataExtractTraversePredicates', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfMetadataExtractTraversePredicates instance', () => {
    let actor: ActorRdfMetadataExtractTraversePredicates;
    let input: Readable;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraversePredicates({
        name: 'actor',
        bus,
        predicateRegexes: [
          'http://www.w3.org/ns/ldp#contains',
        ],
      });
      input = stream([
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r1', 'ex:gx'),
        quad('ex:s', 'http://www.w3.org/ns/ldp#contains', 'ex:r2'),
        quad('ex:s', 'ex:px', 'ex:r3'),
        quad('ex:s2', 'http://www.w3.org/ns/ldp#contains', 'ex:r-ignored'),
      ]);
    });

    it('should test ', () => {
      return expect(actor.test({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toEqual(true);
    });

    it('should run on a stream and return all ldp:contains values', () => {
      return expect(actor.run({ url: 'ex:s', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          metadata: {
            traverse: [
              { url: 'ex:r1' },
              { url: 'ex:r2' },
            ],
          },
        });
    });
  });
});
