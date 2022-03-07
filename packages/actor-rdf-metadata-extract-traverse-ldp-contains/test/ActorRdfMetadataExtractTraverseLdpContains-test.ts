import type { Readable } from 'stream';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfMetadataExtractTraverseLdpContains } from '../lib/ActorRdfMetadataExtractTraverseLdpContains';
const quad = require('rdf-quad');
const stream = require('streamify-array');

describe('ActorRdfMetadataExtractTraverseLdpContains', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfMetadataExtractTraverseLdpContains instance', () => {
    let actor: ActorRdfMetadataExtractTraverseLdpContains;
    let input: Readable;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseLdpContains({ name: 'actor', bus });
      input = stream([
        quad('ex:s1', 'http://www.w3.org/ns/ldp#contains', 'ex:r1', 'ex:gx'),
        quad('ex:s2', 'http://www.w3.org/ns/ldp#contains', 'ex:r2'),
        quad('ex:s3', 'ex:px', 'ex:r3'),
      ]);
    });

    it('should test ', () => {
      return expect(actor.test({ url: '', metadata: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toEqual(true);
    });

    it('should run on a stream and return all ldp:contains values', () => {
      return expect(actor.run({ url: '', metadata: input, requestTime: 0, context: new ActionContext() })).resolves
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
