import { KeysRdfResolveQuadPattern, KeysInitQuery } from '@comunica/context-entries';
import { KeysExtractLinksTree } from '@comunica/context-entries-link-traversal';
import { ActionContext, Bus } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import { ActorExtractLinksTree } from '../lib/ActorExtractLinksTree';
import { SparqlRelationOperator, TreeNodes } from '../lib/TreeMetadata';
import type { ITreeRelation, ITreeRelationRaw } from '../lib/TreeMetadata';

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

    it('should apply the activate the reachability criterion based on the constructor parameter', () => {
      let filterPruning = true;
      let actor = new ActorExtractLinksTree({ name: 'actor', bus, filterPruning });
      expect(actor.isUsingfilterPruning()).toBe(true);

      filterPruning = false;
      actor = new ActorExtractLinksTree({ name: 'actor', bus, filterPruning });
      expect(actor.isUsingfilterPruning()).toBe(false);
    });

    it('should apply the activate the reachability when it is not defined in the config', () => {
      const actor = new ActorExtractLinksTree({ name: 'actor', bus });
      expect(actor.isUsingfilterPruning()).toBe(true);
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
      jest.spyOn(actor, 'createFilter').mockReturnValue(Promise.resolve(new Map()));
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
          type: SparqlRelationOperator.GreaterThanRelation,
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
      jest.spyOn(actorWithCustomFilter, 'createFilter').mockReturnValue(filterOutput);
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

        const query = translate(`
        SELECT ?o  WHERE {
          ex:foo ex:path ?o .
          ex:foo ex:p ex:o .
          ex:bar ex:p2 ex:o2 .
          ex:too ex:p3 ex:o3 .
          FILTER(?o=5)
        }
        `, { prefixes: { ex: 'http://example.com#' }});

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

    it('should return no link when the relation doesn\'t respects the filter when using the real FilterNode class',
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
            DF.literal('http://example.com#path'),
            DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'),
            DF.namedNode('https://w3id.org/tree#value'),
            DF.literal('500', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            DF.namedNode('ex:gx')),
          DF.quad(DF.blankNode('_:_g1'),
            DF.blankNode(TreeNodes.RDFTypeNode),
            DF.namedNode(SparqlRelationOperator.LessThanOrEqualToRelation)),
        ]);

        const query = translate(`
        SELECT ?o WHERE {
          ex:foo ex:path ?o.
          ex:foo ex:p ex:o.
          ex:foo ex:p2 ex:o2.
          ex:foo ex:p3 ex:o3.
          FILTER(?o=550)
        }
        `, { prefixes: { ex: 'http://example.com#' }});

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

    it('should return the links of a TREE with when there is a root type', async() => {
      const expectedUrl = 'http://foo.com';
      const url = 'bar';
      for (const rootNode of [
        ActorExtractLinksTree.aSubset,
        ActorExtractLinksTree.isPartOf,
        ActorExtractLinksTree.aView,
      ]
      ) {
        let descriptor = DF.quad(DF.namedNode(url),
          rootNode,
          DF.namedNode(treeUrl),
          DF.namedNode('ex:gx'));

        if (rootNode === ActorExtractLinksTree.isPartOf) {
          descriptor = DF.quad(DF.namedNode(treeUrl),
            rootNode,
            DF.namedNode(url),
            DF.namedNode('ex:gx'));
        }
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
      jest.spyOn(actor, 'createFilter').mockReturnValue(Promise.resolve(new Map()));

      const expectedUrl = 'http://foo.com';
      for (const rootNode of [
        ActorExtractLinksTree.aSubset,
        ActorExtractLinksTree.isPartOf,
        ActorExtractLinksTree.aView ]
      ) {
        const descriptor = DF.quad(DF.namedNode(treeUrl),
          rootNode,
          DF.namedNode(treeUrl),
          DF.namedNode('ex:gx'));

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
      jest.spyOn(actor, 'createFilter').mockReturnValue(Promise.resolve(new Map()));

      const expectedUrl = 'http://foo.com';
      for (const rootNode of [
        ActorExtractLinksTree.aSubset,
        ActorExtractLinksTree.isPartOf,
        ActorExtractLinksTree.aView,
      ]
      ) {
        let descriptor = DF.quad(DF.namedNode(treeUrl),
          rootNode,
          DF.namedNode(treeUrl),
          DF.namedNode('ex:gx'));

        if (rootNode === ActorExtractLinksTree.isPartOf) {
          descriptor = DF.quad(DF.namedNode(treeUrl),
            rootNode,
            DF.namedNode('foo'),
            DF.namedNode('ex:gx'));
        }
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
      jest.spyOn(actor, 'createFilter').mockReturnValue(Promise.resolve(new Map()));

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
      const action = { url: treeUrl, metadata: input, requestTime: 0, context: unStrictContext };

      const result = await actor.run(action);

      expect(result).toEqual({ links: expectedUrl.map(value => { return { url: value }; }) });
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

  describe('addRelationDescription', () => {
    it('should add relation to the map when an operator is provided and the relation map is empty',
      () => {
        const quad: RDF.Quad = DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(SparqlRelationOperator.EqualThanRelation),
        );
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
        ActorExtractLinksTree.addRelationDescription(
          relationDescriptions,
          quad,
          SparqlRelationOperator.EqualThanRelation,
          'operator',
        );

        expect(relationDescriptions.size).toBe(1);
      });

    it(`should add relation to the map when an operator is provided and
     the relation map at the current key is not empty`,
    () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
        DF.namedNode(TreeNodes.RDFTypeNode),
        DF.namedNode(SparqlRelationOperator.EqualThanRelation));
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s', { value: 22 }]]);
      ActorExtractLinksTree.addRelationDescription(
        relationDescriptions,
        quad,
        SparqlRelationOperator.EqualThanRelation,
        'operator',
      );
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when an operator is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(SparqlRelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s2', { value: 22 }]]);
        ActorExtractLinksTree.addRelationDescription(
          relationDescriptions,
          quad,
          SparqlRelationOperator.EqualThanRelation,
          'operator',
        );
        expect(relationDescriptions.size).toBe(2);
      });

    it('should add relation to the map when a value is provided and the relation map is empty', () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, '5', 'value');
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when a value is provided and the relation map at the current key is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, ITreeRelationRaw> =
        new Map([[ 'ex:s', { subject: [ 'ex:s', quad ]}]]);
        ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, '5', 'value');
        expect(relationDescriptions.size).toBe(1);
      });

    it('should add relation to the map when a value is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s2', { value: 22 }]]);
        ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, '5', 'value');
        expect(relationDescriptions.size).toBe(2);
      });

    it('should add relation to the map when a subject is provided and the relation map is empty', () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Path), DF.namedNode('ex:path'));
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, 'ex:path', 'subject');
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when a subject is provided and the relation map at the current key is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Path), DF.namedNode('ex:path'));
        const relationDescriptions: Map<string, ITreeRelationRaw> =
        new Map([[ 'ex:s', { subject: [ 'ex:s', quad ]}]]);
        ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, 'ex:path', 'subject');
        expect(relationDescriptions.size).toBe(1);
      });

    it('should add relation to the map when a subject is provided and the relation map is not empty',
      () => {
        const quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s2', { value: 22 }]]);
        ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, 'ex:path', 'subject');
        expect(relationDescriptions.size).toBe(2);
      });
  });

  describe('buildRelations', () => {
    it('should return undefined when the quad don\'t respect any relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
        expect(ActorExtractLinksTree.buildRelationElement(quad)).toBeUndefined();
      });

    it('should return the relation element when the quad respect a relation semantic',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(SparqlRelationOperator.EqualThanRelation));

        const res = ActorExtractLinksTree.buildRelationElement(quad);
        expect(res).toBeDefined();
        const { value, key } = <any> res;
        expect(key).toBe(<keyof ITreeRelationRaw> 'operator');
        expect(value).toBe(SparqlRelationOperator.EqualThanRelation);
      });

    it('should return undefined when the type does not exist',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode('foo'));

        const res = ActorExtractLinksTree.buildRelationElement(quad);
        expect(res).toBeUndefined();
      });
  });

  describe('materializeTreeRelation', () => {
    it('should materialize a tree:Relation when all the raw relation are provided', () => {
      const aSubject = 'foo';
      const aValue = '0';
      const anOperator = SparqlRelationOperator.PrefixRelation;
      const aRemainingItemDefinition = 44;
      const aQuad = DF.quad(
        DF.blankNode(''),
        DF.namedNode(''),
        DF.blankNode(''),
      );
      const aNode = 'test';
      const relationRaw: ITreeRelationRaw = {
        subject: [ aSubject, aQuad ],
        value: [ aValue, aQuad ],
        operator: [ anOperator, aQuad ],
        remainingItems: [ aRemainingItemDefinition, aQuad ],
      };
      const expectedTreeRelation: ITreeRelation = {
        type: anOperator,
        remainingItems: aRemainingItemDefinition,
        path: aSubject,
        value: {
          value: aValue,
          term: aQuad.object,
        },
        node: aNode,
      };

      const res = ActorExtractLinksTree.materializeTreeRelation(relationRaw, aNode);

      expect(res).toStrictEqual(expectedTreeRelation);
    });

    it('should materialize a tree:sRelation when the remaining item is missing', () => {
      const aSubject = 'foo';
      const aValue = '0';
      const anOperator = SparqlRelationOperator.PrefixRelation;
      const aQuad = DF.quad(
        DF.blankNode(''),
        DF.namedNode(''),
        DF.blankNode(''),
      );
      const aNode = 'test';
      const relationRaw: ITreeRelationRaw = {
        subject: [ aSubject, aQuad ],
        value: [ aValue, aQuad ],
        operator: [ anOperator, aQuad ],
      };
      const expectedTreeRelation: ITreeRelation = {
        type: anOperator,
        path: aSubject,
        value: {
          value: aValue,
          term: aQuad.object,
        },
        node: aNode,
      };

      const res = ActorExtractLinksTree.materializeTreeRelation(relationRaw, aNode);

      expect(res).toStrictEqual(expectedTreeRelation);
    });

    it('should materialize a tree:Relation when the value is missing', () => {
      const aSubject = 'foo';
      const anOperator = SparqlRelationOperator.PrefixRelation;
      const aQuad = DF.quad(
        DF.blankNode(''),
        DF.namedNode(''),
        DF.blankNode(''),
      );
      const aNode = 'test';
      const relationRaw: ITreeRelationRaw = {
        subject: [ aSubject, aQuad ],
        operator: [ anOperator, aQuad ],
      };
      const expectedTreeRelation: ITreeRelation = {
        type: anOperator,
        path: aSubject,
        node: aNode,
      };

      const res = ActorExtractLinksTree.materializeTreeRelation(relationRaw, aNode);

      expect(res).toStrictEqual(expectedTreeRelation);
    });
  });
});
