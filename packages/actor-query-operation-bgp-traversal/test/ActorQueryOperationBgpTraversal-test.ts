import type { IActorQueryOperationOutputBindings } from '@comunica/bus-query-operation';
import { ActorQueryOperation, Bindings } from '@comunica/bus-query-operation';
import { KEY_CONTEXT_SOURCES } from '@comunica/bus-rdf-resolve-quad-pattern';
import { ActionContext, Bus, KEY_CONTEXT_LOG } from '@comunica/core';
import { LoggerVoid } from '@comunica/logger-void';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import type { Algebra } from 'sparqlalgebrajs';
import { Factory } from 'sparqlalgebrajs';
import { ActorQueryOperationBgpTraversal } from '../lib/ActorQueryOperationBgpTraversal';
const FACTORY = new Factory();
const arrayifyStream = require('arrayify-stream');
const DF = new DataFactory();

describe('ActorQueryOperationBgpTraversal', () => {
  let bus: any;
  let mediatorQueryOperation: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorQueryOperation = {
      mediate: (arg: any) => Promise.resolve({
        bindingsStream: new ArrayIterator([ Bindings({
          graph: arg.operation.graph,
          object: arg.operation.object,
          predicate: arg.operation.predicate,
          subject: arg.operation.subject,
        }) ], { autoStart: false }),
        metadata: () => Promise.resolve({ totalItems: (arg.context || ActionContext({})).get('totalItems') }),
        type: 'bindings',
        variables: (arg.context || ActionContext({})).get('variables') || [],
        canContainUndefs: false,
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
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/o'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
        DF.namedNode('http://example.org/g'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/o'),
        DF.namedNode('http://example.org/g'),
      ]);
    });

    it('return named nodes in regular patterns with variables', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.variable('s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ))).toEqual([
        DF.namedNode('http://example.org/o'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.variable('o'),
        DF.namedNode('http://example.org/g'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/g'),
      ]);
    });

    it('return named nodes in rdf:type patterns', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/o'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/o'),
        DF.namedNode('http://example.org/g'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/g'),
      ]);
    });

    it('return named nodes in rdf:type patterns with variables', () => {
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.variable('http://example.org/o'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
      ]);
      expect(ActorQueryOperationBgpTraversal.getPatternNonVocabUris(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/o'),
        DF.variable('http://example.org/g'),
      ))).toEqual([
        DF.namedNode('http://example.org/s'),
      ]);
    });
  });

  describe('getSourceUri', () => {
    it('should handle URIs without hashes', () => {
      return expect(ActorQueryOperationBgpTraversal.getSourceUri(DF.namedNode('http://example.org/')))
        .toEqual('http://example.org/');
    });

    it('should handle URIs with hashes', () => {
      return expect(ActorQueryOperationBgpTraversal.getSourceUri(DF.namedNode('http://example.org/page.html#somehash')))
        .toEqual('http://example.org/page.html');
    });
  });

  describe('getScoreSeedNonVocab', () => {
    it('should be 0 for no sources', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ), [])).toEqual(0);
    });

    it('should be 1 for one applicable sources', () => {
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ), [ 'http://example.org/s' ])).toEqual(1);
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ), [ 'http://example.org/o' ])).toEqual(1);
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ), [ 'http://example.org/o', 'http://example.org/p' ])).toEqual(1);
    });

    it('should be 2 for two applicable sources', () => {
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ), [ 'http://example.org/s', 'http://example.org/o' ])).toEqual(2);
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ), [ 'http://example.org/s', 'http://example.org/o', 'http://example.org/p' ])).toEqual(2);
    });

    it('should be 2 for repeated source presence', () => {
      expect(ActorQueryOperationBgpTraversal.getScoreSeedNonVocab(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/s#hash'),
      ), [ 'http://example.org/s' ])).toEqual(2);
    });
  });

  describe('getScoreSelectivity', () => {
    it('should be 4 for no variables', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSelectivity(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.namedNode('http://example.org/p'),
        DF.namedNode('http://example.org/o'),
      ))).toEqual(4);
    });

    it('should be 3 for 1 variable', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSelectivity(DF.quad(
        DF.namedNode('http://example.org/s'),
        DF.variable('p'),
        DF.namedNode('http://example.org/o'),
      ))).toEqual(3);
    });

    it('should be 1 for 3 variables', () => {
      return expect(ActorQueryOperationBgpTraversal.getScoreSelectivity(DF.quad(
        DF.variable('s'),
        DF.variable('p'),
        DF.variable('o'),
      ))).toEqual(1);
    });
  });

  describe('sortPatterns', () => {
    it('should handle an empty array', () => {
      const patterns: Algebra.Pattern[] = [];
      const sources: string[] = [];
      ActorQueryOperationBgpTraversal.sortPatterns(patterns, sources);
      return expect(patterns).toEqual([]);
    });

    it('should prioritize patterns with seed IRIs', () => {
      const patterns: Algebra.Pattern[] = [
        FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
        FACTORY.createPattern(DF.namedNode('ex:s3'), DF.namedNode('ex:seed'), DF.namedNode('ex:o3')),
      ];
      const sources: string[] = [ 'ex:seed' ];
      ActorQueryOperationBgpTraversal.sortPatterns(patterns, sources);
      return expect(patterns).toEqual([
        FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
        FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        FACTORY.createPattern(DF.namedNode('ex:s3'), DF.namedNode('ex:seed'), DF.namedNode('ex:o3')),
      ]);
    });

    it('should prioritize patterns with the fewest variables', () => {
      const patterns: Algebra.Pattern[] = [
        FACTORY.createPattern(DF.variable('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        FACTORY.createPattern(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
        FACTORY.createPattern(DF.namedNode('ex:s3'), DF.variable('ex:p3'), DF.variable('ex:o3')),
      ];
      const sources: string[] = [ 'ex:seed' ];
      ActorQueryOperationBgpTraversal.sortPatterns(patterns, sources);
      return expect(patterns).toEqual([
        FACTORY.createPattern(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
        FACTORY.createPattern(DF.variable('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        FACTORY.createPattern(DF.namedNode('ex:s3'), DF.variable('ex:p3'), DF.variable('ex:o3')),
      ]);
    });

    it('should prioritize patterns with seed IRIs, and then by fewest variables', () => {
      const patterns: Algebra.Pattern[] = [
        FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.variable('ex:o2')),
        FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
      ];
      const sources: string[] = [ 'ex:seed' ];
      ActorQueryOperationBgpTraversal.sortPatterns(patterns, sources);
      return expect(patterns).toEqual([
        FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
        FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.variable('ex:o2')),
        FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
      ]);
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

    const pattern1 = DF.quad(DF.namedNode('1'), DF.namedNode('1'), DF.namedNode('1'), DF.variable('a'));
    const pattern2 = DF.quad(DF.variable('d'), DF.namedNode('4'), DF.namedNode('4'), DF.namedNode('4'));
    const patterns = [ pattern1, pattern2 ];

    it('should run without a context and delegate the pattern to the mediator', () => {
      const op = {
        operation: { type: 'bgp', patterns },
      };
      return actor.run(op).then(async(output: IActorQueryOperationOutputBindings) => {
        expect(output.variables).toEqual([ '?a', '?d' ]);
        expect(output.type).toEqual('bindings');
        expect(output.canContainUndefs).toEqual(false);
        expect(await (<any> output).metadata).toBeUndefined();
        expect(await arrayifyStream(output.bindingsStream)).toEqual([
          Bindings({
            subject: DF.namedNode('1'),
            predicate: DF.namedNode('1'),
            object: DF.namedNode('1'),
            graph: DF.variable('a'),
          }),
        ]);
      });
    });

    it('should run with an empty context and delegate the pattern to the mediator', () => {
      const op = {
        operation: { type: 'bgp', patterns },
        context: ActionContext({}),
      };
      return actor.run(op).then(async(output: IActorQueryOperationOutputBindings) => {
        expect(output.variables).toEqual([ '?a', '?d' ]);
        expect(output.type).toEqual('bindings');
        expect(output.canContainUndefs).toEqual(false);
        expect(await (<any> output).metadata).toBeUndefined();
        expect(await arrayifyStream(output.bindingsStream)).toEqual([
          Bindings({
            subject: DF.namedNode('1'),
            predicate: DF.namedNode('1'),
            object: DF.namedNode('1'),
            graph: DF.variable('a'),
          }),
        ]);
      });
    });

    it('should run with string sources and delegate the pattern to the mediator', () => {
      const op = {
        operation: { type: 'bgp', patterns },
        context: ActionContext({
          [KEY_CONTEXT_SOURCES]: [ 'a', 'b' ],
        }),
      };
      return actor.run(op).then(async(output: IActorQueryOperationOutputBindings) => {
        expect(output.variables).toEqual([ '?a', '?d' ]);
        expect(output.type).toEqual('bindings');
        expect(output.canContainUndefs).toEqual(false);
        expect(await (<any> output).metadata).toBeUndefined();
        expect(await arrayifyStream(output.bindingsStream)).toEqual([
          Bindings({
            subject: DF.namedNode('1'),
            predicate: DF.namedNode('1'),
            object: DF.namedNode('1'),
            graph: DF.variable('a'),
          }),
        ]);
      });
    });

    it('should run with non-string sources and delegate the pattern to the mediator', () => {
      const op = {
        operation: { type: 'bgp', patterns },
        context: ActionContext({
          [KEY_CONTEXT_SOURCES]: [ 'a', <any> { value: {}} ],
        }),
      };
      return actor.run(op).then(async(output: IActorQueryOperationOutputBindings) => {
        expect(output.variables).toEqual([ '?a', '?d' ]);
        expect(output.type).toEqual('bindings');
        expect(output.canContainUndefs).toEqual(false);
        expect(await (<any> output).metadata).toBeUndefined();
        expect(await arrayifyStream(output.bindingsStream)).toEqual([
          Bindings({
            subject: DF.namedNode('1'),
            predicate: DF.namedNode('1'),
            object: DF.namedNode('1'),
            graph: DF.variable('a'),
          }),
        ]);
      });
    });

    it('should run with a logger', async() => {
      const logger = new LoggerVoid();
      const spy = spyOn(logger, 'debug');
      const op = {
        operation: { type: 'bgp', patterns },
        context: ActionContext({ [KEY_CONTEXT_LOG]: logger }),
      };
      await actor.run(op);
      expect(spy).toHaveBeenCalledWith('Best traversal pattern: ', {
        actor: 'actor',
        pattern: patterns[0],
      });
    });
  });
});
