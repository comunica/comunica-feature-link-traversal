import type { Readable } from 'stream';
import { ActionContext, Bus } from '@comunica/core';
import { ActorExtractLinksHeaders } from '../lib/ActorExtractLinksHeaders';

const quad = require('rdf-quad');
const stream = require('streamify-array');

describe('ActorExtractLinksHeaders', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorExtractLinksHeaders instance with check subject', () => {
    let actor: ActorExtractLinksHeaders;
    let metadata: Readable;
    let input: Headers;

    beforeEach(() => {
      actor = new ActorExtractLinksHeaders({
        name: 'actor',
        bus,
        //checkSubject: true,
        headersRegexes: [
          'rel="describedby"',
        ],
      });
      metadata=  stream([]); 
      input =  new Headers();
      input.append("Content-Type","text-turtle");
      input.append("Location","/storage/resource");
      input.append("Content-Length","1024")
      input.append("Link","</storage/resource.meta>;rel=\"describedby\"");
    });

    it('should test ', () => {
      return expect(actor.test({ url: 'ex:s', metadata:metadata, headers: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toEqual(true);
    });

    it('should run on headers and return all describedby values', () => {
      return expect(actor.run({ url: 'ex:s',metadata:metadata, headers: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: '/storage/resource.meta' },
          ],
        });
    });
  });
});
