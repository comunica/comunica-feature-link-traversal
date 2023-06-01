import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';

import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import { filterNode, groupRelations, getFilterExpression } from '../lib/filterNode';
import { isBooleanExpressionTreeRelationFilterSolvable } from
  '../lib/solver';
import { SparqlRelationOperator } from '../lib/TreeMetadata';
import type { ITreeNode, ITreeRelation } from '../lib/TreeMetadata';

const DF = new DataFactory<RDF.BaseQuad>();

describe('filterNode Module', () => {
  describe('getFilterExpression ', () => {
    const treeSubject = 'tree';
    it('should return the filter operation if the query has a filter expression', () => {
      const context = new ActionContext({
        [KeysInitQuery.query.name]: translate(`
          SELECT * WHERE { ?x ?y ?z 
          FILTER(?x = 5 || true)
          }`),
      });

      const response = getFilterExpression(context);
      expect(response).toBeDefined();
    });

    it('should return undefined if the query does not have a filter expression', async() => {
      const context = new ActionContext({
        [KeysInitQuery.query.name]: { type: Algebra.types.ASK },
      });

      const response = getFilterExpression(context);
      expect(response).toBeUndefined();
    });
  });

  describe('filternNode', () => {
    describe('with isBooleanExpressionTreeRelationFilterSolvable', () => {
      it('should accept the relation when the filter respect the relation', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should return an empty filter if the query has not filter', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should return an empty filter if the TREE Node has no relation', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [],
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should return an empty filter if the TREE Node has no relation field', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should not accept the relation when the filter is not respected by the relation', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER(?o=88)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', false ]]),
        );
      });

      it('should accept the relation when the query don\'t invoke the right path', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:superPath ?o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should return an empty map when there is no relation', async() => {
        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER(?o=88)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });
        const node: ITreeNode = { identifier: 'foo' };
        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should accept the relation when there is multiple filters and the query path don\'t match the relation',
        async() => {
          const treeSubject = 'tree';

          const node: ITreeNode = {
            identifier: treeSubject,
            relation: [
              {
                node: 'http://bar.com',
                path: 'http://example.com#path',
                value: {
                  value: '5',
                  term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
                },
                type: SparqlRelationOperator.EqualThanRelation,
              },
            ],
          };
          const bgp: RDF.Quad[] = <RDF.Quad[]>[
            DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:superPath'), DF.variable('o')),
          ];

          const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER(?o=5 && ?o<=5 )
          }
          `, { prefixes: { ex: 'http://example.com#' }});

          const context = new ActionContext({
            [KeysInitQuery.query.name]: query,
          });

          const result = await filterNode(
            node,
            context,
            isBooleanExpressionTreeRelationFilterSolvable,
          );

          expect(result).toStrictEqual(
            new Map([[ 'http://bar.com', true ]]),
          );
        });

      it('should accept the relations when one respect the filter and another has no path and value defined',
        async() => {
          const treeSubject = 'tree';

          const node: ITreeNode = {
            identifier: treeSubject,
            relation: [
              {
                node: 'http://bar.com',
                path: 'http://example.com#path',
                value: {
                  value: '5',
                  term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
                },
                type: SparqlRelationOperator.EqualThanRelation,

              },

              {
                node: 'http://foo.com',
              },
            ],
          };
          const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
          const context = new ActionContext({
            [KeysInitQuery.query.name]: query,
          });

          const result = await filterNode(
            node,
            context,
            isBooleanExpressionTreeRelationFilterSolvable,
          );

          expect(result).toStrictEqual(
            new Map([[ 'http://bar.com', true ], [ 'http://foo.com', true ]]),
          );
        });

      it('should accept the relation when the filter argument are not related to the query', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER(?p=88)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should accept the relation when there is multiples filters and one is not relevant', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER((?p=88 && ?p>3) || true)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should accept the relation when the filter compare two constants', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            FILTER(5=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should accept the relation when the filter respect the relation with a construct query', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

        const query = translate(`
          CONSTRUCT {
            
          } WHERE{
            ex:foo ex:path ?o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should accept the relation when the filter respect the relation with a nested query', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

        const query = translate(`
          SELECT * WHERE {
            ?o ex:resp ?v .
            {
              SELECT ?o WHERE {
              ex:foo ex:path ?o.
            }
          }
           FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should accept the relation when a complex filter respect the relation', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.GreaterThanOrEqualToRelation,
            },
          ],
        };

        const query = translate(`
          SELECT ?o ?x WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
            ex:foo ex:p2 ?x.
            FILTER(?o>2 || ?x=4 || (?x<3 && ?o<6) )
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it(`should accept a relation if a first relation is not 
      satisfiable and a second is because it does not have countraint`, async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
            },
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.GreaterThanRelation,
            },
          ],
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it(`should accept a relation if a first relation is not satisfiable
       and a second has a path no present into the filter expression`, async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'http://example.com#path2',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.GreaterThanRelation,
            },
            {
              node: 'http://bar.com',
              path: 'http://example.com#path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.GreaterThanRelation,
            },
          ],
        };

        const query = translate(`
          SELECT ?o WHERE {
            ex:foo ex:path ?o.
            ex:foo ex:p ex:o.
            FILTER(?o=5)
          }
          `, { prefixes: { ex: 'http://example.com#' }});

        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode(
          node,
          context,
          isBooleanExpressionTreeRelationFilterSolvable,
        );

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });
    });
  });

  describe('groupRelations', () => {
    it('should return an empty group given no relation', () => {
      expect(groupRelations([])).toStrictEqual([]);
    });

    it('given relations with the same nodes and path should return one group', () => {
      const relations: ITreeRelation[] = [
        {
          path: 'foo',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
      ];
      const group = groupRelations(relations);

      expect(group).toStrictEqual([ relations ]);
    });

    it('given relations with the same node and path execpt one without path should return two groups', () => {
      const relations: ITreeRelation[] = [
        {
          path: 'foo',
          node: 'foo',
        },
        {
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
      ];

      const expectedGroup = [
        [
          {
            path: 'foo',
            node: 'foo',
          },
          {
            path: 'foo',
            node: 'foo',
          },
        ],
        [
          {
            node: 'foo',
          },
        ],
      ];
      const group = groupRelations(relations);

      expect(group).toStrictEqual(expectedGroup);
    });

    it('given relations with no path should return one group', () => {
      const relations: ITreeRelation[] = [
        {
          node: 'foo',
        },
        {
          node: 'foo',
        },
        {
          node: 'foo',
        },
      ];
      const group = groupRelations(relations);

      expect(group).toStrictEqual([ relations ]);
    });

    it('given relations with multiple node should return different group', () => {
      const relations: ITreeRelation[] = [
        {
          path: 'foo',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'bar',
        },
        {
          path: 'foo',
          node: 'foo',
        },
      ];

      const expectedGroup = [
        [
          {
            path: 'foo',
            node: 'foo',
          },
          {
            path: 'foo',
            node: 'foo',
          },
        ],
        [
          {
            path: 'foo',
            node: 'bar',
          },
        ],
      ];
      const group = groupRelations(relations);
      // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
      expect(group.sort()).toStrictEqual(expectedGroup.sort());
    });

    it('given relations with multiple path should different group', () => {
      const relations: ITreeRelation[] = [
        {
          path: 'bar',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
      ];

      const expectedGroup = [
        [
          {
            path: 'foo',
            node: 'foo',
          },
          {
            path: 'foo',
            node: 'foo',
          },
        ],
        [
          {
            path: 'bar',
            node: 'foo',
          },
        ],
      ];
      const group = groupRelations(relations);

      // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
      expect(group.sort()).toStrictEqual(expectedGroup.sort());
    });

    it('given relations with multiple path and group should return different group', () => {
      const relations: ITreeRelation[] = [
        {
          path: 'bar',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
        {
          path: 'foo',
          node: 'foo',
        },
        {
          path: 'tor',
          node: 'tor',
        },
      ];

      const expectedGroup = [
        [
          {
            path: 'foo',
            node: 'foo',
          },
          {
            path: 'foo',
            node: 'foo',
          },
        ],
        [
          {
            path: 'bar',
            node: 'foo',
          },
        ],
        [
          {
            path: 'tor',
            node: 'tor',
          },
        ],
      ];
      const group = groupRelations(relations);

      // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
      expect(group.sort()).toStrictEqual(expectedGroup.sort());
    });
  });
});
