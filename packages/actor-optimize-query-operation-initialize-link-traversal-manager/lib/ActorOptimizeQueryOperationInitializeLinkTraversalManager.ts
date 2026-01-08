import type { MediatorFactoryAggregatedStore } from '@comunica/bus-factory-aggregated-store';
import type { MediatorMergeBindingsContext } from '@comunica/bus-merge-bindings-context';
import type {
  IActionOptimizeQueryOperation,
  IActorOptimizeQueryOperationOutput,
  IActorOptimizeQueryOperationArgs,
} from '@comunica/bus-optimize-query-operation';
import { ActorOptimizeQueryOperation } from '@comunica/bus-optimize-query-operation';
import type { MediatorQuerySourceDereferenceLink } from '@comunica/bus-query-source-dereference-link';
import type { MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { MediatorRdfResolveHypermediaLinksQueue } from '@comunica/bus-rdf-resolve-hypermedia-links-queue';
import { KeysInitQuery, KeysQuerySourceIdentify } from '@comunica/context-entries';
import { KeysQuerySourceIdentifyLinkTraversal } from '@comunica/context-entries-link-traversal';
import type { TestResult, IActorTest } from '@comunica/core';
import { passTestVoid, ActionContext } from '@comunica/core';
import type { IActionContext, ILink, QuerySourceUnidentified } from '@comunica/types';
import { BindingsFactory } from '@comunica/utils-bindings-factory';
import { LinkTraversalManagerMediated } from './LinkTraversalManagerMediated';

/**
 * A comunica Initialize Link Traversal Manager Optimize Query Operation Actor.
 */
export class ActorOptimizeQueryOperationInitializeLinkTraversalManager extends ActorOptimizeQueryOperation {
  public readonly linkParallelization: number;
  public readonly linkParallelizationLimit: number;
  public readonly mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
  public readonly mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
  public readonly mediatorQuerySourceDereferenceLink: MediatorQuerySourceDereferenceLink;
  public readonly mediatorMergeBindingsContext: MediatorMergeBindingsContext;
  public readonly mediatorFactoryAggregatedStore: MediatorFactoryAggregatedStore;

  public constructor(args: IActorOptimizeQueryOperationInitializeLinkTraversalManagerArgs) {
    super(args);
    this.linkParallelization = args.linkParallelization;
    this.linkParallelizationLimit = args.linkParallelizationLimit;
    this.mediatorRdfResolveHypermediaLinks = args.mediatorRdfResolveHypermediaLinks;
    this.mediatorRdfResolveHypermediaLinksQueue = args.mediatorRdfResolveHypermediaLinksQueue;
    this.mediatorQuerySourceDereferenceLink = args.mediatorQuerySourceDereferenceLink;
    this.mediatorMergeBindingsContext = args.mediatorMergeBindingsContext;
    this.mediatorFactoryAggregatedStore = args.mediatorFactoryAggregatedStore;
  }

  public async test(_action: IActionOptimizeQueryOperation): Promise<TestResult<IActorTest>> {
    return passTestVoid();
  }

  public async run(action: IActionOptimizeQueryOperation): Promise<IActorOptimizeQueryOperationOutput> {
    let context = action.context;

    // Collect all link traversal seeds
    const querySources: QuerySourceUnidentified[] = [];
    const traversalSeedLinks: ILink[] = [];
    const traversalContexts: IActionContext[] = [];
    if (context.has(KeysInitQuery.querySourcesUnidentified)) {
      const querySourcesUnidentified: QuerySourceUnidentified[] = action.context
        .getSafe(KeysInitQuery.querySourcesUnidentified);
      for (const querySource of querySourcesUnidentified) {
        const traverseAll = context.get(KeysQuerySourceIdentify.traverse);
        if (traverseAll && typeof querySource === 'string') {
          traversalSeedLinks.push({ url: querySource });
        } else if (!(typeof querySource === 'string') && !('match' in querySource) &&
          (traverseAll ?? ActionContext.ensureActionContext(querySource.context)
            .get(KeysQuerySourceIdentify.traverse)) &&
          typeof querySource.value === 'string') {
          traversalSeedLinks.push({
            url: querySource.value,
            forceSourceType: querySource.type,
            context: ActionContext.ensureActionContext(querySource.context),
          });
          if (querySource.context) {
            traversalContexts.push(ActionContext.ensureActionContext(querySource.context));
          }
        } else {
          querySources.push(querySource);
        }
      }
    }

    // Initialize link traversal manager if we have link traversal links
    if (traversalSeedLinks.length > 0) {
      let linkTraversalContext: IActionContext = new ActionContext().merge(...traversalContexts);

      // Initialize link traversal manager
      const mergedContext = context.merge(linkTraversalContext);
      const dataFactory = mergedContext.getSafe(KeysInitQuery.dataFactory);
      const linkTraversalManager = new LinkTraversalManagerMediated(
        this.linkParallelization,
        this.linkParallelizationLimit,
        traversalSeedLinks,
        await this.mediatorRdfResolveHypermediaLinksQueue
          .mediate({ context: mergedContext })
          .then(result => result.linkQueue),
        linkTraversalContext
          .get(KeysQuerySourceIdentifyLinkTraversal.linkTraversalAggregatedStore) ?? await this
          .mediatorFactoryAggregatedStore.mediate({ context: mergedContext })
          .then(result => result.aggregatedStore),
        mergedContext,
        dataFactory,
        await BindingsFactory.create(this.mediatorMergeBindingsContext, action.context, dataFactory),
        this.mediatorRdfResolveHypermediaLinks,
        this.mediatorQuerySourceDereferenceLink,
      );
      linkTraversalContext = linkTraversalContext
        .setDefault(KeysQuerySourceIdentifyLinkTraversal.linkTraversalManager, linkTraversalManager);

      // Add grouped query source
      querySources.push({
        type: 'traverse',
        value: traversalSeedLinks,
        context: linkTraversalContext,
      });
      context = context.set(KeysInitQuery.querySourcesUnidentified, querySources);
    }

    return { context, operation: action.operation };
  }
}

export interface IActorOptimizeQueryOperationInitializeLinkTraversalManagerArgs
  extends IActorOptimizeQueryOperationArgs {
  /**
   * The maximum number of links that can be followed in parallel.
   * @default {64}
   */
  linkParallelization: number;
  /**
   * The maximum number of links that can be followed in parallel for queries with a LIMIT clause.
   * @default {2}
   */
  linkParallelizationLimit: number;
  /**
   * The hypermedia links resolve mediator
   */
  mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
  /**
   * The hypermedia links queue resolve mediator
   */
  mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
  /**
   * The mediator for resolving hypermedia sources
   */
  mediatorQuerySourceDereferenceLink: MediatorQuerySourceDereferenceLink;
  /**
   * A mediator for creating binding context merge handlers
   */
  mediatorMergeBindingsContext: MediatorMergeBindingsContext;
  /**
   * A mediator for creating aggregated stores
   */
  mediatorFactoryAggregatedStore: MediatorFactoryAggregatedStore;
}
