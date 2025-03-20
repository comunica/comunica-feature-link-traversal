import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import type { ICliArgsHandler } from '@comunica/types';
import type { Argv } from 'yargs';

export class CliArgsHandlerLinkFilters implements ICliArgsHandler {
  public populateYargs(argumentsBuilder: Argv<any>): Argv<any> {
    return argumentsBuilder
      .options({
        voidLinkFilters: {
          type: 'boolean',
          describe: 'Generate link filters from VoID descriptions',
        },
      });
  }

  public async handleArgs(args: Record<string, any>, context: Record<string, any>): Promise<void> {
    if (args.voidLinkFilters) {
      context[KeysRdfResolveHypermediaLinks.linkFilters.name] = [];
    }
  }
}
