import { KeysQueryOperation } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { DataFactory } from 'rdf-data-factory';
import { Factory } from 'sparqlalgebrajs';
import { ActorRdfJoinEntriesSortTraversalZeroKnowledge } from '../lib/ActorRdfJoinEntriesSortTraversalZeroKnowledge';
import '@comunica/utils-jest';

const FACTORY = new Factory();
const DF = new DataFactory();

describe('ActorRdfJoinEntriesSortTraversalZeroKnowledge', () => {
  let bus: any;
  let context: IActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    context = new ActionContext();
  });

  describe('An ActorRdfJoinEntriesSortTraversalZeroKnowledge instance', () => {
    let actor: ActorRdfJoinEntriesSortTraversalZeroKnowledge;

    beforeEach(() => {
      actor = new ActorRdfJoinEntriesSortTraversalZeroKnowledge({ name: 'actor', bus });
    });

    describe('getPatternNonVocabUris', () => {
      it('return named nodes in regular patterns', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/o'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
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
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
          DF.variable('s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/o'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
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
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
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
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.variable('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/o'),
          DF.variable('http://example.org/g'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
        ]);
      });

      it('return named nodes in regular paths', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createLink(DF.namedNode('http://example.org/p')),
          DF.namedNode('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/o'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createNps([ DF.namedNode('http://example.org/p') ]),
          DF.namedNode('http://example.org/o'),
          DF.namedNode('http://example.org/g'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/o'),
          DF.namedNode('http://example.org/g'),
        ]);
      });

      it('return named nodes in regular paths with variables', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.variable('s'),
          FACTORY.createLink(DF.namedNode('http://example.org/p')),
          DF.namedNode('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/o'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createNps([ DF.namedNode('http://example.org/p') ]),
          DF.variable('o'),
          DF.namedNode('http://example.org/g'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/g'),
        ]);
      });

      it('return named nodes in rdf:type paths', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createLink(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')),
          DF.namedNode('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createNps([ DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type') ]),
          DF.namedNode('http://example.org/o'),
          DF.namedNode('http://example.org/g'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/g'),
        ]);
      });

      it('return named nodes in rdf:type paths with variables', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createLink(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')),
          DF.variable('http://example.org/o'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
        ]);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getPatternNonVocabUris(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createNps([ DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type') ]),
          DF.namedNode('http://example.org/o'),
          DF.variable('http://example.org/g'),
        ))).toEqual([
          DF.namedNode('http://example.org/s'),
        ]);
      });
    });

    describe('getSourceUri', () => {
      it('should handle URIs without hashes', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getSourceUri(DF.namedNode('http://example.org/')))
          .toBe('http://example.org/');
      });

      it('should handle URIs with hashes', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge
          .getSourceUri(DF.namedNode('http://example.org/page.html#somehash')))
          .toBe('http://example.org/page.html');
      });
    });

    describe('getScoreSeedNonVocab', () => {
      it('should be 0 for no sources', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ), [])).toBe(0);
      });

      it('should be 1 for one applicable sources', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ), [ 'http://example.org/s' ])).toBe(1);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ), [ 'http://example.org/o' ])).toBe(1);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ), [ 'http://example.org/o', 'http://example.org/p' ])).toBe(1);
      });

      it('should be 2 for two applicable sources', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ), [ 'http://example.org/s', 'http://example.org/o' ])).toBe(2);
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ), [ 'http://example.org/s', 'http://example.org/o', 'http://example.org/p' ])).toBe(2);
      });

      it('should be 2 for repeated source presence', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSeedNonVocab(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/s#hash'),
        ), [ 'http://example.org/s' ])).toBe(2);
      });
    });

    describe('getScoreSelectivity', () => {
      it('should be 4 for a pattern with no variables', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.namedNode('http://example.org/p'),
          DF.namedNode('http://example.org/o'),
        ))).toBe(4);
      });

      it('should be 3 for a pattern with 1 variable', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(FACTORY.createPattern(
          DF.namedNode('http://example.org/s'),
          DF.variable('p'),
          DF.namedNode('http://example.org/o'),
        ))).toBe(3);
      });

      it('should be 1 for a pattern with 3 variables', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(FACTORY.createPattern(
          DF.variable('s'),
          DF.variable('p'),
          DF.variable('o'),
        ))).toBe(1);
      });

      it('should be 4 for a path with no variables', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createLink(DF.namedNode('http://example.org/p')),
          DF.namedNode('http://example.org/o'),
        ))).toBe(4);
      });

      it('should be 3 for a path with 1 variable', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(FACTORY.createPath(
          DF.namedNode('http://example.org/s'),
          FACTORY.createNps([ DF.namedNode('http://example.org/p') ]),
          DF.variable('o'),
        ))).toBe(3);
      });

      it('should be 1 for a path with 2 variables', () => {
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.getScoreSelectivity(FACTORY.createPath(
          DF.variable('s'),
          FACTORY.createNps([ DF.namedNode('http://example.org/p1'), DF.namedNode('http://example.org/p2') ]),
          DF.variable('o'),
        ))).toBe(2);
      });
    });

    describe('sortJoinEntries', () => {
      it('should handle an empty array', () => {
        const sources: string[] = [];
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries([], sources)).toEqual([]);
      });

      it('should prioritize patterns with seed IRIs', () => {
        const sources: string[] = [ 'ex:seed' ];
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s3'), DF.namedNode('ex:seed'), DF.namedNode('ex:o3')),
          },
        ], sources)).toEqual([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s3'), DF.namedNode('ex:seed'), DF.namedNode('ex:o3')),
          },
        ]);
      });

      it('should prioritize patterns with the fewest variables', () => {
        const sources: string[] = [ 'ex:seed' ];
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.variable('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s3'), DF.variable('ex:p3'), DF.variable('ex:o3')),
          },
        ], sources)).toEqual([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.variable('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s3'), DF.variable('ex:p3'), DF.variable('ex:o3')),
          },
        ]);
      });

      it('should prioritize patterns with seed IRIs, and then by fewest variables', () => {
        const sources: string[] = [ 'ex:seed' ];
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.variable('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
          },
        ], sources)).toEqual([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.variable('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
          },
        ]);
      });

      it('should prioritize a pattern over another operation type', () => {
        const sources: string[] = [ 'ex:seed' ];
        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createNop(),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
        ], sources)).toEqual([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createNop(),
          },
        ]);

        expect(ActorRdfJoinEntriesSortTraversalZeroKnowledge.sortJoinEntries([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createNop(),
          },
        ], sources)).toEqual([
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          },
          {
            output: <any> {},
            metadata: <any> {},
            operation: FACTORY.createNop(),
          },
        ]);
      });
    });

    describe('test', () => {
      it('should return true', async() => {
        await expect(actor.test(<any> {})).resolves.toPassTestVoid();
      });
    });

    describe('run', () => {
      it('should handle zero entries', async() => {
        await expect(actor.run({
          entries: [],
          context,
        })).resolves.toEqual({ entries: []});
      });

      it('should handle one entry', async() => {
        await expect(actor.run({
          entries: [
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
            },
          ],
          context,
        })).resolves.toEqual({
          entries: [
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
            },
          ],
        });
      });

      it('should handle multiple entries', async() => {
        context = context.set(KeysQueryOperation.querySources, [
          { source: { referenceValue: 'ex:seed' }},
          { source: { referenceValue: 'ex:seed2' }},
        ]);
        await expect(actor.run({
          entries: [
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
            },
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.variable('ex:o2')),
            },
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:seed2'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
            },
          ],
          context,
        })).resolves.toEqual({
          entries: [
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:seed2'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
            },
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:seed'), DF.namedNode('ex:p2'), DF.variable('ex:o2')),
            },
            {
              output: <any> {},
              metadata: <any> {},
              operation: FACTORY.createPattern(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
            },
          ],
        });
      });
    });
  });
});
