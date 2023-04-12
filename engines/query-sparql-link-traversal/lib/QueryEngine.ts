import { QueryEngineBase } from '@comunica/actor-init-query';
import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import type { IQueryContextCommon, QueryAlgebraContext, QueryStringContext, SourceType } from '@comunica/types';
const engineDefault = require('../engine-default.js');

/**
 * A Comunica SPARQL query engine.
 */
export class QueryEngine extends QueryEngineBase<
IQueryContextCommon,
Omit<QueryStringContext, 'sources'> & { sources?: SourceType[] },
Omit<QueryAlgebraContext, 'sources'> & { sources?: SourceType[] }> {
  public constructor(engine: ActorInitQueryBase = engineDefault) {
    super(engine);
  }
}
