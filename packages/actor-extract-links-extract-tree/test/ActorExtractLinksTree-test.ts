import { KeysRdfResolveQuadPattern, KeysInitQuery } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import type { ITreeRelation } from '@comunica/types-link-traversal';
import { RelationOperator } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
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
      jest.spyOn(actor, 'applyFilter').mockReturnValue(Promise.resolve(new Map()));
    });

    it('should return the link of a TREE with one relation', async() => {
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

    it('should prune the filtered link', async() => {
      const expectedUrl = 'http://foo.com';
      const prunedUrl = 'http://bar.com';
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
          DF.literal(prunedUrl),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#remainingItems'),
          DF.literal('66'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('https://w3id.org/tree#value'),
          DF.literal('66'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g1'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.namedNode(treeUrl),
          DF.namedNode('https://w3id.org/tree#relation'),
          DF.blankNode('_:_g2'),
          DF.namedNode('ex:gx')),
        DF.quad(DF.blankNode('_:_g2'),
          DF.namedNode('https://w3id.org/tree#node'),
          DF.literal(expectedUrl),
          DF.namedNode('ex:gx')),
      ]);
      const action = { url: treeUrl, metadata: input, requestTime: 0, context };
      const relations: ITreeRelation[] = [
        {
          node: prunedUrl,
          remainingItems: 66,
          type: RelationOperator.GreaterThanRelation,
          value: {
            value: '66',
            term: DF.literal('66'),
          },
        },
        {
          node: expectedUrl,
        },
      ];

      const filterOutput: Promise<Map<string, boolean>> = Promise.resolve(
        new Map([[ relations[0].node, false ], [ relations[1].node, true ]]),
      );

      const actorWithCustomFilter = new ActorExtractLinksTree(
        { name: 'actor', bus },
      );
      jest.spyOn(actorWithCustomFilter, 'applyFilter').mockReturnValue(filterOutput);
      const result = await actorWithCustomFilter.run(action);
      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with one relation when using the real FilterNode class', async() => {
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

      const bgp = <RDF.Quad[]>[
        DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
        DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:bar'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
        DF.quad(DF.namedNode('ex:too'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
      ];
      const filterExpression = {
        expressionType: Algebra.expressionTypes.OPERATOR,
        operator: '=',
        type: Algebra.types.EXPRESSION,
        args: [
          {
            expressionType: Algebra.expressionTypes.TERM,
            type: Algebra.types.EXPRESSION,
            term: {
              termType: 'Variable',
              value: 'o',
            },
          },
          {
            expressionType: Algebra.expressionTypes.TERM,
            type: Algebra.types.EXPRESSION,
            term: {
              termType: 'Literal',
              langugage: '',
              value: '5',
              datatype: {
                termType: 'namedNode',
                value: 'http://www.w3.org/2001/XMLSchema#integer',
              },
            },
          },
        ],
      };

      const query = {
        type: Algebra.types.PROJECT,
        input: {
          type: Algebra.types.FILTER,
          expression: filterExpression,
          input: {
            input: {
              type: Algebra.types.JOIN,
              input: bgp,
            },
          },
        },
      };
      const contextWithQuery = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: treeUrl,
        [KeysInitQuery.query.name]: query,
      });

      const actorWithFilterNodeClass = new ActorExtractLinksTree(
        { name: 'actor', bus },
      );
      const action = { url: treeUrl, metadata: input, requestTime: 0, context: contextWithQuery };
      const result = await actorWithFilterNodeClass.run(action);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should return the links of a TREE with one relation with a path when using the real FilterNode class',
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
            DF.namedNode('https://w3id.org/tree#path'),
            DF.literal('ex:path'),
            DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'),
            DF.namedNode('https://w3id.org/tree#value'),
            DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            DF.namedNode('ex:gx')),

        ]);

        const bgp = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
          DF.quad(DF.namedNode('ex:bar'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:too'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
        ];
        const filterExpression = {
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          type: Algebra.types.EXPRESSION,
          args: [
            {
              expressionType: Algebra.expressionTypes.TERM,
              type: Algebra.types.EXPRESSION,
              term: {
                termType: 'Variable',
                value: 'o',
              },
            },
            {
              expressionType: Algebra.expressionTypes.TERM,
              type: Algebra.types.EXPRESSION,
              term: {
                termType: 'Literal',
                langugage: '',
                value: '5',
                datatype: {
                  termType: 'namedNode',
                  value: 'http://www.w3.org/2001/XMLSchema#integer',
                },
              },
            },
          ],
        };

        const query = {
          type: Algebra.types.PROJECT,
          input: {
            type: Algebra.types.FILTER,
            expression: filterExpression,
            input: {
              input: {
                type: Algebra.types.JOIN,
                input: bgp,
              },
            },
          },
        };
        const contextWithQuery = new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: treeUrl,
          [KeysInitQuery.query.name]: query,
        });

        const actorWithFilterNodeClass = new ActorExtractLinksTree(
          { name: 'actor', bus },
        );
        const action = { url: treeUrl, metadata: input, requestTime: 0, context: contextWithQuery };
        const result = await actorWithFilterNodeClass.run(action);

        expect(result).toEqual({ links: [{ url: expectedUrl }]});
      });

    it('should return no link when the relation doesn\'t respect the filter when using the real FilterNode class',
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
            DF.namedNode('https://w3id.org/tree#path'),
            DF.literal('ex:path'),
            DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'),
            DF.namedNode('https://w3id.org/tree#value'),
            DF.literal('500', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            DF.namedNode('ex:gx')),

        ]);

        const bgp = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
          DF.quad(DF.namedNode('ex:bar'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:too'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
        ];
        const filterExpression = {
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          type: Algebra.types.EXPRESSION,
          args: [
            {
              expressionType: Algebra.expressionTypes.TERM,
              type: Algebra.types.EXPRESSION,
              term: {
                termType: 'Variable',
                value: 'o',
              },
            },
            {
              expressionType: Algebra.expressionTypes.TERM,
              type: Algebra.types.EXPRESSION,
              term: {
                termType: 'Literal',
                langugage: '',
                value: '5',
                datatype: {
                  termType: 'namedNode',
                  value: 'http://www.w3.org/2001/XMLSchema#integer',
                },
              },
            },
          ],
        };

        const query = {
          type: Algebra.types.PROJECT,
          input: {
            type: Algebra.types.FILTER,
            expression: filterExpression,
            input: {
              input: {
                type: Algebra.types.JOIN,
                input: bgp,
              },
            },
          },
        };
        const contextWithQuery = new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: treeUrl,
          [KeysInitQuery.query.name]: query,
        });

        const actorWithFilterNodeClass = new ActorExtractLinksTree(
          { name: 'actor', bus },
        );
        const action = { url: treeUrl, metadata: input, requestTime: 0, context: contextWithQuery };
        const result = await actorWithFilterNodeClass.run(action);

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
