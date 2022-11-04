import type { IActionOptimizeLinkTraversal } from '@comunica/bus-optimize-link-traversal';
import { KeysInitQuery } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import type { INode } from '@comunica/types-link-traversal';
import { Algebra } from 'sparqlalgebrajs';
import { ActorOptimizeLinkTraversalFilterTreeLinks } from '../lib/ActorOptimizeLinkTraversalFilterTreeLinks';

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
      it('should test when there is relations and a filter operation in the query', async() => {
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

      it('should not test when there is no relations and a filter operation in the query', async() => {
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

      it('should not test when there is no tree metadata and a filter operation in the query', async() => {
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

      it('should no test when there no filter operation in the query and no TREE relation', async() => {
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
      it('should run', () => {
        // Return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
      });
    });
  });
});
