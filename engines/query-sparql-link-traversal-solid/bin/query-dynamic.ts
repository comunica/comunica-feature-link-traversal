#!/usr/bin/env node
import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { CliArgsHandlerSolidAuth } from '@comunica/query-sparql-solid';
import { runArgsInProcess } from '@comunica/runner-cli';
const cliArgsHandlerSolidAuth = new CliArgsHandlerSolidAuth();
runArgsInProcess(`${__dirname}/../`, `${__dirname}/../config/config-default.json`, {
  context: new ActionContext({
    [KeysInitQuery.cliArgsHandlers.name]: [ cliArgsHandlerSolidAuth ],
  }),
  onDone() {
    if (cliArgsHandlerSolidAuth.session) {
      cliArgsHandlerSolidAuth.session.logout()
        // eslint-disable-next-line no-console
        .catch(error => console.log(error));
    }
  },
});
