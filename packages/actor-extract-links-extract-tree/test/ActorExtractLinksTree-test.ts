import { KeysExtractLinksTree } from '@comunica/context-entries-link-traversal';
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
      expect(() => {
        (<any>ActorExtractLinksTree)();
      }).toThrow(`Class constructor ActorExtractLinksTree cannot be invoked without 'new'`);
    });
  });

  describe('The ActorExtractLinksExtractLinksTree run method', () => {
    let actor: ActorExtractLinksTree;
    const treeUrl = 'ex:s';
    const context = new ActionContext();

    beforeEach(() => {
      actor = new ActorExtractLinksTree({ name: 'actor', bus });
    });

    it('should return the links of a TREE with one relation', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with multiple relations', async() => {
      const expectedUrl = [ 'http://foo.com', 'http://bar.com', 'http://example.com', 'http://example.com' ];
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:s2'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g2'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[1]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g3'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g3'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[2]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g4'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g4'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[3]), DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map((value) => {
        return { url: value };
      }) });
    });

    it('should return the links of a TREE with one complex relation', async() => {
      const expectedUrl = 'http://foo.com';
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#value'), DF.literal('1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#path'), DF.literal('ex:bar'), DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with multiple relations combining blank nodes and named nodes', async() => {
      const expectedUrl = [ 'http://foo.com', 'http://bar.com', 'http://example.com', 'http://example.com' ];
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('ex:r1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:r1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[1]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('ex:r2'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:r2'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[2]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g2'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[3]), DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map((value) => {
        return { url: value };
      }) });
    });

    it(`should return the links of a TREE with when there is a root type`, async() => {
      const expectedUrl = 'http://foo.com';
      const url = 'bar';
      for (const rootNode of [
        ActorExtractLinksTree.aSubset,
        ActorExtractLinksTree.isPartOf,
        ActorExtractLinksTree.aView,
      ]
      ) {
        let descriptor = DF.quad(DF.namedNode(url), rootNode, DF.namedNode(treeUrl), DF.namedNode('ex:gx'));

        if (rootNode === ActorExtractLinksTree.isPartOf) {
          descriptor = DF.quad(DF.namedNode(treeUrl), rootNode, DF.namedNode(url), DF.namedNode('ex:gx'));
        }
        const input = stream([
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          descriptor,
        ]);
        const action = { url, metadata: input, requestTime: 0, context };

        const result = await actor.run(action);

        expect(result).toEqual({ links: [{ url: expectedUrl }]});
      }
    });

    it(`should return the links of a TREE document with one relation when the strict mode 
    is deactivated and the URL matches the subject of the root node TREE documents`, async() => {
      const unStrictContext = context.set(KeysExtractLinksTree.strictTraversal, false);
      actor = new ActorExtractLinksTree({ name: 'actor', bus });
      const expectedUrl = 'http://foo.com';
      for (const rootNode of [
        ActorExtractLinksTree.aSubset,
        ActorExtractLinksTree.isPartOf,
        ActorExtractLinksTree.aView,
      ]
      ) {
        const descriptor = DF.quad(DF.namedNode(treeUrl), rootNode, DF.namedNode(treeUrl), DF.namedNode('ex:gx'));

        const input = stream([
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          descriptor,
        ]);
        const action = { url: treeUrl, metadata: input, requestTime: 0, context: unStrictContext };

        const result = await actor.run(action);

        expect(result).toEqual({ links: [{ url: expectedUrl }]});
      }
    });

    it(`should return the links of a TREE with one relation when the strict mode
    is deactivated and the URL doesn't match the subject of the root node TREE documents`, async() => {
      const unStrictContext = context.set(KeysExtractLinksTree.strictTraversal, false);
      actor = new ActorExtractLinksTree({ name: 'actor', bus });
      const expectedUrl = 'http://foo.com';
      for (const rootNode of [
        ActorExtractLinksTree.aSubset,
        ActorExtractLinksTree.isPartOf,
        ActorExtractLinksTree.aView,
      ]
      ) {
        let descriptor = DF.quad(DF.namedNode(treeUrl), rootNode, DF.namedNode(treeUrl), DF.namedNode('ex:gx'));

        if (rootNode === ActorExtractLinksTree.isPartOf) {
          descriptor = DF.quad(DF.namedNode(treeUrl), rootNode, DF.namedNode('foo'), DF.namedNode('ex:gx'));
        }
        const input = stream([
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl), DF.namedNode('ex:gx')),
          descriptor,
        ]);
        const action = { url: 'bar', metadata: input, requestTime: 0, context: unStrictContext };

        const result = await actor.run(action);

        expect(result).toEqual({ links: [{ url: expectedUrl }]});
      }
    });

    it(`should return the links of a TREE with one relation when the strict mode 
    is deactivated and the URL matches the subject of the TREE document that is not a root node`, async() => {
      const unStrictContext = context.set(KeysExtractLinksTree.strictTraversal, false);
      actor = new ActorExtractLinksTree({ name: 'actor', bus });

      const expectedUrl = [ 'http://foo.com', 'http://bar.com', 'http://example.com', 'http://example.com' ];
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#foo'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.literal(expectedUrl[0]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('ex:r1'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:r1'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[1]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('ex:r2'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('ex:r2'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[2]), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('https://w3id.org/tree#relation'), DF.blankNode('_:_g2'), DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'), DF.namedNode('https://w3id.org/tree#node'), DF.literal(expectedUrl[3]), DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context: unStrictContext };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map((value) => {
        return { url: value };
      }) });
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
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), DF.namedNode('https://w3id.org/tree#node'), DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.test(action);

      expect(result).toBe(true);
    });

    it('should test when not given a TREE', async() => {
      const input = stream([
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl), DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), DF.namedNode('root:node'), DF.namedNode('ex:gx')),
      ]);
      const action = { url: '', metadata: input, requestTime: 0, context: new ActionContext() };

      const result = await actor.test(action);

      expect(result).toBe(true);
    });
  });
});
