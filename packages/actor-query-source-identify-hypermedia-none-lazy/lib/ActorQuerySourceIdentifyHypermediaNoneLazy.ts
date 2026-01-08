import { ActorQuerySourceIdentifyHypermedia } from '@comunica/bus-query-source-identify-hypermedia';
import type {
  IActionQuerySourceIdentifyHypermedia,
  IActorQuerySourceIdentifyHypermediaOutput,
  IActorQuerySourceIdentifyHypermediaArgs,
  IActorQuerySourceIdentifyHypermediaTest,

  MediatorQuerySourceIdentifyHypermedia,
} from '@comunica/bus-query-source-identify-hypermedia';
import { KeysInitQuery } from '@comunica/context-entries';
import type { TestResult } from '@comunica/core';
import { passTest } from '@comunica/core';
import type { ComunicaDataFactory } from '@comunica/types';
import { QuerySourceFileLazy } from './QuerySourceFileLazy';

/**
 * A comunica None Lazy Query Source Identify Hypermedia Actor.
 */
export class ActorQuerySourceIdentifyHypermediaNoneLazy extends ActorQuerySourceIdentifyHypermedia {
  public readonly mediatorQuerySourceIdentifyHypermedia: MediatorQuerySourceIdentifyHypermedia;

  public constructor(args: IActorQuerySourceIdentifyHypermediaNoneLazyArgs) {
    super(args, 'file');
    this.mediatorQuerySourceIdentifyHypermedia = args.mediatorQuerySourceIdentifyHypermedia;
  }

  public async testMetadata(
    _action: IActionQuerySourceIdentifyHypermedia,
  ): Promise<TestResult<IActorQuerySourceIdentifyHypermediaTest>> {
    return passTest({ filterFactor: 0 });
  }

  public async run(action: IActionQuerySourceIdentifyHypermedia): Promise<IActorQuerySourceIdentifyHypermediaOutput> {
    this.logInfo(action.context, `Identified as lazy file source: ${action.url}`);
    const dataFactory: ComunicaDataFactory = action.context.getSafe(KeysInitQuery.dataFactory);
    const source = new QuerySourceFileLazy(
      action.quads,
      dataFactory,
      action.url,
      async quads => (await this.mediatorQuerySourceIdentifyHypermedia.mediate({
        quads,
        context: action.context,
        url: action.url,
        metadata: action.metadata,
      })).source,
    );
    return { source };
  }
}

export interface IActorQuerySourceIdentifyHypermediaNoneLazyArgs extends IActorQuerySourceIdentifyHypermediaArgs {
  /**
   * A mediator for identifying hypermedia query sources.
   */
  mediatorQuerySourceIdentifyHypermedia: MediatorQuerySourceIdentifyHypermedia;
}
