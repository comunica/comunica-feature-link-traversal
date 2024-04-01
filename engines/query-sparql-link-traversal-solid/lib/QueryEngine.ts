import { QueryEngineBase } from '@comunica/actor-init-query';
import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import type { IQueryContextCommon, QueryAlgebraContext, QueryStringContext, SourceType } from '@comunica/types';

// eslint-disable-next-line import/extensions,ts/no-require-imports,ts/no-var-requires
const engineDefault = require('../engine-default.js');

/**
 * A Comunica SPARQL query engine.
 */
export class QueryEngine extends QueryEngineBase<
IQueryContextCommon,
Omit<QueryStringContext, 'sources'> & { sources?: SourceType[] },
Omit<QueryAlgebraContext, 'sources'> & { sources?: SourceType[] }
> {
  public constructor(engine: ActorInitQueryBase = engineDefault()) {
    super(engine);
  }
}
