import type { Readable } from 'stream';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import { Bus } from '@comunica/core';
import { ActorRdfMetadataExtractTraverseAll } from '../lib/ActorRdfMetadataExtractTraverseAll';
const quad = require('rdf-quad');
const stream = require('streamify-array');

describe('ActorRdfMetadataExtractTraverseAll', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfMetadataExtractTraverseAll module', () => {
    it('should be a function', () => {
      expect(ActorRdfMetadataExtractTraverseAll).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfMetadataExtractTraverseAll constructor', () => {
      expect(new (<any> ActorRdfMetadataExtractTraverseAll)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtractTraverseAll);
      expect(new (<any> ActorRdfMetadataExtractTraverseAll)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtract);
    });

    it('should not be able to create new ActorRdfMetadataExtractTraverseAll objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfMetadataExtractTraverseAll)(); }).toThrow();
    });
  });

  describe('An ActorRdfMetadataExtractTraverseAll instance', () => {
    let actor: ActorRdfMetadataExtractTraverseAll;
    let input: Readable;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseAll({ name: 'actor', bus });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
    });

    it('should test ', () => {
      return expect(actor.test({ url: '', metadata: input })).resolves.toEqual(true);
    });

    it('should run on a stream and return all urls', () => {
      return expect(actor.run({ url: '', metadata: input })).resolves
        .toEqual({
          metadata: {
            traverse: [
              { url: 'ex:s1' },
              { url: 'ex:px' },
              { url: 'ex:o1' },
              { url: 'ex:gx' },
              { url: 'ex:s2' },
              { url: 'ex:p' },
              { url: 'ex:g' },
              { url: 'ex:s3' },
              { url: 'ex:px' },
              { url: 'ex:o3' },
              { url: 'ex:gx' },
              { url: 'ex:s4' },
              { url: 'ex:p' },
              { url: 'ex:o4' },
              { url: 'ex:g' },
              { url: 'ex:s5' },
              { url: 'ex:p' },
              { url: 'ex:o5' },
              { url: 'ex:gx' },
            ],
          },
        });
    });
  });
});
