/** @jest-environment setup-polly-jest/jest-environment-node */
import { QueryEngine } from '../lib';
import { usePolly, loadQueries } from './util';

if (!globalThis.window) {
  jest.useRealTimers();
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
    [ 'interactive-discover-8-1.sparql', 10 ],
    [ 'interactive-discover-8-5.sparql', 10 ],

    // The following tests are disabled, as they consume too much memory under default Node.js limits.
    // We may be able to enable these with future optimizations.
    // [ 'interactive-discover-6-1.sparql', 33 ],
    // [ 'interactive-discover-7-1.sparql', 6 ],

  ], (file, expectedCount) => () => {
    it('produces the expected results', async() => {
      const bindings = await engine.queryBindings(queries[file], { lenient: true });
      // Ignore eslint suggestion to make this work in karma as well!
      // eslint-disable-next-line jest/prefer-to-have-length
      expect((await bindings.toArray()).length).toBe(expectedCount);
    });
  });

  // For queries discover 8 (with LIMIT), we need to wait a bit, as we can not await abort controller completion.
  // Otherwise we get the following error:
  //   ReferenceError: You are trying to `import` a file after the Jest environment has been torn down.
  afterAll(async() => {
    await new Promise(resolve => setTimeout(resolve, 1000));
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
