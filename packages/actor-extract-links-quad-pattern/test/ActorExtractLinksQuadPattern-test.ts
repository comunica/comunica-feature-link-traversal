import type { Readable } from 'stream';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysQueryOperation } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import { ActorExtractLinksQuadPattern } from '../lib/ActorExtractLinksQuadPattern';

const quad = require('rdf-quad');
const stream = require('streamify-array');

const FACTORY = new Factory();
const DF = new DataFactory();

describe('ActorExtractLinksQuadPattern', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorExtractLinksQuadPattern module', () => {
    it('should be a function', () => {
      expect(ActorExtractLinksQuadPattern).toBeInstanceOf(Function);
    });

    it('should be a ActorExtractLinksQuadPattern constructor', () => {
      expect(new (<any> ActorExtractLinksQuadPattern)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinksQuadPattern);
      expect(new (<any> ActorExtractLinksQuadPattern)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinks);
    });

    it('should not be able to create new ActorExtractLinksQuadPattern objects without \'new\'', () => {
      expect(() => { (<any> ActorExtractLinksQuadPattern)(); }).toThrow();
    });
  });

  describe('An ActorExtractLinksQuadPattern instance with onlyVariables false', () => {
    let actor: ActorExtractLinksQuadPattern;
    let input: Readable;
    let pattern: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorExtractLinksQuadPattern({ name: 'actor', bus, onlyVariables: false });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      pattern = FACTORY.createPattern(
        DF.variable('s'),
        DF.namedNode('ex:p'),
        DF.variable('o'),
        DF.namedNode('ex:g'),
      );
      context = new ActionContext({ [KeysQueryOperation.operation.name]: pattern });
    });

    it('should fail to test without query operation in context', () => {
      context = new ActionContext({});
      return expect(actor.test({ url: '', metadata: input, requestTime: 0, context })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a quad pattern.'));
    });

    it('should fail to test with query operation of wrong type in context', () => {
      context = new ActionContext({ [KeysQueryOperation.operation.name]: FACTORY.createBgp([]) });
      return expect(actor.test({ url: '', metadata: input, requestTime: 0, context })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a quad pattern.'));
    });

    it('should test with quad pattern query operation in context', () => {
      return expect(actor.test({ url: '', metadata: input, requestTime: 0, context })).resolves.toEqual(true);
    });

    it('should run on a stream and return urls matching the pattern', () => {
      return expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            { url: 'ex:s2' },
            { url: 'ex:p' },
            { url: 'ex:g' },
            { url: 'ex:s4' },
            { url: 'ex:p' },
            { url: 'ex:o4' },
            { url: 'ex:g' },
          ],
        });
    });
  });

  describe('An ActorExtractLinksQuadPattern instance with onlyVariables true', () => {
    let actor: ActorExtractLinksQuadPattern;
    let input: Readable;
    let pattern: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorExtractLinksQuadPattern({ name: 'actor', bus, onlyVariables: true });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      pattern = FACTORY.createPattern(
        DF.variable('s'),
        DF.namedNode('ex:p'),
        DF.variable('o'),
        DF.namedNode('ex:g'),
      );
      context = new ActionContext({ [KeysQueryOperation.operation.name]: pattern });
    });

    it('should run on a stream and return urls matching the pattern', () => {
      return expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            { url: 'ex:s2' },
            { url: 'ex:s4' },
            { url: 'ex:o4' },
          ],
        });
    });
  });
});
