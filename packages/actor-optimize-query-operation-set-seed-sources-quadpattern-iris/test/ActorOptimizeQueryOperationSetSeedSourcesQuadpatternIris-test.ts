import type { MediatorQuerySourceIdentify } from '@comunica/bus-query-source-identify';
import { KeysQueryOperation, KeysQuerySourceIdentify, KeysStatistics } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';
import { translate } from 'sparqlalgebrajs';
import {
  ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris,
} from '../lib/ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris';
import '@comunica/utils-jest';

describe('ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris', () => {
  let bus: any;
  let mediatorQuerySourceIdentify: MediatorQuerySourceIdentify;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorQuerySourceIdentify = <any>{
      mediate: jest.fn((action: any) => {
        return { querySource: action.querySourceUnidentified.value };
      }),
    };
  });

  describe('An ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris instance', () => {
    let actor: ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris;

    beforeEach(() => {
      actor = new ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        mediatorQuerySourceIdentify,
        extractSubjects: true,
        extractPredicates: true,
        extractObjects: true,
        extractGraphs: true,
        extractVocabIris: true,
      });
    });

    it('should test', async() => {
      await expect(actor.test({ operation: <any> 'bla', context: new ActionContext({}) }))
        .resolves.toPassTestVoid();
    });

    it('should run on empty context', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      await expect(actor.run({ operation, context: new ActionContext({}) })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [ 'ex:s', 'ex:p', 'ex:o', 'ex:g' ],
        }),
      });
    });

    it('should run on context with 2 sources', async() => {
      await expect(actor.run({
        operation: <any> 'bla',
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [ 'a', 'b' ],
        }),
      })).resolves.toEqual({
        operation: <any> 'bla',
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [ 'a', 'b' ],
        }),
      });
    });

    it('should run on context with 0 sources', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [ 'ex:s', 'ex:p', 'ex:o', 'ex:g' ],
        }),
      });

      expect(mediatorQuerySourceIdentify.mediate).toHaveBeenCalledWith({
        querySourceUnidentified: {
          value: 'ex:s',
          context: new ActionContext().set(KeysQuerySourceIdentify.traverse, true),
        },
        context: new ActionContext({ [KeysQueryOperation.querySources.name]: []}),
      });
      expect(mediatorQuerySourceIdentify.mediate).toHaveBeenCalledWith({
        querySourceUnidentified: {
          value: 'ex:p',
          context: new ActionContext().set(KeysQuerySourceIdentify.traverse, true),
        },
        context: new ActionContext({ [KeysQueryOperation.querySources.name]: []}),
      });
      expect(mediatorQuerySourceIdentify.mediate).toHaveBeenCalledWith({
        querySourceUnidentified: {
          value: 'ex:o',
          context: new ActionContext().set(KeysQuerySourceIdentify.traverse, true),
        },
        context: new ActionContext({ [KeysQueryOperation.querySources.name]: []}),
      });
      expect(mediatorQuerySourceIdentify.mediate).toHaveBeenCalledWith({
        querySourceUnidentified: {
          value: 'ex:g',
          context: new ActionContext().set(KeysQuerySourceIdentify.traverse, true),
        },
        context: new ActionContext({ [KeysQueryOperation.querySources.name]: []}),
      });
    });

    it('should run on context with 2 sources and operation', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [ 'a', 'b' ],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [ 'a', 'b' ],
        }),
      });
    });

    it('should run on context with 0 sources and operation', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [
            'ex:s',
            'ex:p',
            'ex:o',
            'ex:g',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation when only selecting some terms', async() => {
      actor = new ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        mediatorQuerySourceIdentify,
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: true,
      });
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation when only selecting some terms with fragments', async() => {
      actor = new ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        mediatorQuerySourceIdentify,
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: true,
      });
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s#abc> <ex:p#> <ex:o#xyz> } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation with variables', async() => {
      const operation = translate(`SELECT * { GRAPH ?g { ?s ?p ?o } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      });
    });

    it('should run on context with 0 sources and operation with property paths', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p>* <ex:o> } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [
            'ex:s',
            'ex:o',
            'ex:g',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation with property paths with variables', async() => {
      const operation = translate(`SELECT * { GRAPH ?g { ?s <ex:p>* ?o } }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      });
    });

    it('should run when not extracting vocab IRIs', async() => {
      actor = new ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        mediatorQuerySourceIdentify,
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: false,
      });
      const operation = translate(`SELECT * { <ex:s> a <ex:TYPE>. <ex:s> <ex:p> <ex:o> }`, { quads: true });
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysQueryOperation.querySources.name]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });
    it('should run discovery statistic if available', async() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2021-01-01T00:00:00Z').getTime());

      const operation = translate(`SELECT * {  ?s ?p <ex:o>  }`, { quads: false });
      const discovery = new StatisticLinkDiscovery();
      const emitSpy = jest.spyOn(discovery, 'emit');
      await actor.run({
        operation,
        context: new ActionContext({
          [KeysStatistics.discoveredLinks.name]: discovery,
        }),
      });
      expect(emitSpy).toHaveBeenCalledWith(
        {
          edge: [ 'root', 'ex:o' ],
          metadataChild: [{ discoverOrder: 0, discoveredTimestamp: 0, seed: true }],
          metadataParent: undefined,
        },
      );
      jest.useRealTimers();
    });
  });
});
