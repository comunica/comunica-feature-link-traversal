import type { Readable } from 'stream';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import { KeysInitSparql } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import {
  ActorRdfMetadataExtractTraverseQuadPatternQuery,
} from '../lib/ActorRdfMetadataExtractTraverseQuadPatternQuery';
const quad = require('rdf-quad');
const stream = require('streamify-array');

const FACTORY = new Factory();
const DF = new DataFactory();

describe('ActorRdfMetadataExtractTraverseQuadPatternQuery', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfMetadataExtractTraverseQuadPatternQuery module', () => {
    it('should be a function', () => {
      expect(ActorRdfMetadataExtractTraverseQuadPatternQuery).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfMetadataExtractTraverseQuadPatternQuery constructor', () => {
      expect(new (<any> ActorRdfMetadataExtractTraverseQuadPatternQuery)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtractTraverseQuadPatternQuery);
      expect(new (<any> ActorRdfMetadataExtractTraverseQuadPatternQuery)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtract);
    });

    it('should not be able to create new ActorRdfMetadataExtractTraverseQuadPatternQuery objects without \'new\'',
      () => {
        expect(() => {
          (<any>ActorRdfMetadataExtractTraverseQuadPatternQuery)();
        }).toThrow();
      });
  });

  describe('An ActorRdfMetadataExtractTraverseQuadPatternQuery instance with onlyVariables false', () => {
    let actor: ActorRdfMetadataExtractTraverseQuadPatternQuery;
    let input: Readable;
    let operation: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseQuadPatternQuery({ name: 'actor', bus, onlyVariables: false });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      operation = FACTORY.createBgp([
        FACTORY.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
      ]);
      context = ActionContext({ [KeysInitSparql.query]: operation });
    });

    it('should fail to test with undefined context', () => {
      return expect(actor.test({ url: '', metadata: input })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a query.'));
    });

    it('should fail to test without query operation in context', () => {
      context = ActionContext({});
      return expect(actor.test({ url: '', metadata: input, context })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a query.'));
    });

    it('should test with quad pattern query operation in context', () => {
      return expect(actor.test({ url: '', metadata: input, context })).resolves.toEqual(true);
    });

    it('should run on a stream and return urls matching a query with single pattern', () => {
      return expect(actor.run({ url: '', metadata: input, context })).resolves
        .toEqual({
          metadata: {
            traverse: [
              { url: 'ex:s2' },
              { url: 'ex:p' },
              { url: 'ex:g' },
              { url: 'ex:s4' },
              { url: 'ex:p' },
              { url: 'ex:o4' },
              { url: 'ex:g' },
            ],
          },
        });
    });

    it('should run on a stream and return urls matching a query with multiple patterns', () => {
      operation = FACTORY.createBgp([
        FACTORY.createPattern(
          DF.namedNode('ex:s1'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
        FACTORY.createPattern(
          DF.namedNode('ex:s2'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
        FACTORY.createPattern(
          DF.namedNode('ex:s3'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
      ]);
      context = ActionContext({ [KeysInitSparql.query]: operation });
      return expect(actor.run({ url: '', metadata: input, context })).resolves
        .toEqual({
          metadata: {
            traverse: [
              { url: 'ex:s2' },
              { url: 'ex:p' },
              { url: 'ex:g' },
            ],
          },
        });
    });

    it('should run on a stream and return urls matching a query with a nested pattern', () => {
      operation = FACTORY.createProject(
        FACTORY.createBgp([
          FACTORY.createPattern(
            DF.variable('s'),
            DF.namedNode('ex:p'),
            DF.variable('o'),
            DF.namedNode('ex:g'),
          ),
        ]),
        [],
      );
      context = ActionContext({ [KeysInitSparql.query]: operation });
      return expect(actor.run({ url: '', metadata: input, context })).resolves
        .toEqual({
          metadata: {
            traverse: [
              { url: 'ex:s2' },
              { url: 'ex:p' },
              { url: 'ex:g' },
              { url: 'ex:s4' },
              { url: 'ex:p' },
              { url: 'ex:o4' },
              { url: 'ex:g' },
            ],
          },
        });
    });
  });

  describe('An ActorRdfMetadataExtractTraverseQuadPatternQuery instance with onlyVariables true', () => {
    let actor: ActorRdfMetadataExtractTraverseQuadPatternQuery;
    let input: Readable;
    let operation: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseQuadPatternQuery({ name: 'actor', bus, onlyVariables: true });
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
        quad('ex:s6', 'ex:p', 'ex:o6', 'ex:g'),
      ]);
      operation = FACTORY.createBgp([
        FACTORY.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
      ]);
      context = ActionContext({ [KeysInitSparql.query]: operation });
    });

    it('should run on a stream and return urls matching a query\'s variables with multiple patterns', () => {
      operation = FACTORY.createBgp([
        FACTORY.createPattern(
          DF.namedNode('ex:s1'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
        FACTORY.createPattern(
          DF.namedNode('ex:s2'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
        FACTORY.createPattern(
          DF.namedNode('ex:s3'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
        FACTORY.createPattern(
          DF.namedNode('ex:s4'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:o4'),
          DF.namedNode('ex:g'),
        ),
        FACTORY.createPattern(
          DF.namedNode('ex:s6'),
          DF.namedNode('ex:p'),
          DF.variable('o'),
          DF.namedNode('ex:g'),
        ),
      ]);
      context = ActionContext({ [KeysInitSparql.query]: operation });
      return expect(actor.run({ url: '', metadata: input, context })).resolves
        .toEqual({
          metadata: {
            traverse: [
              { url: 'ex:o6' },
            ],
          },
        });
    });
  });
});
