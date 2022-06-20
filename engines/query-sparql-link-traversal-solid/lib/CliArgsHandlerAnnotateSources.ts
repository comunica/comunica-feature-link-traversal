import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import type { ICliArgsHandler } from '@comunica/types';
import type { Argv } from 'yargs';

export class CliArgsHandlerAnnotateSources implements ICliArgsHandler {
  public populateYargs(argumentsBuilder: Argv<any>): Argv<any> {
    return argumentsBuilder
      .options({
        annotateSources: {
          type: 'string',
          describe: 'Annotate data with their sources',
          choices: [
            'graph',
          ],
        },
      });
  }

  public async handleArgs(args: Record<string, any>, context: Record<string, any>): Promise<void> {
    if (args.annotateSources) {
      context[KeysRdfResolveHypermediaLinks.annotateSources.name] = args.annotateSources;
    }
  }
}
