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
              path: 'ex:path',
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
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const bgp: RDF.Quad[] = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
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
                value: '88',
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
              path: 'ex:path',
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
                value: '88',
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
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should return an empty map when there is no relation', async() => {
        const bgp: RDF.Quad[] = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:superPath'), DF.variable('o')),
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
                value: '88',
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
                path: 'ex:path',
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
          const filterExpression = {
            expressionType: 'operator',
            operator: '&&',
            type: 'expression',
            args: [
              {
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
                      value: '88',
                      datatype: {
                        termType: 'namedNode',
                        value: 'http://www.w3.org/2001/XMLSchema#integer',
                      },
                    },
                  },
                ],
              },
              {
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
                path: 'ex:path',
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
          const bgp: RDF.Quad[] = <RDF.Quad[]>[
            DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
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
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const bgp: RDF.Quad[] = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
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
                value: 'p',
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
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const bgp: RDF.Quad[] = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
        ];
        const filterExpression = {
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '&&',
          type: Algebra.types.EXPRESSION,
          args: [
            {
              expressionType: Algebra.expressionTypes.OPERATOR,
              operator: '=',
              type: Algebra.types.EXPRESSION,
              args: [{
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
            },
            {
              expressionType: Algebra.expressionTypes.OPERATOR,
              operator: '=',
              type: Algebra.types.EXPRESSION,
              args: [{
                expressionType: Algebra.expressionTypes.TERM,
                type: Algebra.types.EXPRESSION,
                term: {
                  termType: 'Variable',
                  value: 'p',
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
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const bgp: RDF.Quad[] = <RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
        ];
        const filterExpression = {
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '&&',
          type: Algebra.types.EXPRESSION,
          args: [
            {
              expressionType: Algebra.expressionTypes.OPERATOR,
              operator: '=',
              type: Algebra.types.EXPRESSION,
              args: [{
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
            },
            {
              expressionType: Algebra.expressionTypes.OPERATOR,
              operator: '=',
              type: Algebra.types.EXPRESSION,
              args: [{
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
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should return an empty filter map if the bgp if empty', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
        const bgp: RDF.Quad[] = <RDF.Quad[]>[];
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
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should return an empty filter map if there is no bgp', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };
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
            input: {},
          },
        };
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should accept the relation when the filter respect the relation with a construct query', async() => {
        const treeSubject = 'tree';

        const node: ITreeNode = {
          identifier: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

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
          type: Algebra.types.CONSTRUCT,
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
          template: bgp,
        };

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
              path: 'ex:path',
              value: {
                value: '5',
                term: DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
              },
              type: SparqlRelationOperator.EqualThanRelation,
            },
          ],
        };

        const query = {
          type: 'project',
          input: {
            type: 'filter',
            input: {
              type: 'join',
              input: [
                {
                  type: 'project',
                  input: {
                    type: 'project',
                    input: {
                      type: 'join',
                      input: [
                        {
                          termType: 'Quad',
                          value: '',
                          identifier: {
                            termType: 'Variable',
                            value: 's',
                          },
                          predicate: {
                            termType: 'NamedNode',
                            value: 'http://semweb.mmlab.be/ns/linkedconnections#departureTime',
                          },
                          object: {
                            termType: 'Variable',
                            value: 'date',
                          },
                          graph: {
                            termType: 'DefaultGraph',
                            value: '',
                          },
                          type: 'pattern',
                        },
                      ],
                    },
                    variables: [
                      {
                        termType: 'Variable',
                        value: 's',
                      },
                    ],
                  },
                  variables: [
                    {
                      termType: 'Variable',
                      value: 's',
                    },
                  ],
                },
                {
                  termType: 'Quad',
                  value: '',
                  identifier: {
                    termType: 'Variable',
                    value: 's',
                  },
                  predicate: {
                    termType: 'NamedNode',
                    value: 'http://semweb.mmlab.be/ns/linkedconnections#departureStop',
                  },
                  object: {
                    termType: 'Variable',
                    value: 'o',
                  },
                  graph: {
                    termType: 'DefaultGraph',
                    value: '',
                  },
                  type: 'pattern',
                },
              ],
            },
            expression: {
              type: 'expression',
              expressionType: 'operator',
              operator: '&&',
              args: [
                {
                  type: 'expression',
                  expressionType: 'operator',
                  operator: '>=',
                  args: [
                    {
                      type: 'expression',
                      expressionType: 'term',
                      term: {
                        termType: 'Variable',
                        value: 'date',
                      },
                    },
                    {
                      type: 'expression',
                      expressionType: 'term',
                      term: {
                        termType: 'Literal',
                        value: '2022-11-08T08:00:00.000Z',
                        language: '',
                        datatype: {
                          termType: 'NamedNode',
                          value: 'http://www.w3.org/2001/XMLSchema#dateTime',
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'expression',
                  expressionType: 'operator',
                  operator: '=',
                  args: [
                    {
                      type: 'expression',
                      expressionType: 'operator',
                      operator: 'str',
                      args: [
                        {
                          type: 'expression',
                          expressionType: 'term',
                          term: {
                            termType: 'Variable',
                            value: 'o',
                          },
                        },
                      ],
                    },
                    {
                      type: 'expression',
                      expressionType: 'term',
                      term: {
                        termType: 'Literal',
                        value: 'http://irail.be/stations/NMBS/008812146',
                        language: '',
                        datatype: {
                          termType: 'NamedNode',
                          value: 'http://www.w3.org/2001/XMLSchema#string',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
          variables: [
            {
              termType: 'Variable',
              value: 'o',
            },
            {
              termType: 'Variable',
              value: 's',
            },
          ],
        };

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
              path: 'ex:path',
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
          FILTER(?o>2|| ?x=4 || (?x<3 && ?o<3) )
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
