import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as Path from 'node:path';
import { Polly } from '@pollyjs/core';
import { setupPolly } from 'setup-polly-jest';

const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const FSPersister = require('@pollyjs/persister-fs');

const recordingsDir = resolve(__dirname, './assets/http');

Polly.register(FSPersister);
Polly.register(NodeHttpAdapter);

// Configure everything related to PollyJS
export function usePolly() {
  const pollyContext = mockHttp();

  // eslint-disable-next-line jest/require-top-level-describe
  beforeEach(() => {
    pollyContext.polly.server.any().on('beforePersist', (req, recording) => {
      recording.request.headers = recording.request.headers.filter(({ name }: any) => name !== 'user-agent');
    });
  });

  // eslint-disable-next-line jest/require-top-level-describe
  afterEach(async() => {
    await pollyContext.polly.flush();
  });
}

// Mocks HTTP requests using Polly.JS
export function mockHttp() {
  return setupPolly({
    adapters: [ NodeHttpAdapter ],
    persister: FSPersister,
    persisterOptions: { fs: { recordingsDir }},
    recordFailedRequests: true,
    matchRequestsBy: {
      headers: {
        exclude: [ 'user-agent' ],
      },
    },
  });
}

const queries: Record<string, string> = {};
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
  queries[file] = readFileSync(Path.join(__dirname, '../../../web-clients/queries/solidbench', file), 'utf8');
}

export function loadQueries() {
  return queries;
}
