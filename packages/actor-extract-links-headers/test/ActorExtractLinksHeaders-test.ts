import type { Readable } from 'node:stream';
import { ActionContext, Bus } from '@comunica/core';
import { ActorExtractLinksHeaders } from '../lib/ActorExtractLinksHeaders';
import '@comunica/utils-jest';

const quad = require('rdf-quad');
const stream = require('streamify-array');

describe('ActorExtractLinksHeaders', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorExtractLinksHeaders instance with check subject', () => {
    let actor: ActorExtractLinksHeaders;
    let inputMetadata: Readable;
    let input: Headers;

    beforeEach(() => {
      actor = new ActorExtractLinksHeaders({
        name: 'actor',
        bus,
        headersRegexes: [
          'rel="describedby"',
        ],
      });
      inputMetadata = stream([]);
      input = new Headers();
      input.append('Content-Type', 'text-turtle');
      input.append('Location', '/storage/resource');
      input.append('Content-Length', '1024');
      input.append('Link', '</storage/resource.meta>;rel="describedby"');
    });

    it('should test ', async() => {
      await expect(actor.test({ url: 'http://pod.example.com/storage/resource', metadata: inputMetadata, headers: input, requestTime: 0, context: new ActionContext() }))
        .resolves.toPassTestVoid();
    });

    it('should run on headers and return all describedby values', async() => {
      await expect(actor.run({ url: 'http://pod.example.com/storage/resource', metadata: inputMetadata, headers: input, requestTime: 0, context: new ActionContext() })).resolves
        .toEqual({
          links: [
            { url: 'http://pod.example.com/storage/resource.meta' },
          ],
        });
    });
  });
});
