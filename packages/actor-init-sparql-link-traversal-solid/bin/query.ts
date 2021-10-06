#!/usr/bin/env node
// Tslint:disable:no-var-requires
import { CliArgsHandlerSolidAuth } from '@comunica/actor-init-sparql-solid';
import { KeysInitSparql } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { runArgsInProcessStatic } from '@comunica/runner-cli';
const cliArgsHandlerSolidAuth = new CliArgsHandlerSolidAuth();
runArgsInProcessStatic(require('../engine-default.js'), {
  context: ActionContext({
    [KeysInitSparql.cliArgsHandlers]: [ cliArgsHandlerSolidAuth ],
  }),
  onDone() {
    if (cliArgsHandlerSolidAuth.session) {
      cliArgsHandlerSolidAuth.session.logout()
        // eslint-disable-next-line no-console
        .catch(error => console.log(error));
    }
  },
});
