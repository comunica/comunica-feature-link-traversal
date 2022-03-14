import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import { QueryEngineBase } from '@comunica/actor-init-query';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { MediatorHttp } from '@comunica/bus-http';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { ActionContext } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import * as parseLink from 'parse-link-header';
import { storeStream } from 'rdf-store-stream';
import type * as ShEx from 'shexj';
import { ShapeTree } from './ShapeTree';

const shexParser = require('@shexjs/parser');

/**
 * A comunica Traverse Shapetrees RDF Metadata Extract Actor.
 */
export class ActorExtractLinksShapetrees extends ActorExtractLinks {
  public static readonly IRI_SHAPETREE = 'http://www.w3.org/ns/shapetrees#ShapeTreeLocator';
  public static readonly IRI_SHAPETREE_OLD = 'http://shapetrees.org/#ShapeTree';

  public readonly mediatorDereferenceRdf: MediatorDereferenceRdf;
  public readonly mediatorHttp: MediatorHttp;
  public readonly queryEngine: QueryEngineBase;

  public constructor(args: IActorExtractLinksShapetreesArgs) {
    super(args);
    this.queryEngine = new QueryEngineBase(args.actorInitQuery);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  /**
   * Extracts the shape tree locator URL from the headers
   * @param headers A headers record object
   */
  public discoverShapeTreeLocator(headers?: Headers): string | undefined {
    if (headers) {
      const links = parseLink(headers.get('link'));
      if (links) {
        // TODO: remove old rel type
        const shapeTree = links[ActorExtractLinksShapetrees.IRI_SHAPETREE] ||
          links[ActorExtractLinksShapetrees.IRI_SHAPETREE_OLD];
        if (shapeTree) {
          return shapeTree.url;
        }
      }
    }
  }

  /**
   * Fetch all shapetrees identified by the given shape tree locator.
   * @param shapeTreeLocatorUrl A shape tree locator URL.
   * @param context An action context.
   */
  public async fetchShapeTreesLocatorShapeTrees(
    shapeTreeLocatorUrl: string,
    context: IActionContext,
  ): Promise<string[]> {
    // Parse the Shape Tree locator document
    const response = await this.mediatorDereferenceRdf.mediate({ url: shapeTreeLocatorUrl, context });
    const store = await storeStream(response.data);

    // Query the document to extract all Shape Trees
    // TODO: is this query correct? Data doesn't correspond to spec.
    const bindingsArray = await (await this.queryEngine
      .queryBindings(`
        PREFIX st: <http://www.w3.org/ns/shapetree#>
        SELECT ?shapeTree WHERE {
          <${shapeTreeLocatorUrl}> st:hasShapeTreeLocator/st:hasShapeTree ?shapeTree.
        }`, { sources: [ store ]})).toArray();

    return bindingsArray
      .map(bindings => bindings.get('shapeTree')!.value);
  }

  /**
   * Dereference the given shape tree.
   * @param shapeTreeReference A shape tree URL.
   * @param context An action context.
   */
  public async dereferenceShapeTrees(shapeTreeReference: string, context: IActionContext): Promise<ShapeTree[]> {
    // Parse the Shape Tree document
    const response = await this.mediatorDereferenceRdf.mediate({
      url: shapeTreeReference,
      // TODO: this is just to cope with the problem that demo servers expose use text/plain
      mediaType: 'text/turtle',
      // TODO: pass dummy context because the demo servers reject anything with DPoP auth
      context: new ActionContext(),
    });
    const store = await storeStream(response.data);

    // Query the document to extract all Shapes
    const bindingsArray = await (await this.queryEngine
      .queryBindings(`
        PREFIX st: <http://www.w3.org/ns/shapetree#>
        SELECT ?shapeTree ?shape ?uriTemplate WHERE {
          <${shapeTreeReference}> st:contains ?shapeTree.
          ?shapeTree st:validatedBy ?shape;
                     st:matchesUriTemplate ?uriTemplate.
        }`, { sources: [ store ]})).toArray();

    return await Promise.all(bindingsArray
      .map(async bindings => {
        let shapeIri = bindings.get('shape')!.value;

        // TODO: workaround for incorrect prefix use on https://shapetrees.pub/ts/medical-record/shapetree
        if (shapeIri === 'medshape:MedicalRecordShape') {
          shapeIri = 'http://shapes.pub/ns/medical-record/shex#MedicalRecordShape';
        }

        const shapeExpression = await this.dereferenceShape(shapeIri, context);

        return new ShapeTree(
          bindings.get('shapeTree')!.value,
          shapeExpression,
          bindings.get('uriTemplate')!.value,
        );
      }));
  }

  /**
   * Dereference a shape
   * @param shapeIri The URL of a shape definition.
   * @param context An action context.
   */
  public async dereferenceShape(shapeIri: string, context: IActionContext): Promise<ShEx.Shape> {
    // Fetch the shape
    const response = await this.mediatorHttp.mediate({ input: shapeIri, context });
    const data = await response.text();

    // Parse as ShEx shape
    const parser = shexParser.construct(shapeIri);
    const schema: ShEx.Schema = parser.parse(data);
    if (schema.shapes) {
      for (const shapeExpression of schema.shapes) {
        const shape = <ShEx.Shape> shapeExpression;

        // TODO: workaround for https://github.com/shexjs/shex.js/issues/93
        if (shape.id === 'https://shapes.pub/ns/medical-record/MedicalRecordShape') {
          shape.id = 'http://shapes.pub/ns/medical-record/shex#MedicalRecordShape';
        }

        if (shape.id === shapeIri) {
          return shape;
        }
      }
    }

    throw new Error(`Could not find a shape at ${shapeIri}`);
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    const links: ILink[] = [];

    const shapeTreeLocatorUrl = this.discoverShapeTreeLocator(action.headers);
    if (shapeTreeLocatorUrl) {
      const shapeTreeLocators = await this.fetchShapeTreesLocatorShapeTrees(shapeTreeLocatorUrl, action.context);
      for (const shapeTreeLocator of shapeTreeLocators) {
        const shapeTrees = await this.dereferenceShapeTrees(shapeTreeLocator, action.context);
        // TODO: push the matching shapetrees
        // links.push({ url: shapeTree }); // TODO
      }
    }

    return { links };
  }
}

export interface IActorExtractLinksShapetreesArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * An init query actor that is used to query shapes.
   * @default {<urn:comunica:default:init/actors#query>}
   */
  actorInitQuery: ActorInitQueryBase;
  /**
   * The Dereference RDF mediator
   */
  mediatorDereferenceRdf: MediatorDereferenceRdf;
  /**
   * The HTTP mediator
   */
  mediatorHttp: MediatorHttp;
}
