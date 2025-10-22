import { KeysInitQuery } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';
import type { Algebra } from '@comunica/utils-algebra';
import { toAlgebra } from '@traqula/algebra-sparql-1-2';
import { Parser as SparqlParser } from '@traqula/parser-sparql-1-2';
import {
  ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris,
} from '../lib/ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris';
import '@comunica/utils-jest';

function translate(query: string): Algebra.Operation {
  const parser = new SparqlParser({ lexerConfig: {
    positionTracking: 'onlyOffset',
  }});
  const parsedSyntax = parser.parse(query);
  return toAlgebra(parsedSyntax, {
    quads: true,
    blankToVariable: true,
  });
}

describe('ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris instance', () => {
    let actor: ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris;

    beforeEach(() => {
      actor = new ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
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
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`);
      await expect(actor.run({ operation, context: new ActionContext({}) })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [ 'ex:s', 'ex:p', 'ex:o', 'ex:g' ],
        }),
      });
    });

    it('should run on context with 2 sources', async() => {
      await expect(actor.run({
        operation: <any> 'bla',
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [ 'a', 'b' ],
        }),
      })).resolves.toEqual({
        operation: <any> 'bla',
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [ 'a', 'b' ],
        }),
      });
    });

    it('should run on context with 0 sources', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [ 'ex:s', 'ex:p', 'ex:o', 'ex:g' ],
        }),
      });
    });

    it('should run on context with 2 sources and operation', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [ 'a', 'b' ],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [ 'a', 'b' ],
        }),
      });
    });

    it('should run on context with 0 sources and operation', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [
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
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: true,
      });
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [
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
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: true,
      });
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s#abc> <ex:p#> <ex:o#xyz> } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation with variables', async() => {
      const operation = translate(`SELECT * { GRAPH ?g { ?s ?p ?o } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      });
    });

    it('should run on context with 0 sources and operation with property paths', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p>* <ex:o> } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [
            'ex:s',
            'ex:o',
            'ex:g',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation with property paths with variables', async() => {
      const operation = translate(`SELECT * { GRAPH ?g { ?s <ex:p>* ?o } }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      });
    });

    it('should run when not extracting vocab IRIs', async() => {
      actor = new ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: false,
      });
      const operation = translate(`SELECT * { <ex:s> a <ex:TYPE>. <ex:s> <ex:p> <ex:o> }`);
      await expect(actor.run({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [],
        }),
      })).resolves.toEqual({
        operation,
        context: new ActionContext({
          [KeysInitQuery.querySourcesUnidentified.name]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });

    it('should record extracted IRIs in StatisticLinkDiscovery', async() => {
      const statistic = new StatisticLinkDiscovery();
      const spy = jest.spyOn(statistic, 'updateStatistic');
      const operation = translate(`SELECT * { GRAPH ?g1 { <ex:s> ?p ?o } }`);
      await actor.run({ operation, context: new ActionContext({ [statistic.key.name]: statistic }) });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ url: 'ex:s', metadata: { seed: true }}, { url: 'root' });
    });
  });
});
