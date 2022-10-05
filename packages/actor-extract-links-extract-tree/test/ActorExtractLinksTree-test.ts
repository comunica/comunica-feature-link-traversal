import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { ActorExtractLinksTree } from '../lib/ActorExtractLinksTree';
const stream = require('streamify-array');

const DF = new DataFactory<RDF.BaseQuad>();

describe('ActorExtractLinksExtractLinksTree', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorExtractLinksExtractLinksTree module', () => {
    it('should be a function', () => {
      expect(ActorExtractLinksTree).toBeInstanceOf(Function);
    });

    it('should be a ActorExtractLinksExtractLinksTree constructor', () => {
      expect(new (<any>ActorExtractLinksTree)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinksTree);
      expect(new (<any>ActorExtractLinksTree)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorExtractLinksTree);
    });

    it('should not be able to create new ActorExtractLinksExtractLinksTree objects without \'new\'', () => {
      expect(() => { (<any>ActorExtractLinksTree)(); }).toThrow();
    });
  });

  describe('The ActorExtractLinksExtractLinksTree run method', () => {
    let actor: ActorExtractLinksTree;
    const treeUrl = 'ex:s';
    const context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: treeUrl,
    });

    beforeEach(() => {
      actor = new ActorExtractLinksTree({ name: 'actor', bus });
    });

    it('should return the links of a TREE with one relation', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with multiple relations', async() => {
      const expectedUrl = [ 'http://foo.com', 'http://bar.com', 'http://example.com', 'http://example.com' ];
      const input = stream([
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node')
          , DF.literal(expectedUrl[0]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl[0]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.literal(expectedUrl[0]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g2'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl[1]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g3'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g3'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl[2]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g4'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g4'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl[3]),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map(value => { return { url: value }; }) });
    });

    it('should return the links of a TREE with one complex relation', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:o'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo')
          , DF.literal(expectedUrl)
          , DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#value'),
          DF.literal('1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#path'),
          DF.literal('ex:bar'),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with multiple relations combining blank nodes and named nodes', async() => {
      const expectedUrl = [ 'http://foo.com', 'http://bar.com', 'http://example.com', 'http://example.com' ];
      const input = stream([
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node')
          , DF.literal(expectedUrl[0]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl[0]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.literal(expectedUrl[0]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('ex:r1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:r1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl[1]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('ex:r2'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:r2'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl[2]),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g2'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl[3]),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map(value => { return { url: value }; }) });
    });

    it('should return the links of a TREE with one relation with an object source', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl,
        metadata: input,
        requestTime: 0,
        context: new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: { value: treeUrl },
        }) };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return nothing when provided a RDF.Source source', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl,
        metadata: input,
        requestTime: 0,
        context: new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: <RDF.Source> input,
        }) };

      const result = await actor.run(action);

      expect(result).toEqual({ links: []});
    });

    it('should return nothing when provided  the source is not valid', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl,
        metadata: input,
        requestTime: 0,
        context: new ActionContext({
        }) };

      const result = await actor.run(action);

      expect(result).toEqual({ links: []});
    });

    it('should return nothing when provided a source object with an RDF.Source values', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#foo'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g1'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl,
        metadata: input,
        requestTime: 0,
        context: new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: { value: <RDF.Source> input },
        }) };

      const result = await actor.run(action);

      expect(result).toEqual({ links: []});
    });
  });
  describe('The ActorExtractLinksExtractLinksTree test method', () => {
    let actor: ActorExtractLinksTree;
    const treeUrl = 'ex:s';

    beforeEach(() => {
      actor = new ActorExtractLinksTree({ name: 'actor', bus });
    });

    it('should test when giving a TREE', async() => {
      const input = stream([
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:o'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.test(action);

      expect(result).toBe(true);
    });

    it('should test when not given a TREE', async() => {
      const input = stream([
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:o'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('root:node'),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.test(action);

      expect(result).toBe(true);
    });
  });
});
