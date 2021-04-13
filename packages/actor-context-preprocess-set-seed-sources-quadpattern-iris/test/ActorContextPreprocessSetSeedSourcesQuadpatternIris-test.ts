import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { Bus } from '@comunica/core';
import { ActionContext } from '@comunica/core/lib/Actor';
import { translate } from 'sparqlalgebrajs';
import {
  ActorContextPreprocessSetSeedSourcesQuadpatternIris,
} from '../lib/ActorContextPreprocessSetSeedSourcesQuadpatternIris';

describe('ActorContextPreprocessSetSeedSourcesQuadpatternIris', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorContextPreprocessSetSeedSourcesQuadpatternIris instance', () => {
    let actor: ActorContextPreprocessSetSeedSourcesQuadpatternIris;

    beforeEach(() => {
      actor = new ActorContextPreprocessSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        extractSubjects: true,
        extractPredicates: true,
        extractObjects: true,
        extractGraphs: true,
        extractVocabIris: true,
      });
    });

    it('should test', () => {
      return expect(actor.test({})).resolves.toEqual(true);
    });

    it('should run on no context', async() => {
      expect(await actor.run({})).toEqual({});
    });

    it('should run on empty context', async() => {
      expect(await actor.run({ context: ActionContext({}) })).toEqual({
        context: ActionContext({}),
      });
    });

    it('should run on context with 2 sources', async() => {
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [ 'a', 'b' ],
        }),
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [ 'a', 'b' ],
        }),
      });
    });

    it('should run on context with 0 sources', async() => {
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
      });
    });

    it('should run on context with 2 sources and operation', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [ 'a', 'b' ],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [ 'a', 'b' ],
        }),
      });
    });

    it('should run on context with 0 sources and operation', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [
            'ex:s',
            'ex:p',
            'ex:o',
            'ex:g',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation when only selecting some terms', async() => {
      actor = new ActorContextPreprocessSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: true,
      });
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p> <ex:o> } }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation with variables', async() => {
      const operation = translate(`SELECT * { GRAPH ?g { ?s ?p ?o } }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
      });
    });

    it('should run on context with 0 sources and operation with property paths', async() => {
      const operation = translate(`SELECT * { GRAPH <ex:g> { <ex:s> <ex:p>* <ex:o> } }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [
            'ex:s',
            'ex:o',
            'ex:g',
          ],
        }),
      });
    });

    it('should run on context with 0 sources and operation with property paths with variables', async() => {
      const operation = translate(`SELECT * { GRAPH ?g { ?s <ex:p>* ?o } }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
      });
    });

    it('should run when not extracting vocab IRIs', async() => {
      actor = new ActorContextPreprocessSetSeedSourcesQuadpatternIris({
        name: 'actor',
        bus,
        extractSubjects: true,
        extractPredicates: false,
        extractObjects: true,
        extractGraphs: false,
        extractVocabIris: false,
      });
      const operation = translate(`SELECT * { <ex:s> a <ex:TYPE>. <ex:s> <ex:p> <ex:o> }`, { quads: true });
      expect(await actor.run({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [],
        }),
        operation,
      })).toEqual({
        context: ActionContext({
          [KeysRdfResolveQuadPattern.sources]: [
            'ex:s',
            'ex:o',
          ],
        }),
      });
    });
  });
});
