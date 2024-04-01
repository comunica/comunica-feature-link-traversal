import type { ActorInitQuery } from '@comunica/actor-init-query';
import { BindingsFactory } from '@comunica/bindings-factory';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { MediatorHttp } from '@comunica/bus-http';
import { KeysInitQuery, KeysQueryOperation } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import type * as ShEx from 'shexj';
import { Factory as AlgebraFactory } from 'sparqlalgebrajs';
import { ActorRdfMetadataExtractShapetrees } from '../lib/ActorRdfMetadataExtractShapetrees';
import { ShapeTree } from '../lib/ShapeTree';

const DF = new DataFactory();
const BF = new BindingsFactory();
const AF = new AlgebraFactory();
const shexParser = require('@shexjs/parser');

describe('ActorRdfMetadataExtractShapetrees', () => {
  let bus: any;
  let context: ActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    context = new ActionContext({
      [KeysInitQuery.query.name]: AF.createBgp([
        AF.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:pmatch'),
          DF.namedNode('ex:class1'),
        ),
        AF.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
      ]),
      [KeysQueryOperation.operation.name]: AF.createPattern(
        DF.variable('s'),
        DF.namedNode('ex:p'),
        DF.namedNode('ex:bla'),
      ),
    });
  });

  describe('An ActorRdfMetadataExtractShapetrees instance', () => {
    let actor: ActorRdfMetadataExtractShapetrees;
    let mediatorDereferenceRdf: MediatorDereferenceRdf;
    let mediatorHttp: MediatorHttp;
    let actorInitQuery: ActorInitQuery;

    beforeEach(() => {
      mediatorDereferenceRdf = <any> {
        mediate: jest.fn(async() => ({
          data: new ArrayIterator([], { autoStart: false }),
        })),
      };
      mediatorHttp = <any> {
        mediate: jest.fn(async() => ({
          text: async() => `
<ex:s1> {
    <http://xmlns.com/foaf/0.1/givenName>  <http://www.w3.org/2001/XMLSchema#string>+,
}
<ex:s2> {
    <http://xmlns.com/foaf/0.1/familyName> <http://www.w3.org/2001/XMLSchema#string>,
}
`,
        })),
      };
      actorInitQuery = <any> {};
      actor = new ActorRdfMetadataExtractShapetrees({
        name: 'actor',
        bus,
        mediatorDereferenceRdf,
        mediatorHttp,
        actorInitQuery,
      });
      (<any> actor).queryEngine = {
        queryBindings: jest.fn(async() => ({
          toArray: async() => [
            BF.fromRecord({ shapeTree: DF.namedNode('ex:st1') }),
            BF.fromRecord({ shapeTree: DF.namedNode('ex:st2') }),
          ],
        })),
      };
    });

    describe('test', () => {
      it('should reject for an empty context', async() => {
        await expect(actor.test(<any> { context: new ActionContext() })).rejects
          .toThrow('Actor actor can only work in the context of a query.');
      });

      it('should reject for a context without query operation', async() => {
        await expect(actor.test(<any> {
          context: new ActionContext({
            [KeysInitQuery.query.name]: {},
          }),
        })).rejects.toThrow('Actor actor can only work in the context of a query operation.');
      });

      it('should reject for a context without query', async() => {
        await expect(actor.test(<any> {
          context: new ActionContext({
            [KeysQueryOperation.operation.name]: {},
          }),
        })).rejects.toThrow('Actor actor can only work in the context of a query.');
      });

      it('should be true for a valid context', async() => {
        await expect(actor.test(<any> { context })).resolves.toBeTruthy();
      });
    });

    describe('run', () => {
      it('should run for empty headers', async() => {
        await expect(actor.run(<any> {})).resolves.toMatchObject({
          metadata: {
            shapetrees: {
              applicable: [],
              nonApplicable: [],
            },
          },
        });
      });

      it('should run for valid shapetrees', async() => {
        const headers = new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="http://www.w3.org/ns/shapetrees#ShapeTreeLocator"',
        });
        const url = 'http://base.org/';
        let call = 0;
        (<any> actor).queryEngine = {
          queryBindings: jest.fn(async() => {
            if (call++ === 0) {
              return {
                toArray: async() => [
                  BF.fromRecord({ shapeTree: DF.namedNode('ex:st1') }),
                ],
              };
            }
            return {
              toArray: async() => [
                BF.fromRecord({
                  shape: DF.namedNode('http://shapes.pub/ns/medical-record/shex#MedicalRecordShape1'),
                  shapeTree: DF.namedNode('ex:st1'),
                  uriTemplate: DF.literal('template1'),
                }),
                BF.fromRecord({
                  shape: DF.namedNode('http://shapes.pub/ns/medical-record/shex#MedicalRecordShape2'),
                  shapeTree: DF.namedNode('ex:st2'),
                  uriTemplate: DF.literal('template2'),
                }),
              ],
            };
          }),
        };
        mediatorHttp.mediate = <any> jest.fn(async() => ({
          text: async() => `
BASE <http://shapes.pub/ns/medical-record/shex#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX med: <http://shapes.pub/ns/medical-record/terms#>
<http://shapes.pub/ns/medical-record/shex#MedicalRecordShape1> {
  <ex:pmatch>  <http://www.w3.org/2001/XMLSchema#string>+;
}
<http://shapes.pub/ns/medical-record/shex#MedicalRecordShape2> {
  <http://xmlns.com/foaf/0.1/givenName>  <http://www.w3.org/2001/XMLSchema#string>+;
}
`,
        }));

        await expect(actor.run(<any> { headers, url, context })).resolves.toMatchObject({
          metadata: {
            shapetrees: {
              applicable: [
                new ShapeTree('ex:st1', {
                  expression: {
                    max: -1,
                    min: 1,
                    predicate: 'ex:pmatch',
                    type: 'TripleConstraint',
                    valueExpr: {
                      datatype: 'http://www.w3.org/2001/XMLSchema#string',
                      type: 'NodeConstraint',
                    },
                  },
                  type: 'Shape',
                }, 'http://base.org/template1'),
              ],
              nonApplicable: [
                new ShapeTree('ex:st2', {
                  expression: {
                    max: -1,
                    min: 1,
                    predicate: 'http://xmlns.com/foaf/0.1/givenName',
                    type: 'TripleConstraint',
                    valueExpr: {
                      datatype: 'http://www.w3.org/2001/XMLSchema#string',
                      type: 'NodeConstraint',
                    },
                  },
                  type: 'Shape',
                }, 'http://base.org/template2'),
              ],
            },
          },
        });

        expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(2);
        expect(actor.queryEngine.queryBindings).toHaveBeenCalledTimes(2);
      });
    });

    describe('discoverShapeTreeLocator', () => {
      it('should return undefined on undefined headers', () => {
        expect(actor.discoverShapeTreeLocator()).toBeUndefined();
      });

      it('should return undefined on empty headers', () => {
        expect(actor.discoverShapeTreeLocator(new Headers())).toBeUndefined();
      });

      it('should return undefined on empty link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '',
        }))).toBeUndefined();
      });

      it('should return undefined on invalid link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: 'bla',
        }))).toBeUndefined();
      });

      it('should return undefined on other link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="OTHER"',
        }))).toBeUndefined();
      });

      it('should return the target on a valid link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="http://www.w3.org/ns/shapetrees#ShapeTreeLocator"',
        }))).toBe('https://storage.example/meta/c560224b');
      });

      it('should return the target on a valid link header with the old rel type', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="http://shapetrees.org/#ShapeTree"',
        }))).toBe('https://storage.example/meta/c560224b');
      });
    });

    describe('fetchShapeTreesLocatorShapeTrees', () => {
      it('should invoke the dereference mediator and query engine', async() => {
        context = new ActionContext();
        await expect(actor.fetchShapeTreesLocatorShapeTrees('ex:locator', context)).resolves
          .toEqual([ 'ex:st1', 'ex:st2' ]);

        expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:locator', context });
        expect(actor.queryEngine.queryBindings).toHaveBeenCalledTimes(1);
      });
    });

    describe('dereferenceShapeTrees', () => {
      it('should invoke the dereference mediator and query engine', async() => {
        (<any> actor).queryEngine = {
          queryBindings: jest.fn(async() => ({
            toArray: async() => [
              BF.fromRecord({
                shape: DF.namedNode('ex:s1'),
                shapeTree: DF.namedNode('ex:st1'),
                uriTemplate: DF.literal('template1'),
              }),
              BF.fromRecord({
                shape: DF.namedNode('ex:s2'),
                shapeTree: DF.namedNode('ex:st2'),
                uriTemplate: DF.literal('template2'),
              }),
            ],
          })),
        };

        context = new ActionContext();
        await expect(actor.dereferenceShapeTrees('ex:shapetree', 'http://base.org/', context)).resolves
          .toEqual([
            new ShapeTree('ex:st1', {
              expression: {
                max: -1,
                min: 1,
                predicate: 'http://xmlns.com/foaf/0.1/givenName',
                type: 'TripleConstraint',
                valueExpr: {
                  datatype: 'http://www.w3.org/2001/XMLSchema#string',
                  type: 'NodeConstraint',
                },
              },
              type: 'Shape',
            }, 'http://base.org/template1'),
            new ShapeTree('ex:st2', {
              expression: {
                predicate: 'http://xmlns.com/foaf/0.1/familyName',
                type: 'TripleConstraint',
                valueExpr: {
                  datatype: 'http://www.w3.org/2001/XMLSchema#string',
                  type: 'NodeConstraint',
                },
              },
              type: 'Shape',
            }, 'http://base.org/template2'),
          ]);

        expect(mediatorDereferenceRdf.mediate)
          .toHaveBeenCalledWith({ url: 'ex:shapetree', mediaType: 'text/turtle', context });
        expect(actor.queryEngine.queryBindings).toHaveBeenCalledTimes(1);
      });

      it('should throw if the requested shape is not present in the response', async() => {
        (<any> actor).queryEngine = {
          queryBindings: jest.fn(async() => ({
            toArray: async() => [
              BF.fromRecord({
                shape: DF.namedNode('ex:s1'),
                shapeTree: DF.namedNode('ex:st1'),
                uriTemplate: DF.literal('template1'),
              }),
              BF.fromRecord({
                shape: DF.namedNode('ex:s2-NOT_FOUND'),
                shapeTree: DF.namedNode('ex:st2'),
                uriTemplate: DF.literal('template2'),
              }),
            ],
          })),
        };

        await expect(actor.dereferenceShapeTrees('ex:shapetree', 'http://base.org/', context))
          .rejects.toThrow('Could not find a shape at ex:s2-NOT_FOUND');
      });

      it('should apply temporary workarounds for MedicalRecordShape', async() => {
        (<any> actor).queryEngine = {
          queryBindings: jest.fn(async() => ({
            toArray: async() => [
              BF.fromRecord({
                shape: DF.namedNode('medshape:MedicalRecordShape'),
                shapeTree: DF.namedNode('ex:st1'),
                uriTemplate: DF.literal('template1'),
              }),
            ],
          })),
        };
        mediatorHttp.mediate = <any> jest.fn(async() => ({
          text: async() => `
<https://shapes.pub/ns/medical-record/MedicalRecordShape> {
    <http://xmlns.com/foaf/0.1/givenName>  <http://www.w3.org/2001/XMLSchema#string>+,
}
`,
        }));

        context = new ActionContext();
        await expect(actor.dereferenceShapeTrees('ex:shapetree', 'http://base.org/', context)).resolves
          .toEqual([
            new ShapeTree('ex:st1', {
              expression: {
                max: -1,
                min: 1,
                predicate: 'http://xmlns.com/foaf/0.1/givenName',
                type: 'TripleConstraint',
                valueExpr: {
                  datatype: 'http://www.w3.org/2001/XMLSchema#string',
                  type: 'NodeConstraint',
                },
              },
              type: 'Shape',
            }, 'http://base.org/template1'),
          ]);

        expect(mediatorDereferenceRdf.mediate)
          .toHaveBeenCalledWith({ url: 'ex:shapetree', mediaType: 'text/turtle', context });
        expect(actor.queryEngine.queryBindings).toHaveBeenCalledTimes(1);
      });
    });

    describe('shapeTreeMatchesQuery', () => {
      it('should fail for an empty shape', () => {
        const shapeTree = createShapeTree(`
BASE <https://shapes.pub/ns/medical-record/shex#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX med: <http://shapes.pub/ns/medical-record/terms#>
<MedicalRecordShape> {}
        `);

        expect(actor.shapeTreeMatchesQuery(
          shapeTree,
          AF.createBgp([
            AF.createPattern(
              DF.variable('s'),
              DF.namedNode('ex:p'),
              DF.namedNode('ex:class1'),
            ),
            AF.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
          ]),
          AF.createPattern(
            DF.variable('s'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:bla'),
          ),
        )).toBeFalsy();
      });

      it('should fail for an shape that matches none of the query patterns', () => {
        const shapeTree = createShapeTree(`
BASE <https://shapes.pub/ns/medical-record/shex#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX med: <http://shapes.pub/ns/medical-record/terms#>
<MedicalRecordShape> {
  med:hasAppointment IRI* ;
  med:hasCondition IRI* ;
  med:hasEncounter IRI* ;
}
        `);

        expect(actor.shapeTreeMatchesQuery(
          shapeTree,
          AF.createBgp([
            AF.createPattern(
              DF.variable('s'),
              DF.namedNode('ex:p'),
              DF.namedNode('ex:class1'),
            ),
            AF.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
          ]),
          AF.createPattern(
            DF.variable('s'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:bla'),
          ),
        )).toBeFalsy();
      });

      it('should fail for an shape that matches the query, but is not linked to the current pattern', () => {
        const shapeTree = createShapeTree(`
BASE <https://shapes.pub/ns/medical-record/shex#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX med: <http://shapes.pub/ns/medical-record/terms#>
<MedicalRecordShape> {
  med:hasAppointment IRI* ;
  med:hasCondition IRI* ;
  med:hasEncounter IRI* ;
}
        `);

        expect(actor.shapeTreeMatchesQuery(
          shapeTree,
          AF.createBgp([
            AF.createPattern(
              DF.variable('s1'),
              DF.namedNode('http://shapes.pub/ns/medical-record/terms#hasCondition'),
              DF.namedNode('ex:class1'),
            ),
            AF.createPattern(DF.variable('s1'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
            AF.createPattern(DF.variable('s2'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
          ]),
          AF.createPattern(
            DF.variable('s2'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:bla'),
          ),
        )).toBeFalsy();
      });

      it('should pass for an shape that matches the query and the current pattern', () => {
        const shapeTree = createShapeTree(`
BASE <https://shapes.pub/ns/medical-record/shex#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX med: <http://shapes.pub/ns/medical-record/terms#>
<MedicalRecordShape> {
  med:hasAppointment IRI* ;
  med:hasCondition IRI* ;
  med:hasEncounter IRI* ;
}
        `);

        expect(actor.shapeTreeMatchesQuery(
          shapeTree,
          AF.createBgp([
            AF.createPattern(
              DF.variable('s1'),
              DF.namedNode('http://shapes.pub/ns/medical-record/terms#hasCondition'),
              DF.namedNode('ex:class1'),
            ),
            AF.createPattern(DF.variable('s1'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
            AF.createPattern(DF.variable('s2'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
          ]),
          AF.createPattern(
            DF.variable('s1'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:bla'),
          ),
        )).toBeTruthy();
      });
    });
  });
});

function createShapeTree(shex: string): ShapeTree {
  const parser = shexParser.construct('ex:shape');
  const schema: ShEx.Schema = parser.parse(shex);
  const expression = <ShEx.Shape> schema.shapes![0].shapeExpr;
  return new ShapeTree('ex:shape', expression, 'template');
}
