#!/usr/bin/env node
import { HttpServiceSparqlEndpoint } from '@comunica/actor-init-query';
import { CliArgsHandlerSolidAuth } from '@comunica/query-sparql-solid';

const defaultConfigPath = `${__dirname}/../config/config-default.json`;

HttpServiceSparqlEndpoint.runArgsInProcess(
  process.argv.slice(2),
  process.stdout,
  process.stderr,
  `${__dirname}/../`,
  process.env,
  defaultConfigPath,
  code => {
    process.exit(code);
  },
  [ new CliArgsHandlerSolidAuth() ],
).catch(error => process.stderr.write(`${error.message}/n`));
