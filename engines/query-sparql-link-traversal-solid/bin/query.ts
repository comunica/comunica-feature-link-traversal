#!/usr/bin/env node
import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { CliArgsHandlerSolidAuth } from '@comunica/query-sparql-solid';
import { runArgsInProcessStatic } from '@comunica/runner-cli';
import { CliArgsHandlerAnnotateSources } from '../lib/CliArgsHandlerAnnotateSources';

const cliArgsHandlerSolidAuth = new CliArgsHandlerSolidAuth();
runArgsInProcessStatic(require('../engine-default.js'), {
  context: new ActionContext({
    [KeysInitQuery.cliArgsHandlers.name]: [
      cliArgsHandlerSolidAuth,
      new CliArgsHandlerAnnotateSources(),
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
