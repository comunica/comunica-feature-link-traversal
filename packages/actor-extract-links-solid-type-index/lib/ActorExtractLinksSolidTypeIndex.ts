import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import { QueryEngineBase } from '@comunica/actor-init-query';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { storeStream } from 'rdf-store-stream';

/**
 * A comunica Solid Type Index Extract Links Actor.
 */
export class ActorExtractLinksSolidTypeIndex extends ActorExtractLinks {
  private readonly typeIndexPredicates: string[];
  public readonly mediatorDereferenceRdf: MediatorDereferenceRdf;
  public readonly queryEngine: QueryEngineBase;

  public constructor(args: IActorExtractLinksSolidTypeIndexArgs) {
    super(args);
    this.queryEngine = new QueryEngineBase(args.actorInitQuery);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    // Determine type index links
    const typeIndexes = await new Promise<string[]>((resolve, reject) => {
      const typeIndexesInner: string[] = [];

      // Forward errors
      action.metadata.on('error', reject);

      // Invoke callback on each metadata quad
      action.metadata.on('data', (quad: RDF.Quad) => {
        if (this.typeIndexPredicates.includes(quad.predicate.value)) {
          typeIndexesInner.push(quad.object.value);
        }
      });

      // Resolve to discovered links
      action.metadata.on('end', () => {
        resolve(typeIndexesInner);
      });
    });

    // Follow type indexes and determine their links
    const links = (await Promise.all(typeIndexes
      .map(typeIndex => this.extractTypeIndexLinks(typeIndex, action.context))))
      .flat();

    return { links };
  }

  public async extractTypeIndexLinks(typeIndex: string, context: IActionContext): Promise<ILink[]> {
    // Parse the type index document
    const response = await this.mediatorDereferenceRdf.mediate({ url: typeIndex, context });
    const store = await storeStream(response.data);

    // Query the document to extract all type registrations
    const bindingsArray = await (await this.queryEngine
      .queryBindings(`
        PREFIX solid: <http://www.w3.org/ns/solid/terms#>
        SELECT ?class ?instance WHERE {
          _:registration a solid:TypeRegistration;
            solid:forClass ?class;
            solid:instance ?instance.
        }`, { sources: [ store ]})).toArray();

    return bindingsArray.map(bindings => ({
      url: bindings.get('instance')!.value,
      metadata: {
        class: bindings.get('class')!.value,
      },
    }));
  }
}

export interface IActorExtractLinksSolidTypeIndexArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * The type index predicate URLs that will be followed.
   * @default {http://www.w3.org/ns/solid/terms#publicTypeIndex}
   * @default {http://www.w3.org/ns/solid/terms#privateTypeIndex}
   */
  typeIndexPredicates: string[];
  /**
   * An init query actor that is used to query shapes.
   * @default {<urn:comunica:default:init/actors#query>}
   */
  actorInitQuery: ActorInitQueryBase;
  /**
   * The Dereference RDF mediator
   */
  mediatorDereferenceRdf: MediatorDereferenceRdf;
}
