import { inspect } from "util";


export function usePolly() {
    // No-op
}

const queries = {};
for (const file of [
    'interactive-discover-1-1.sparql',
    'interactive-discover-1-5.sparql',
    'interactive-discover-2-1.sparql',
    'interactive-discover-2-5.sparql',
    'interactive-discover-3-1.sparql',
    'interactive-discover-3-5.sparql',
    'interactive-discover-4-1.sparql',
    'interactive-discover-4-5.sparql',
    'interactive-discover-5-1.sparql',
    'interactive-discover-5-5.sparql',
    'interactive-discover-6-1.sparql',
    'interactive-discover-6-5.sparql',
    'interactive-discover-7-1.sparql',
    'interactive-discover-7-5.sparql',
    'interactive-discover-8-1.sparql',
    'interactive-discover-8-5.sparql',
    'interactive-short-4-1.sparql',
    'interactive-short-5-1.sparql',
    'interactive-short-6-1.sparql',
]) {
    queries[file] = require(`../../../web-clients/queries/solidbench/${file}`).default;
}

// eslint-disable-next-line mocha/no-exports
export function loadQueries() {
    return queries;
}
