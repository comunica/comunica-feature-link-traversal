#!/usr/bin/env node
/* eslint-disable node/no-path-concat */
import { HttpServiceSparqlEndpoint } from '@comunica/actor-init-query';
import { CliArgsHandlerSolidAuth } from '@comunica/query-sparql-solid';
import { CliArgsHandlerAnnotateSources } from '../lib/CliArgsHandlerAnnotateSources';
import { CliArgsHandlerLinkFilters } from '../lib/CliArgsHandlerLinkFilters';

const defaultConfigPath = `${__dirname}/../config/config-default.json`;

HttpServiceSparqlEndpoint.runArgsInProcess(
  process.argv.slice(2),
  process.stdout,
  process.stderr,
  `${__dirname}/../`,
  process.env,
  defaultConfigPath,
  (code) => {
    process.exit(code);
  },
  [
    new CliArgsHandlerSolidAuth(),
    new CliArgsHandlerAnnotateSources(),
    new CliArgsHandlerLinkFilters(),
  ],
).catch(error => process.stderr.write(`${error.message}/n`));
