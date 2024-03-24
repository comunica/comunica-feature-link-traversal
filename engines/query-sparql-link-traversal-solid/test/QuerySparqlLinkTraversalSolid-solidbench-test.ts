/** @jest-environment setup-polly-jest/jest-environment-node */

// Needed to undo automock from actor-http-native, cleaner workarounds do not appear to be working.
import { QueryEngine } from '../lib';
import { usePolly, loadQueries } from './util';

if (!globalThis.window) {
  jest.unmock('follow-redirects');
}

const queries = loadQueries();

describe('System test: QuerySparqlLinkTraversalSolid', () => {
  usePolly();

  const engine: QueryEngine = new QueryEngine();

  describeEach([
    [ 'interactive-short-4-1.sparql', 1 ],
    [ 'interactive-short-5-1.sparql', 1 ],
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

    // The following tests are disabled, as they consume too much memory under default Node.js limits.
    // We may be able to enable these with future optimizations.
    // [ 'interactive-discover-6-1.sparql', 33 ],
    // [ 'interactive-discover-7-1.sparql', 6 ],

    // The following test works, but is causing the following error:
    //   ReferenceError: You are trying to `import` a file after the Jest environment has been torn down.
    // [ 'interactive-discover-8-1.sparql', 10 ],

  ], (file, expectedCount) => () => {
    it('produces the expected results', async() => {
      const bindings = await engine.queryBindings(queries[file], { lenient: true });
      await expect((bindings.toArray())).resolves.toHaveLength(expectedCount);
    });
  });
});

// We don't use jest.describe because that functionality is not available in browser tests.
function describeEach(entries: [string, number][], cb: (name: string, count: number) => () => void): void {
  // eslint-disable-next-line jest/prefer-each
  for (const [ name, count ] of entries) {
    // eslint-disable-next-line jest/valid-describe-callback
    describe(`query ${name}`, cb(name, count));
  }
}
