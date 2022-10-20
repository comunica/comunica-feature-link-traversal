import { KeysRdfResolveQuadPattern, KeysInitQuery } from '@comunica/context-entries';
import { KeyOptimizationLinkTraversal } from '@comunica/context-entries-link-traversal';
import { ActionContext, Bus } from '@comunica/core';
import type { LinkTraversalOptimizationLinkFilter } from '@comunica/types-link-traversal';
import { LinkTraversalFilterOperator } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { ActorExtractLinksTree } from '../lib/ActorExtractLinksTree';

const stream = require('streamify-array');

const DF = new DataFactory<RDF.BaseQuad>();

describe('ActorExtractLinksExtractLinksTree', () => {
  let bus: any;
  let mockMediator: any;
  let spyMockMediator: any;

  beforeEach(() => {
    mockMediator = {
      mediate(arg: any) {
        return Promise.resolve(
          {
            filters: <Map<string, LinkTraversalOptimizationLinkFilter>> new Map(),
          },
        );
      },
    };
    spyMockMediator = jest.spyOn(mockMediator, 'mediate');
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
      actor = new ActorExtractLinksTree({ name: 'actor', mediatorOptimizeLinkTraversal: mockMediator, bus });
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
        DF.quad(DF.blankNode('ex:s2'),
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
  });

  describe('The ActorExtractLinksExtractLinksTree run method with filter', () => {
    let actor: ActorExtractLinksTree;
    const treeUrl = 'ex:s';

    beforeEach(() => {
      actor = new ActorExtractLinksTree({ name: 'actor', mediatorOptimizeLinkTraversal: mockMediator, bus });
    });

    it('should return the links of a TREE with one relation and filter that returns always true', async() => {
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

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#path'),
          DF.namedNode('ex:path'),
          DF.namedNode('ex:gx')),

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#value'),
          DF.literal('value'),
          DF.namedNode('ex:gx')),

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
          DF.namedNode('ex:gx')),
      ]);
      const mock_filter = jest.fn((_subject, _value, _operator) => true);
      const context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: treeUrl,
        [KeyOptimizationLinkTraversal.filterFunctions.name]: new Map([[ 'ex:path', [ mock_filter ]]]),
      });

      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(mock_filter).toBeCalledWith('ex:path', 'value', LinkTraversalFilterOperator.GreaterThan);
      expect(result).toEqual({ links: [{ url: expectedUrl }]});
      expect(mock_filter).toBeCalledTimes(1);
    });

    it('should return no links of a TREE with one relation  and filter that returns always false', async() => {
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

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
          DF.namedNode('ex:gx')),

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#path'),
          DF.namedNode('ex:path'),
          DF.namedNode('ex:gx')),

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#value'),
          DF.literal('value'),
          DF.namedNode('ex:gx')),

      ]);
      const mock_filter = jest.fn((_subject, _value, _operator) => false);
      const context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: treeUrl,
        [KeyOptimizationLinkTraversal.filterFunctions.name]: new Map([[ 'ex:path', [ mock_filter ]]]),
      });

      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: []});
      expect(mock_filter).toBeCalledTimes(1);
      expect(mock_filter).toBeCalledWith('ex:path', 'value', LinkTraversalFilterOperator.GreaterThan);
    });

    it('should return the links of a TREE with one relation and multiple filter that returns always true', async() => {
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

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#value'),
          DF.literal('value'),
          DF.namedNode('ex:gx')),

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
          DF.namedNode('ex:gx')),

        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#path'),
          DF.namedNode('ex:path'),
          DF.namedNode('ex:gx')),
      ]);
      const mock_filters = new Map([
        [ 'ex:path', [ jest.fn((_subject, _value, _operator) => true),
          jest.fn((_subject, _value, _operator) => true),
          jest.fn((_subject, _value, _operator) => true),
          jest.fn((_subject, _value, _operator) => true) ]],
      ]);
      const context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: treeUrl,
        [KeyOptimizationLinkTraversal.filterFunctions.name]: mock_filters,
      });

      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
      for (const mockList of mock_filters.values()) {
        for (const mock of mockList) {
          expect(mock).toBeCalledTimes(1);
          expect(mock).toBeCalledWith('ex:path', 'value', LinkTraversalFilterOperator.GreaterThan);
        }
      }
    });

    it('should return no links with one relation and multiple filter that returns true and one that return false',
      async() => {
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

          DF.quad(DF.blankNode('_:_g1'),
            DF.namedNode('https://w3id.org/tree#value'),
            DF.literal('value'),
            DF.namedNode('ex:gx')),

          DF.quad(DF.blankNode('_:_g1'),
            DF.namedNode('https://w3id.org/tree#path'),
            DF.namedNode('ex:path'),
            DF.namedNode('ex:gx')),

          DF.quad(DF.blankNode('_:_g1'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
            DF.namedNode('ex:gx')),
        ]);
        const mockFilters = new Map([
          [ 'ex:path', [
            jest.fn((_subject, _value, _operator) => true),
            jest.fn((_subject, _value, _operator) => true),
            jest.fn((_subject, _value, _operator) => false),
            jest.fn((_subject, _value, _operator) => true),
          ],

          ],
        ]);
        const context = new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: treeUrl,
          [KeyOptimizationLinkTraversal.filterFunctions.name]: mockFilters,
        });

        const action = { url: treeUrl, metadata: input, requestTime: 0, context };

        const result = await actor.run(action);

        for (const mockList of mockFilters.values()) {
          for (const mock of mockList) {
            expect(mock).toBeCalledTimes(1);
            expect(mock).toBeCalledWith('ex:path', 'value', LinkTraversalFilterOperator.GreaterThan);
          }
        }

        expect(result).toEqual({ links: []});
      });

    it('should call the mediator when a query is defined', async() => {
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

      const operation = {
        type: 'project',
        input: {
          type: 'graph',
          input: {
            type: 'bgp',
            patterns: [{
              type: 'pattern',
              termType: 'Quad',
              subject: { termType: 'Variable', value: 'x' },
              predicate: { termType: 'Variable', value: 'y' },
              object: { termType: 'Variable', value: 'z' },
              graph: { termType: 'DefaultGraph', value: '' },
            }],
          },
          name: { termType: 'Variable', value: 'g' },
        },
        variables: [{ termType: 'Variable', value: 'x' }],
      };

      const context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: treeUrl,
        [KeysInitQuery.query.name]: operation,
      });

      const action = { url: treeUrl, metadata: input, requestTime: 0, context };

      const result = await actor.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});

      expect(spyMockMediator).toBeCalledWith(expect.objectContaining({
        operations: operation,
      }));
    });
  });
  describe('The ActorExtractLinksExtractLinksTree test method', () => {
    let actor: ActorExtractLinksTree;
    const treeUrl = 'ex:s';

    beforeEach(() => {
      actor = new ActorExtractLinksTree({ name: 'actor', mediatorOptimizeLinkTraversal: mockMediator, bus });
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
