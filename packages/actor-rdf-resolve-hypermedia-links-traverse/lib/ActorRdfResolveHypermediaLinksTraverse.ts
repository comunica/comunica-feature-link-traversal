import type {
  IActionRdfResolveHypermediaLinks,
  IActorRdfResolveHypermediaLinksOutput,
  ILink,
} from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { KeysHttpProxy, KeysQuerySourceIdentify } from '@comunica/context-entries';
import type { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Traverse RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTraverse extends ActorRdfResolveHypermediaLinks {
  private readonly upgradeInsecureRequests: boolean | undefined;

  public constructor(
    args: IActorRdfResolveHypermediaLinksTraverse,
  ) {
    super(args);
    // Overrides recommended settings
    this.upgradeInsecureRequests = args.upgradeInsecureRequests;
  }

  public async test(action: IActionRdfResolveHypermediaLinks): Promise<IActorTest> {
    if (!action.metadata.traverse) {
      throw new Error(`Actor ${this.name} requires a 'traverse' metadata entry.`);
    }
    if (action.context.has(KeysQuerySourceIdentify.traverse) &&
      !action.context.get(KeysQuerySourceIdentify.traverse)) {
      throw new Error(`Link traversal has been disabled via the context.`);
    }
    return true;
  }

  public async run(action: IActionRdfResolveHypermediaLinks): Promise<IActorRdfResolveHypermediaLinksOutput> {
    return {
      links: action.metadata.traverse.map((fileLink: ILink) => {
        const hashPosition = fileLink.url.indexOf('#');
        if (hashPosition >= 0) {
          fileLink.url = fileLink.url.slice(0, hashPosition);
        }
        // Prioritize the upgradeInsecureRequests option setting
        // default to true when using the browser in https and when
        // there is no httpProxyHandler.
        if (fileLink.url.startsWith('http:') &&
          (this.upgradeInsecureRequests ??
            (globalThis.window &&
              globalThis.window.location.protocol === 'https:' &&
              !action.context.get(KeysHttpProxy.httpProxyHandler)))) {
          // Avoid mixed content when using https
          fileLink.url = fileLink.url.replace('http:', 'https:');
        }
        return fileLink;
      }),
    };
  }
}

export interface IActorRdfResolveHypermediaLinksTraverse extends IActorArgs<
IActionRdfResolveHypermediaLinks,
IActorTest,
IActorRdfResolveHypermediaLinksOutput
> {
  /**
   * Upgrade insecure http requests to https when performing
   * link traversal. This setting will override the recommended
   * settings in a secure browser context.
   */
  upgradeInsecureRequests?: boolean;
}
