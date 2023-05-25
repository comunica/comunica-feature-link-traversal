import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';

import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra, translate } from 'sparqlalgebrajs';
import { FilterNode } from '../lib/FilterNode';
import { SparqlRelationOperator } from '../lib/TreeMetadata';
import type { ITreeNode } from '../lib/TreeMetadata';

const DF = new DataFactory<RDF.BaseQuad>();

describe('ActorOptimizeLinkTraversalFilterTreeLinks', () => {
  describe('An ActorOptimizeLinkTraversalFilterTreeLinks instance', () => {
    let filterNode: FilterNode;

    beforeEach(() => {
      filterNode = new FilterNode();
    });
    describe('getFilterExpressionIfTreeNodeHasConstraint method', () => {
      const treeSubject = 'tree';
      it('should test when there are relations and a filter operation in the query', () => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: translate(`
          SELECT * WHERE { ?x ?y ?z 
          FILTER(?x = 5 || true)
          }`),
        });
        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
            },
          ],
        };

        const response = filterNode.getFilterExpressionIfTreeNodeHasConstraint(node, context);
        expect(response).toBeDefined();
      });

      it('should no test when the TREE relation are undefined', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: ITreeNode = {
          identifier: treeSubject,
        };

        const response = filterNode.getFilterExpressionIfTreeNodeHasConstraint(node, context);
        expect(response).toBeUndefined();
      });

      it('should not test when there is a filter operation in the query but no TREE relations', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [],
        };
        const response = filterNode.getFilterExpressionIfTreeNodeHasConstraint(node, context);
        expect(response).toBeUndefined();
      });

      it('should no test when there are no filter operation in the query but a TREE relation', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.ASK },
        });
        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
            },
          ],
        };
        const response = filterNode.getFilterExpressionIfTreeNodeHasConstraint(node, context);
        expect(response).toBeUndefined();
      });
    });

    describe('run method', () => {
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

        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
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

        const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

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
        const result = await filterNode.run(node, context);

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

          const result = await filterNode.run(node, context);

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

          const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

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

        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });
    });
  });
});
