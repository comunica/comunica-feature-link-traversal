import type { IActionRdfDereference, IActorRdfDereferenceOutput } from '@comunica/bus-rdf-dereference';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorTest, Mediator, Actor, ActionContext } from '@comunica/core';
import type { IQueryEngine } from '@comunica/types';
import * as parseLink from 'parse-link-header';
import { storeStream } from 'rdf-store-stream';
import { IQueryResultBindings } from '@comunica/actor-init-sparql';
import type { IActionHttp, IActorHttpOutput, ActorHttp } from '@comunica/bus-http';
import { ShapeTree } from './ShapeTree';
import type * as ShEx from 'shexj';

const shexParser = require('@shexjs/parser');

/**
 * A comunica Traverse Shapetrees RDF Metadata Extract Actor.
 * Based on https://shapetrees.org/TR/specification/#discover
 */
export class ActorRdfMetadataExtractTraverseShapetrees extends ActorRdfMetadataExtract {
  public static readonly IRI_SHAPETREE = 'http://www.w3.org/ns/shapetrees#ShapeTreeLocator';
  public static readonly IRI_SHAPETREE_OLD = 'http://shapetrees.org/#ShapeTree';

  public readonly mediatorRdfDereference: Mediator<Actor<IActionRdfDereference, IActorTest,
  IActorRdfDereferenceOutput>, IActionRdfDereference, IActorTest, IActorRdfDereferenceOutput>;

  public readonly mediatorHttp: Mediator<ActorHttp, IActionHttp, IActorTest, IActorHttpOutput>;

  public readonly queryEngine: IQueryEngine;

  public constructor(args: IActorRdfMetadataExtractTraverseShapetreesArgs) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  /**
   * Extracts the shape tree locator URL from the headers
   * @param headers A headers record object
   */
  public discoverShapeTreeLocator(headers?: Record<string, string>): string | undefined {
    if (headers && headers.link) {
      const links = parseLink(headers.link);
      if (links) {
        // TODO: remove old rel type
        const shapeTree = links[ActorRdfMetadataExtractTraverseShapetrees.IRI_SHAPETREE] ||
          links[ActorRdfMetadataExtractTraverseShapetrees.IRI_SHAPETREE_OLD];
        if (shapeTree) {
          return shapeTree.url;
        }
      }
    }
  }

  // TODO: test me next
  public async fetchShapeTreesLocators(shapeTreeLocatorUrl: string, context?: ActionContext): Promise<string[]> {
    // Parse the Shape Tree locator document
    const response = await this.mediatorRdfDereference.mediate({ url: shapeTreeLocatorUrl, context });
    const store = await storeStream(response.quads);

    // Query the document to extract all Shape Trees
    // TODO: is this query correct? Data doesn't correspond to spec. Ask Justin
    const result = <IQueryResultBindings> await this.queryEngine
      .query(`
        PREFIX st: <http://www.w3.org/ns/shapetree#>
        SELECT ?shapeTree WHERE {
          <${shapeTreeLocatorUrl}> st:hasShapeTreeLocator/st:hasShapeTree ?shapeTree.
        }`, { sources: [ store ]});

    return (await result.bindings())
      .map(bindings => bindings.get('?shapeTree').value);
  }

  public async dereferenceShapeTrees(shapeTreeReference: string, context?: ActionContext): Promise<ShapeTree[]> {
    // Parse the Shape Tree document
    const response = await this.mediatorRdfDereference.mediate({
      url: shapeTreeReference,
      mediaType: 'text/turtle', // TODO: servers expose use text/plain, tell Justin
      /**, context**/ // TODO: servers reject anything with DPoP auth, tell Justin
    });
    const store = await storeStream(response.quads);

    // Query the document to extract all Shapes
    const result = <IQueryResultBindings> await this.queryEngine
      .query(`
        PREFIX st: <http://www.w3.org/ns/shapetree#>
        SELECT ?shapeTree ?shape ?uriTemplate WHERE {
          <${shapeTreeReference}> st:contains ?shapeTree.
          ?shapeTree st:validatedBy ?shape;
                     st:matchesUriTemplate ?uriTemplate.
        }`, { sources: [ store ]});

    return await Promise.all((await result.bindings())
      .map(async bindings => {
        let shapeIri = bindings.get('?shape').value;

        // TODO: workaround for incorrect prefix use on https://shapetrees.pub/ts/medical-record/shapetree, tell Justin
        if (shapeIri === 'medshape:MedicalRecordShape') {
          shapeIri = 'http://shapes.pub/ns/medical-record/shex#MedicalRecordShape';
        }

        const shapeExpression = await this.dereferenceShape(shapeIri);

        return new ShapeTree(
          bindings.get('?shapeTree').value,
          shapeExpression,
          bindings.get('?uriTemplate').value,
        );
      }));
  }

  public async dereferenceShape(shapeIri: string): Promise<ShEx.Shape> {
    // Fetch the shape
    const response = await this.mediatorHttp.mediate({ input: shapeIri });
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

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    // Console.log(action.headers); // TODO
    const traverse: ILink[] = [];

    const shapeTreeLocatorUrl = this.discoverShapeTreeLocator(action.headers);
    if (shapeTreeLocatorUrl) {
      const shapeTreeLocators = await this.fetchShapeTreesLocators(shapeTreeLocatorUrl, action.context);
      //traverse.push({ url: shapeTreeLink }); // TODO
      //console.log(shapeTreeLocators); // TODO
      for (const shapeTreeLocator of shapeTreeLocators) {
        const shapeTrees = await this.dereferenceShapeTrees(shapeTreeLocator, action.context);
        console.log(shapeTrees); // TODO
        //traverse.push({ url: shapeTree }); // TODO
      }
    }

    return { metadata: { traverse }};
  }
}

export interface IActorRdfMetadataExtractTraverseShapetreesArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
  mediatorRdfDereference: Mediator<Actor<IActionRdfDereference, IActorTest,
  IActorRdfDereferenceOutput>, IActionRdfDereference, IActorTest, IActorRdfDereferenceOutput>;
  mediatorHttp: Mediator<ActorHttp, IActionHttp, IActorTest, IActorHttpOutput>;
  queryEngine: IQueryEngine;
}
