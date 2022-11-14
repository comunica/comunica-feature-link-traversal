import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import type { INode } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';
import { FilterNode } from '../lib/FilterNode';

const DF = new DataFactory<RDF.BaseQuad>();

describe('ActorOptimizeLinkTraversalFilterTreeLinks', () => {
  describe('An ActorOptimizeLinkTraversalFilterTreeLinks instance', () => {
    let filterNode: FilterNode;

    beforeEach(() => {
      filterNode = new FilterNode();
    });
    describe('test method', () => {
      const treeSubject = 'tree';
      it('should test when there are relations and a filter operation in the query', () => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
            },
          ],
        };

        const response = filterNode.test(node, context);
        expect(response).toBe(true);
      });

      it('should no test when the TREE relation are undefined', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: INode = {
          subject: treeSubject,
        };

        const response = filterNode.test(node, context);
        expect(response).toBe(false);
      });

      it('should not test when there is no relations and a filter operation in the query', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [],
        };
        const response = filterNode.test(node, context);
        expect(response).toBe(false);
      });

      it('should not test when there is no tree metadata and a filter operation in the query', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [],
        };
        const response = filterNode.test(node, context);
        expect(response).toBe(false);
      });

      it('should no test when there no filter operation in the query', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.ASK },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
            },
          ],
        };
        const response = filterNode.test(node, context);
        expect(response).toBe(false);
      });

      it('should no test when there is no filter operation in the query and no TREE relation', async() => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.ASK },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [],
        };
        const response = filterNode.test(node, context);
        expect(response).toBe(false);
      });
    });

    describe('run method', () => {
      const aQuad: RDF.Quad = <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
        DF.namedNode('ex:p'),
        DF.namedNode('ex:o'));

      it('should accept the relation when the filter respect the relation', async() => {
        const treeSubject = 'tree';

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
            },
          ],
        };

        const bgp = (<RDF.Quad[]>[
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:path'), DF.variable('o')),
          DF.quad(DF.namedNode('ex:foo'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
          DF.quad(DF.namedNode('ex:bar'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
          DF.quad(DF.namedNode('ex:too'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
        ]).map(quad => {
          return {
            input: [ quad ],
            type: Algebra.types.JOIN,
          };
        });
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
          new Map([[ 'http://bar.com', true ]]),
        );
      });

      it('should not accept the relation when the filter is not respected by the relation', async() => {
        const treeSubject = 'tree';

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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
        const node: INode = { subject: 'foo' };
        const result = await filterNode.run(node, context);

        expect(result).toStrictEqual(
          new Map(),
        );
      });

      it('should accept the relation when there is multiple filters and the query path don\'t match the relation',
        async() => {
          const treeSubject = 'tree';

          const node: INode = {
            subject: treeSubject,
            relation: [
              {
                node: 'http://bar.com',
                path: {
                  value: 'ex:path',
                  quad: aQuad,
                },
                value: {
                  value: '5',
                  quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                    DF.namedNode('ex:p'),
                    DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                },
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

      it(`should accept the relations when the filter respect the relation
       and a relation doesn't specify a path`, async() => {
        const treeSubject = 'tree';

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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

      it('should return an empty filter map if there is bgp of lenght 0', async() => {
        const treeSubject = 'tree';

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: 'ex:path',
                quad: aQuad,
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode('ex:s'),
                  DF.namedNode('ex:p'),
                  DF.literal('5', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
              },
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
    });
  });
});
