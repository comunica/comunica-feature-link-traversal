import { ActorQueryOperation, Bindings } from '@comunica/bus-query-operation';
import { Bus } from '@comunica/core';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import { SingletonIterator } from 'asynciterator';
import { ActorQueryOperationBgpTraversal } from '../lib/ActorQueryOperationBgpTraversal';

describe('ActorQueryOperationBgpTraversal', () => {
  let bus: any;
  let mediatorQueryOperation: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorQueryOperation = {
      mediate: (arg: any) => Promise.resolve({
        bindingsStream: new SingletonIterator(Bindings({
          graph: arg.operation.graph,
          object: arg.operation.object,
          predicate: arg.operation.predicate,
          subject: arg.operation.subject,
        })),
        type: 'bindings',
      }),
    };
  });

  describe('The ActorQueryOperationBgpTraversal module', () => {
    it('should be a function', () => {
      expect(ActorQueryOperationBgpTraversal).toBeInstanceOf(Function);
    });

    it('should be a ActorQueryOperationBgpTraversal constructor', () => {
      expect(new (<any> ActorQueryOperationBgpTraversal)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorQueryOperationBgpTraversal);
      expect(new (<any> ActorQueryOperationBgpTraversal)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorQueryOperation);
    });

    it('should not be able to create new ActorQueryOperationBgpTraversal objects without \'new\'', () => {
      expect(() => { (<any> ActorQueryOperationBgpTraversal)(); }).toThrow();
    });
  });

  describe('getPatternNonVocabUris', () => {
    it('return named nodes in regular patterns', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ))).toEqual([
        namedNode('http://example.org/s'),
        namedNode('http://example.org/o'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
        namedNode('http://example.org/g'),
      ))).toEqual([
        namedNode('http://example.org/s'),
        namedNode('http://example.org/o'),
        namedNode('http://example.org/g'),
      ]);
    });

    it('return named nodes in regular patterns with variables', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        variable('s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ))).toEqual([
        namedNode('http://example.org/o'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        variable('o'),
        namedNode('http://example.org/g'),
      ))).toEqual([
        namedNode('http://example.org/s'),
        namedNode('http://example.org/g'),
      ]);
    });

    it('return named nodes in rdf:type patterns', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://example.org/o'),
      ))).toEqual([
        namedNode('http://example.org/s'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://example.org/o'),
        namedNode('http://example.org/g'),
      ))).toEqual([
        namedNode('http://example.org/s'),
        namedNode('http://example.org/g'),
      ]);
    });

    it('return named nodes in rdf:type patterns with variables', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('http://example.org/o'),
      ))).toEqual([
        namedNode('http://example.org/s'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(quad(
        namedNode('http://example.org/s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://example.org/o'),
        variable('http://example.org/g'),
      ))).toEqual([
        namedNode('http://example.org/s'),
      ]);
    });
  });

  describe('getSourceUri', () => {
    it('should handle URIs without hashes', () => {
      return expect(ActorQueryOperationBgpTraversal.getSourceUri(namedNode('http://example.org/')))
        .toEqual('http://example.org/');
    });

    it('should handle URIs with hashes', () => {
      return expect(ActorQueryOperationBgpTraversal.getSourceUri(namedNode('http://example.org/page.html#somehash')))
        .toEqual('http://example.org/page.html');
    });
  });

  describe('getScoreSeedNonVocab', () => {
    it('should be 0 for no sources', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ), [])).toEqual(0);
    });

    it('should be 1 for one applicable sources', () => {
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ), [ 'http://example.org/s' ])).toEqual(1);
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ), [ 'http://example.org/o' ])).toEqual(1);
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ), [ 'http://example.org/o', 'http://example.org/p' ])).toEqual(1);
    });

    it('should be 2 for two applicable sources', () => {
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ), [ 'http://example.org/s', 'http://example.org/o' ])).toEqual(2);
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ), [ 'http://example.org/s', 'http://example.org/o', 'http://example.org/p' ])).toEqual(2);
    });

    it('should be 2 for repeated source presence', () => {
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/s#hash'),
      ), [ 'http://example.org/s' ])).toEqual(2);
    });
  });

  describe('getScoreSelectivity', () => {
    it('should be 0 for no variables', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSelectivity(quad(
        namedNode('http://example.org/s'),
        namedNode('http://example.org/p'),
        namedNode('http://example.org/o'),
      ))).toEqual(0);
    });

    it('should be 1 for 1 variable', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSelectivity(quad(
        namedNode('http://example.org/s'),
        variable('p'),
        namedNode('http://example.org/o'),
      ))).toEqual(1);
    });

    it('should be 3 for 3 variables', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSelectivity(quad(
        variable('s'),
        variable('p'),
        variable('o'),
      ))).toEqual(3);
    });
  });

  describe('An ActorQueryOperationBgpTraversal instance', () => {
    let actor: ActorQueryOperationBgpTraversal;

    beforeEach(() => {
      actor = new ActorQueryOperationBgpTraversal({ name: 'actor', bus, mediatorQueryOperation });
    });

    it('should not test on empty BGPs', () => {
      const op = { operation: { type: 'bgp', patterns: []}};
      return expect(actor.test(op)).rejects.toBeTruthy();
    });

    it('should not test on BGPs with a single pattern', () => {
      const op = { operation: { type: 'bgp', patterns: [ 'abc' ]}};
      return expect(actor.test(op)).rejects.toBeTruthy();
    });

    it('should test on BGPs with more than one pattern', () => {
      const op = { operation: { type: 'bgp', patterns: [ 'abc', 'def' ]}};
      return expect(actor.test(op)).resolves.toBeTruthy();
    });
  });
});
