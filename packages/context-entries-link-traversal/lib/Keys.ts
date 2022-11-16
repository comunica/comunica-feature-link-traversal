import { ActionContextKey } from '@comunica/core';
import type { AnnotateSourcesType } from '@comunica/types-link-traversal';

/**
 * When adding entries to this file, also add a shortcut for them in the contextKeyShortcuts TSDoc comment in
 * ActorIniQueryBase in @comunica/actor-init-query if it makes sense to use this entry externally.
 * Also, add this shortcut to IQueryContextCommon in @comunica/types.
 */

export const KeysRdfResolveHypermediaLinks = {
  /**
   * A flag for indicating if traversal should be enabled. Defaults to true.
   */
  traverse: new ActionContextKey<boolean>('@comunica/actor-rdf-resolve-hypermedia-links-traverse:traverse'),
  /**
   * Context entry for indicating the type of source annotation.
   */
  annotateSources: new ActionContextKey<AnnotateSourcesType>(
    '@comunica/bus-rdf-resolve-hypermedia-links:annotateSources',
  ),
};
