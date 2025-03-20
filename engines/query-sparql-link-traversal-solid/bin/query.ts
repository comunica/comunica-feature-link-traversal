#!/usr/bin/env node
import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { CliArgsHandlerSolidAuth } from '@comunica/query-sparql-solid';
import { runArgsInProcessStatic } from '@comunica/runner-cli';
import { CliArgsHandlerAnnotateSources } from '../lib/CliArgsHandlerAnnotateSources';
import { CliArgsHandlerLinkFilters } from '../lib/CliArgsHandlerLinkFilters';

const cliArgsHandlerSolidAuth = new CliArgsHandlerSolidAuth();
// eslint-disable-next-line import/extensions,ts/no-require-imports,ts/no-var-requires
runArgsInProcessStatic(require('../engine-default.js')(), {
  context: new ActionContext({
    [KeysInitQuery.cliArgsHandlers.name]: [
      cliArgsHandlerSolidAuth,
      new CliArgsHandlerAnnotateSources(),
      new CliArgsHandlerLinkFilters(),
    ],
  }),
  onDone() {
    if (cliArgsHandlerSolidAuth.session) {
      cliArgsHandlerSolidAuth.session.logout()
        // eslint-disable-next-line no-console
        .catch(error => console.log(error));
    }
  },
});
