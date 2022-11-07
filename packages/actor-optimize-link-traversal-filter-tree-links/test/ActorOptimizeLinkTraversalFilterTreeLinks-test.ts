import type { IActionOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import { KeysInitQuery } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import type { INode } from '@comunica/types-link-traversal';
import { Algebra } from 'sparqlalgebrajs';
import { ActorOptimizeLinkTraversalFilterTreeLinks } from '../lib/ActorOptimizeLinkTraversalFilterTreeLinks';
import type * as RDF from 'rdf-js';
import { DataFactory } from 'rdf-data-factory';

const DF = new DataFactory<RDF.BaseQuad>();


describe('ActorOptimizeLinkTraversalFilterTreeLinks', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeLinkTraversalFilterTreeLinks instance', () => {
    let actor: ActorOptimizeLinkTraversalFilterTreeLinks;

    beforeEach(() => {
      actor = new ActorOptimizeLinkTraversalFilterTreeLinks({ name: 'actor', bus });
    });
    describe('test method', () => {
      const treeSubject = 'tree';
      it('should test when there is relations and a filter operation in the query', async () => {
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
        const action: IActionOptimizeLinkTraversal = {
          context,
          treeMetadata: node,
        };

        const response = await actor.test(action);
        expect(response).toBe(true);
      });

      it('should not test when there is no relations and a filter operation in the query', async () => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [],
        };
        const action: IActionOptimizeLinkTraversal = {
          context,
          treeMetadata: node,
        };

        await actor.test(action).then(v => {
          expect(v).toBeUndefined();
        }).catch(error => {
          expect(error).toBeDefined();
        });
      });

      it('should not test when there is no tree metadata and a filter operation in the query', async () => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.FILTER },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [],
        };
        const action: IActionOptimizeLinkTraversal = {
          context,
        };

        await actor.test(action).then(v => {
          expect(v).toBeUndefined();
        }).catch(error => {
          expect(error).toBeDefined();
        });
      });

      it('should no test when there no filter operation in the query', async () => {
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
        const action: IActionOptimizeLinkTraversal = {
          context,
          treeMetadata: node,
        };

        await actor.test(action).then(v => {
          expect(v).toBeUndefined();
        }).catch(error => {
          expect(error).toBeDefined();
        });
      });

      it('should no test when there no filter operation in the query and no TREE relation', async () => {
        const context = new ActionContext({
          [KeysInitQuery.query.name]: { type: Algebra.types.ASK },
        });
        const node: INode = {
          subject: treeSubject,
          relation: [],
        };
        const action: IActionOptimizeLinkTraversal = {
          context,
          treeMetadata: node,
        };

        await actor.test(action).then(v => {
          expect(v).toBeUndefined();
        }).catch(error => {
          expect(error).toBeDefined();
        });
      });
    });


    describe('run method', () => {
      const aQuad: RDF.Quad = <RDF.Quad>DF.quad(DF.namedNode("ex:s"),
        DF.namedNode("ex:p"),
        DF.namedNode("ex:o")
      );
      it('should run accept the relation when the filter respect the relation', async () => {
        const treeSubject = 'tree';

        const node: INode = {
          subject: treeSubject,
          relation: [
            {
              node: 'http://bar.com',
              path: {
                value: "ex:path",
                quad: aQuad
              },
              value: {
                value: '5',
                quad: <RDF.Quad>DF.quad(DF.namedNode("ex:s"),
                DF.namedNode("ex:p"),
                DF.literal("5", DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')))
              }
            },
          ],
        };
        const bgp: RDF.Quad[] = <RDF.Quad[]>[
          DF.quad(DF.namedNode("ex:foo"), DF.namedNode("ex:path"), DF.variable("o"))
        ];
        const filterExpression = {
          expressionType: Algebra.expressionTypes.OPERATOR,
          operator: '=',
          type: Algebra.types.EXPRESSION,
          args:[
            {
              expressionType: Algebra.expressionTypes.TERM,
              type: Algebra.types.EXPRESSION,
              term:{
                termType: 'Variable',
                value:'o'
              }
            },
            {
              expressionType: Algebra.expressionTypes.TERM,
              type: Algebra.types.EXPRESSION,
              term:{
                termType: 'Literal',
                langugage: '',
                value:'5',
                datatype:{
                  termType:'namedNode',
                  value:'http://www.w3.org/2001/XMLSchema#integer'
                }
              }
            }
          ],
        };
        const query = {
          type: Algebra.types.PROJECT,
          input:{
            type: Algebra.types.FILTER,
            expression:filterExpression,
            input: {
              input: {
                type: "join",
                input: bgp,
              }
          },
          }
        };
        const context = new ActionContext({
          [KeysInitQuery.query.name]: query,
        });

        const action: IActionOptimizeLinkTraversal = {
          context,
          treeMetadata: node,
        };
        const result = await actor.run(action);

        expect(result.filters).toBeDefined();
        expect(result.filters).toStrictEqual(
          new Map([['http://bar.com', true]])
        );
      });

    });
  });
});
