import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { ActorExtractLinksExtractLinksTree } from '../lib/ActorExtractLinksExtractLinksTree';
const stream = require('streamify-array');

const DF = new DataFactory<RDF.BaseQuad>();

describe('ActorExtractLinksExtractLinksTree', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorExtractLinksExtractLinksTree module', () => {
    it('should be a function', () => {
      expect(ActorExtractLinksExtractLinksTree).toBeInstanceOf(Function);
    });

    it('should be a ActorExtractLinksExtractLinksTree constructor', () => {
      expect(new (<any>ActorExtractLinksExtractLinksTree)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinksExtractLinksTree);
      expect(new (<any>ActorExtractLinksExtractLinksTree)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinksExtractLinksTree);
    });

    it('should not be able to create new ActorExtractLinksExtractLinksTree objects without \'new\'', () => {
      expect(() => { (<any>ActorExtractLinksExtractLinksTree)(); }).toThrow();
    });
  });

  describe('The ActorExtractLinksExtractLinksTree run method', () => {
    let actor: ActorExtractLinksExtractLinksTree;

    beforeEach(() => {
      actor = new ActorExtractLinksExtractLinksTree({ name: 'actor', bus });
    });

    it('should return the links of a TREE with one relation', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('tree:node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with multiple relations', async() => {
      const expectedUrl = [ 'http://foo.com', 'http://bar.com', 'http://example.com', 'http://example.com' ];
      const input = stream([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:node'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('tree:node'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:foo'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:relation'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:relation'), DF.blankNode('_:_g2'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'), DF.namedNode('tree:node'), DF.literal(expectedUrl[1]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:relation'), DF.blankNode('_:_g3'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g3'), DF.namedNode('tree:node'), DF.literal(expectedUrl[2]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:relation'), DF.blankNode('_:_g4'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g4'), DF.namedNode('tree:node'), DF.literal(expectedUrl[3]), DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map(value => { return { url: value }; }) });
    });

    it('should return the links of a TREE with one complex relation', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'), DF.namedNode('tree:relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('tree:node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('tree:value'), DF.literal('1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('tree:path'), DF.literal('ex:bar'), DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });
  });

  describe('The ActorExtractLinksExtractLinksTree test method', () => {
    let actor: ActorExtractLinksExtractLinksTree;

    beforeEach(() => {
      actor = new ActorExtractLinksExtractLinksTree({ name: 'actor', bus });
    });

    it('should test when giving a TREE', async() => {
      const input = stream([
        DF.quad(DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:o'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('tree:node'),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.test(action);

      expect(result).toBe(true);
    });

    it('should no test when not given a TREE', async() => {
      const input = stream([
        DF.quad(DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:o'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode('ex:s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('root:node'),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.test(action);

      expect(result).toBe(false);
    });
  });
});
