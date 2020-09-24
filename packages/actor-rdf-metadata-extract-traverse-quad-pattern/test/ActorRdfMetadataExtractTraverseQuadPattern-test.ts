import { Readable } from 'stream';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import { ActionContext, Bus } from '@comunica/core';
import { namedNode, variable } from '@rdfjs/data-model';
import { Factory } from 'sparqlalgebrajs';
import {
  ActorRdfMetadataExtractTraverseQuadPattern,
  KEY_CONTEXT_QUERYOPERATION,
} from '../lib/ActorRdfMetadataExtractTraverseQuadPattern';
const quad = require('rdf-quad');
const stream = require('streamify-array');

const FACTORY = new Factory();

describe('ActorRdfMetadataExtractTraverseQuadPattern', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfMetadataExtractTraverseQuadPattern module', () => {
    it('should be a function', () => {
      expect(ActorRdfMetadataExtractTraverseQuadPattern).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfMetadataExtractTraverseQuadPattern constructor', () => {
      expect(new (<any> ActorRdfMetadataExtractTraverseQuadPattern)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtractTraverseQuadPattern);
      expect(new (<any> ActorRdfMetadataExtractTraverseQuadPattern)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtract);
    });

    it('should not be able to create new ActorRdfMetadataExtractTraverseQuadPattern objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfMetadataExtractTraverseQuadPattern)(); }).toThrow();
    });
  });

  describe('An ActorRdfMetadataExtractTraverseQuadPattern instance', () => {
    let actor: ActorRdfMetadataExtractTraverseQuadPattern;
    let input: Readable;
    let pattern: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseQuadPattern({ name: 'actor', bus });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      pattern = FACTORY.createPattern(
        variable('s'),
        namedNode('ex:p'),
        variable('o'),
        namedNode('ex:g'),
      );
      context = ActionContext({ [KEY_CONTEXT_QUERYOPERATION]: pattern });
    });

    it('should fail to test with undefined context', () => {
      return expect(actor.test({ url: '', metadata: input })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a quad pattern.'));
    });

    it('should fail to test without query operation in context', () => {
      context = ActionContext({});
      return expect(actor.test({ url: '', metadata: input, context })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a quad pattern.'));
    });

    it('should fail to test with query operation of wrong type in context', () => {
      context = ActionContext({ [KEY_CONTEXT_QUERYOPERATION]: FACTORY.createBgp([]) });
      return expect(actor.test({ url: '', metadata: input, context })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a quad pattern.'));
    });

    it('should test with quad pattern query operation in context', () => {
      return expect(actor.test({ url: '', metadata: input, context })).resolves.toEqual(true);
    });

    it('should run on a stream and return urls matching the pattern', () => {
      return expect(actor.run({ url: '', metadata: input, context })).resolves
        .toEqual({
          metadata: {
            traverse: [ 'ex:s2', 'ex:p', 'ex:g', 'ex:s4', 'ex:p', 'ex:o4', 'ex:g' ],
          },
        });
    });
  });
});