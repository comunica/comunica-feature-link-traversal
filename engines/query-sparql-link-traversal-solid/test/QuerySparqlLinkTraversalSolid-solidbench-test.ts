/** @jest-environment setup-polly-jest/jest-environment-node */

// Needed to undo automock from actor-http-native, cleaner workarounds do not appear to be working.
if (!globalThis.window) {
  jest.unmock('follow-redirects');
}

import { QueryEngine } from '../lib';
import { usePolly, loadQueries } from './util';

const queries = loadQueries();

describe('System test: QuerySparqlLinkTraversalSolid', () => {
  usePolly();

  let engine: QueryEngine;
  beforeEach(async() => {
    engine = new QueryEngine();
    await engine.invalidateHttpCache(); // This *should* not be needed, but there appears to be a cache bug somewhere...
  });

  describeEach([
    [ 'interactive-discover-1-1.sparql', 6 ],
    [ 'interactive-discover-1-5.sparql', 8 ],
    [ 'interactive-discover-2-1.sparql', 66 ],
    [ 'interactive-discover-2-5.sparql', 98 ],
    [ 'interactive-discover-3-1.sparql', 71 ],
    [ 'interactive-discover-3-5.sparql', 142 ],
    [ 'interactive-discover-4-1.sparql', 5 ],
    [ 'interactive-discover-4-5.sparql', 7 ],
    [ 'interactive-discover-5-1.sparql', 15 ],
    [ 'interactive-discover-5-5.sparql', 20 ],
    [ 'interactive-discover-6-5.sparql', 27 ],
    [ 'interactive-discover-7-5.sparql', 1 ],
    [ 'interactive-discover-8-1.sparql', 10 ],
    [ 'interactive-short-4-1.sparql', 1 ],
    [ 'interactive-short-5-1.sparql', 1 ],
    [ 'interactive-short-6-1.sparql', 0 ],

    // The following tests are disabled, as they consume too much memory under default Node.js limits.
    // We may be able to enable these with future optimizations.
    // [ 'interactive-discover-6-1.sparql', 33 ],
    // [ 'interactive-discover-7-1.sparql', 6 ],

  ], (file, expectedCount) => () => {
    it('produces the expected results', async() => {
      const bindings = await engine.queryBindings(queries[file], { lenient: true });
      expect((await bindings.toArray()).length).toBe(expectedCount);
    });
  });
});

// We don't use jest.describe because that functionality is not available in browser tests.
function describeEach(entries: [string, number][], cb: (name: string, count: number) => () => void): void {
  for (const [ name, count ] of entries) {
    describe(`query ${name}`, cb(name, count));
  }
}
