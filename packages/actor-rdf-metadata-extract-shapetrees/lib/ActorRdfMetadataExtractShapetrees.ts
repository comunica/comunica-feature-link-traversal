import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import { QueryEngineBase } from '@comunica/actor-init-query';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { MediatorHttp } from '@comunica/bus-http';
import type { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from '@comunica/bus-rdf-metadata-extract';
import { ActorRdfMetadataExtract } from '@comunica/bus-rdf-metadata-extract';
import { KeysInitQuery, KeysQueryOperation } from '@comunica/context-entries';
import type { IActorArgs, IActorTest, TestResult } from '@comunica/core';
import { ActionContext, failTest, passTestVoid } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { parse } from 'http-link-header';
import { storeStream } from 'rdf-store-stream';
import { resolve } from 'relative-to-absolute-iri';
import type * as ShEx from 'shexj';
import { Algebra, Util as AlgebraUtil } from 'sparqlalgebrajs';
import { ShapeTree } from './ShapeTree';

// eslint-disable-next-line ts/no-require-imports,ts/no-var-requires
const shexParser = require('@shexjs/parser');
// eslint-disable-next-line ts/no-require-imports,ts/no-var-requires
const shexVisitor = require('@shexjs/visitor').Visitor;

/**
 * A comunica Shapetrees RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractShapetrees extends ActorRdfMetadataExtract {
  public static readonly IRI_SHAPETREE = 'http://www.w3.org/ns/shapetrees#ShapeTreeLocator';
  public static readonly IRI_SHAPETREE_OLD = 'http://shapetrees.org/#ShapeTree';

  public readonly mediatorDereferenceRdf: MediatorDereferenceRdf;
  public readonly mediatorHttp: MediatorHttp;
  public readonly queryEngine: QueryEngineBase;

  public constructor(args: IActorRdfMetadataExtractShapetreesArgs) {
    super(args);
    this.queryEngine = new QueryEngineBase(args.actorInitQuery);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<TestResult<IActorTest>> {
    if (!action.context.get(KeysInitQuery.query)) {
      return failTest(`Actor ${this.name} can only work in the context of a query.`);
    }
    if (!action.context.get(KeysQueryOperation.operation)) {
      return failTest(`Actor ${this.name} can only work in the context of a query operation.`);
    }
    return passTestVoid();
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const applicable: ShapeTree[] = [];
    const nonApplicable: ShapeTree[] = [];

    const shapeTreeLocatorUrl = this.discoverShapeTreeLocator(action.headers);
    if (shapeTreeLocatorUrl) {
      const shapeTreeLocators = await this.fetchShapeTreesLocatorShapeTrees(shapeTreeLocatorUrl, action.context);
      for (const shapeTreeLocator of shapeTreeLocators) {
        const shapeTrees = await this.dereferenceShapeTrees(shapeTreeLocator, action.url, action.context);
        for (const shapeTree of shapeTrees) {
          if (this.shapeTreeMatchesQuery(
            shapeTree,
            action.context.get(KeysInitQuery.query)!,
            <Algebra.Pattern> action.context.get(KeysQueryOperation.operation)!,
          )) {
            applicable.push(shapeTree);
          } else {
            nonApplicable.push(shapeTree);
          }
        }
      }
    }

    return {
      metadata: {
        shapetrees: {
          applicable,
          nonApplicable,
        },
      },
    };
  }

  /**
   * Extracts the shape tree locator URL from the headers
   * @param headers A headers record object
   */
  public discoverShapeTreeLocator(headers?: Headers): string | undefined {
    if (headers) {
      const linkHeader = headers.get('link');
      if (linkHeader) {
        let links;
        try {
          links = parse(linkHeader);
        } catch {
          return undefined;
        }
        // TODO: remove old rel type
        const shapeTree = links.get('rel', ActorRdfMetadataExtractShapetrees.IRI_SHAPETREE)[0] ||
          links.get('rel', ActorRdfMetadataExtractShapetrees.IRI_SHAPETREE_OLD)[0];
        if (shapeTree) {
          return shapeTree.uri;
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
   * @param baseUrl The base URL for URI templates.
   * @param context An action context.
   */
  public async dereferenceShapeTrees(
    shapeTreeReference: string,
    baseUrl: string,
    context: IActionContext,
  ): Promise<ShapeTree[]> {
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
      .map(async(bindings) => {
        let shapeIri = bindings.get('shape')!.value;

        // TODO: workaround for incorrect prefix use on https://shapetrees.pub/ts/medical-record/shapetree
        if (shapeIri === 'medshape:MedicalRecordShape') {
          shapeIri = 'http://shapes.pub/ns/medical-record/shex#MedicalRecordShape';
        }

        const shapeExpression = await this.dereferenceShape(shapeIri, context);

        // TODO: what is the correct base URL for relative URI templates?
        const uriTemplate = resolve(bindings.get('uriTemplate')!.value, baseUrl);

        return new ShapeTree(
          bindings.get('shapeTree')!.value,
          shapeExpression,
          uriTemplate,
        );
      }));
  }

  /**
   * Dereference a shape
   * @param shapeIri The URL of a shape definition.
   * @param _context An action context.
   */
  public async dereferenceShape(shapeIri: string, _context: IActionContext): Promise<ShEx.Shape> {
    // Fetch the shape
    const response = await this.mediatorHttp.mediate({
      input: shapeIri,
      // TODO: pass dummy context because servers may reject anything with DPoP auth
      context: new ActionContext(),
    });
    let data = await response.text();

    // TODO: temp workaround because the test dataset uses the wrong BASE
    data = data.replace(
      'PREFIX med: <http://shapes.pub/ns/medical-record/terms#>',
      'PREFIX med: <https://shapes.pub/ns/medical-record/terms#MedicalRecord>',
    );

    // Parse as ShEx shape
    const parser = shexParser.construct(shapeIri);
    const schema: ShEx.Schema = parser.parse(data);
    if (schema.shapes) {
      for (const shapeDeclaration of schema.shapes) {
        const shape = <ShEx.Shape> shapeDeclaration.shapeExpr;

        // TODO: workaround for https://github.com/shexjs/shex.js/issues/93
        if (shapeDeclaration.id === 'https://shapes.pub/ns/medical-record/MedicalRecordShape') {
          shapeDeclaration.id = 'http://shapes.pub/ns/medical-record/shex#MedicalRecordShape';
        }

        if (shapeDeclaration.id === shapeIri) {
          return shape;
        }
      }
    }

    throw new Error(`Could not find a shape at ${shapeIri}`);
  }

  /**
   * Check if the given shape tree matches with the current pattern in the global query.
   * @param shapeTree A shape tree to match with the query and pattern.
   * @param query The original query that is being executed.
   * @param pattern The current pattern that is being evaluated and traversed in.
   */
  public shapeTreeMatchesQuery(
    shapeTree: ShapeTree,
    query: Algebra.Operation,
    pattern: Algebra.Pattern,
  ): boolean {
    // Collect all predicates in the shape
    // TODO: improve shape-query matching, by e.g. also matching rdf:type
    const visitor = shexVisitor();
    const shapePredicates: string[] = [];
    visitor.visitTripleConstraint = (tripleConstraint: ShEx.TripleConstraint): void => {
      shapePredicates.push(tripleConstraint.predicate);
    };
    visitor.visitShape(shapeTree.shape);

    // Collect all subjects in the original query that match with any of the predicates
    // TODO: we can probably re-organize some things to achieve better performance
    const subjects: RDF.Term[] = [];
    AlgebraUtil.recurseOperation(query, {
      [Algebra.types.PATTERN](queryPattern) {
        if (shapePredicates.includes(queryPattern.predicate.value)) {
          subjects.push(queryPattern.subject);
        }
        return false;
      },
    });

    // Check if the current pattern has any of the allowed subjects.
    return subjects.some(subject => subject.equals(pattern.subject));
  }
}

export interface IActorRdfMetadataExtractShapetreesArgs
  extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
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
