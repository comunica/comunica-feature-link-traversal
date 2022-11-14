import type { IActorOptimizeLinkTraversalOutput } from '@comunica/bus-optimize-link-traversal';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import type { INode, IRelation } from '@comunica/types-link-traversal';
import { RelationOperator } from '@comunica/types-link-traversal';
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
      expect(spyMockMediator).toBeCalledTimes(1);
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
      expect(spyMockMediator).toBeCalledTimes(1);
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
      expect(spyMockMediator).toBeCalledTimes(1);
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
      expect(spyMockMediator).toBeCalledTimes(1);
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
      const relations: IRelation[] = [
        {
          node: prunedUrl,
          remainingItems: {
            value: 66,
            quad: <RDF.Quad> DF.quad(DF.blankNode('_:_g1'),
              DF.namedNode('https://w3id.org/tree#remainingItems'),
              DF.literal('66'),
              DF.namedNode('ex:gx')),
          },
          '@type': {
            value: RelationOperator.GreaterThanRelation,
            quad: <RDF.Quad> DF.quad(DF.blankNode('_:_g1'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
              DF.namedNode('ex:gx')),
          },
          value: {
            value: '66',
            quad: <RDF.Quad> DF.quad(DF.blankNode('_:_g1'),
              DF.namedNode('https://w3id.org/tree#value'),
              DF.literal('66'),
              DF.namedNode('ex:gx')),
          },
        },
        {
          node: expectedUrl,
        },
      ];
      const expectedNode: INode = {
        relation: relations,
        subject: treeUrl,
      };
      const mediationOutput: Promise<IActorOptimizeLinkTraversalOutput> = Promise.resolve(
        {
          filters: new Map([[ relations[0].node, false ], [ relations[1].node, true ]]),
        },
      );
      const mediator: any = {
        mediate(arg: any) {
          return mediationOutput;
        },
      };
      const spyMock = jest.spyOn(mediator, 'mediate');
      const actorWithCustomMediator = new ActorExtractLinksTree(
        { name: 'actor', bus},
      );

      const result = await actorWithCustomMediator.run(action);
      expect(spyMock).toBeCalledTimes(1);
      expect(spyMock).toBeCalledWith({ context: action.context, treeMetadata: expectedNode });
      expect(spyMock).toHaveReturnedWith(mediationOutput);

      expect(result).toEqual({ links: [{ url: expectedUrl }]});
    });

    it('should not filter the links if the mediator return an undefined filters', async() => {
      const expectedUrl = 'http://foo.com';
      const secondExpectedLink = 'http://bar.com';
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
          DF.literal(secondExpectedLink),
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
      const relations: IRelation[] = [
        {
          node: secondExpectedLink,
          remainingItems: {
            value: 66,
            quad: <RDF.Quad> DF.quad(DF.blankNode('_:_g1'),
              DF.namedNode('https://w3id.org/tree#remainingItems'),
              DF.literal('66'),
              DF.namedNode('ex:gx')),
          },
          '@type': {
            value: RelationOperator.GreaterThanRelation,
            quad: <RDF.Quad> DF.quad(DF.blankNode('_:_g1'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('https://w3id.org/tree#GreaterThanRelation'),
              DF.namedNode('ex:gx')),
          },
          value: {
            value: '66',
            quad: <RDF.Quad> DF.quad(DF.blankNode('_:_g1'),
              DF.namedNode('https://w3id.org/tree#value'),
              DF.literal('66'),
              DF.namedNode('ex:gx')),
          },
        },
        {
          node: expectedUrl,
        },
      ];
      const expectedNode: INode = {
        relation: relations,
        subject: treeUrl,
      };
      const mediationOutput: Promise<IActorOptimizeLinkTraversalOutput> = Promise.resolve(
        {
        },
      );
      const mediator: any = {
        mediate(arg: any) {
          return mediationOutput;
        },
      };
      const spyMock = jest.spyOn(mediator, 'mediate');
      const actorWithCustomMediator = new ActorExtractLinksTree(
        { name: 'actor', bus },
      );

      const result = await actorWithCustomMediator.run(action);
      expect(spyMock).toBeCalledTimes(1);
      expect(spyMock).toBeCalledWith({ context: action.context, treeMetadata: expectedNode });
      expect(spyMock).toHaveReturnedWith(mediationOutput);

      expect(result).toEqual({ links: [{ url: secondExpectedLink }, { url: expectedUrl }]});
    });

    it('should fail when the mediator return a fail promise', async() => {
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

      const mediationOutput: Promise<IActorOptimizeLinkTraversalOutput> = Promise.reject(new Error('failled request'));
      const mediator: any = {
        mediate(_arg: any) {
          return mediationOutput;
        },
      };

      const spyMock = jest.spyOn(mediator, 'mediate');
      const actorWithCustomMediator = new ActorExtractLinksTree(
        { name: 'actor', bus },
      );
      await actorWithCustomMediator.run(action).then(res => {
        expect(res).toBeUndefined();
      }).catch(error => {
        expect(error).toBeDefined();
      });

      expect(spyMock).toBeCalledTimes(1);
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
