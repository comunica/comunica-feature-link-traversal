#!/usr/bin/env node
import { CliArgsHandlerSolidAuth } from '@comunica/actor-init-sparql-solid';
import { KeysInitSparql } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { runArgsInProcess } from '@comunica/runner-cli';
const cliArgsHandlerSolidAuth = new CliArgsHandlerSolidAuth();
runArgsInProcess(`${__dirname}/../`, `${__dirname}/../config/config-default.json`, {
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
