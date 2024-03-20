import type { Readable } from 'node:stream';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import {
  ActorExtractLinksQuadPatternQuery,
} from '../lib/ActorExtractLinksQuadPatternQuery';

const quad = require('rdf-quad');
const stream = require('streamify-array');

const FACTORY = new Factory();
const DF = new DataFactory();

describe('ActorExtractLinksQuadPatternQuery', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorExtractLinksQuadPatternQuery module', () => {
    it('should be a function', () => {
      expect(ActorExtractLinksQuadPatternQuery).toBeInstanceOf(Function);
    });

    it('should be a ActorExtractLinksQuadPatternQuery constructor', () => {
      expect(new (<any> ActorExtractLinksQuadPatternQuery)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinksQuadPatternQuery);
      expect(new (<any> ActorExtractLinksQuadPatternQuery)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinks);
    });

    it('should not be able to create new ActorExtractLinksQuadPatternQuery objects without \'new\'', () => {
      expect(() => {
        (<any>ActorExtractLinksQuadPatternQuery)();
      }).toThrow(`Class constructor ActorExtractLinksQuadPatternQuery cannot be invoked without 'new'`);
    });
  });

  describe('An ActorExtractLinksQuadPatternQuery instance with onlyVariables false', () => {
    let actor: ActorExtractLinksQuadPatternQuery;
    let input: Readable;
    let operation: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorExtractLinksQuadPatternQuery({ name: 'actor', bus, onlyVariables: false });
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
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
    });

    it('should fail to test without query operation in context', async() => {
      context = new ActionContext({});
      await expect(actor.test({ url: '', metadata: input, requestTime: 0, context })).rejects
        .toThrow(new Error('Actor actor can only work in the context of a query.'));
    });

    it('should test with quad pattern query operation in context', async() => {
      await expect(actor.test({ url: '', metadata: input, requestTime: 0, context })).resolves.toBe(true);
    });

    it('should run on a stream and return urls matching a query with single pattern', async() => {
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
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

    it('should run on a stream and return urls matching a query with multiple patterns', async() => {
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
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            { url: 'ex:s2' },
            { url: 'ex:p' },
            { url: 'ex:g' },
          ],
        });
    });

    it('should run on a stream and return urls matching a query with a nested pattern', async() => {
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
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
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

    it('should run on a stream and return urls matching a query with link property path', async() => {
      operation = FACTORY.createPath(
        DF.namedNode('ex:s'),
        FACTORY.createLink(DF.namedNode('ex:p')),
        DF.variable('o'),
        DF.namedNode('ex:g'),
      );
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
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

    it('should run on a stream and return urls matching a query with nps property path', async() => {
      operation = FACTORY.createPath(
        DF.namedNode('ex:s'),
        FACTORY.createNps([
          DF.namedNode('ex:p1'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:p3'),
        ]),
        DF.variable('o'),
        DF.namedNode('ex:g'),
      );
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
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

  describe('An ActorExtractLinksQuadPatternQuery instance with onlyVariables true', () => {
    let actor: ActorExtractLinksQuadPatternQuery;
    let input: Readable;
    let operation: any;
    let context: ActionContext;

    beforeEach(() => {
      actor = new ActorExtractLinksQuadPatternQuery({ name: 'actor', bus, onlyVariables: true });
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
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
    });

    it('should run on a stream and return urls matching a query\'s variables with multiple patterns', async() => {
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
      context = new ActionContext({ [KeysInitQuery.query.name]: operation });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            { url: 'ex:o6' },
          ],
        });
    });
  });
});
