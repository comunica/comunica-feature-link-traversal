import type { ActorInitQuery } from '@comunica/actor-init-query';
import { BindingsFactory } from '@comunica/bindings-factory';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import type { MediatorHttp } from '@comunica/bus-http';
import { ActionContext, Bus } from '@comunica/core';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { ActorRdfMetadataExtractTraverseShapetrees } from '../lib/ActorRdfMetadataExtractTraverseShapetrees';
import { ShapeTree } from '../lib/ShapeTree';

const DF = new DataFactory();
const BF = new BindingsFactory();

describe('ActorRdfMetadataExtractTraverseShapetrees', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfMetadataExtractTraverseShapetrees instance', () => {
    let actor: ActorRdfMetadataExtractTraverseShapetrees;
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
      actor = new ActorRdfMetadataExtractTraverseShapetrees({
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
      it('should always return true', () => {
        return expect(actor.test(<any> {})).resolves.toBeTruthy();
      });
    });

    describe('discoverShapeTreeLocator', () => {
      it('should return undefined on undefined headers', () => {
        expect(actor.discoverShapeTreeLocator()).toEqual(undefined);
      });

      it('should return undefined on empty headers', () => {
        expect(actor.discoverShapeTreeLocator(new Headers())).toEqual(undefined);
      });

      it('should return undefined on empty link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '',
        }))).toEqual(undefined);
      });

      it('should return undefined on invalid link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: 'bla',
        }))).toEqual(undefined);
      });

      it('should return undefined on other link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="OTHER"',
        }))).toEqual(undefined);
      });

      it('should return the target on a valid link header', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="http://www.w3.org/ns/shapetrees#ShapeTreeLocator"',
        }))).toEqual('https://storage.example/meta/c560224b');
      });

      it('should return the target on a valid link header with the old rel type', () => {
        expect(actor.discoverShapeTreeLocator(new Headers({
          link: '<https://storage.example/meta/c560224b>; rel="http://shapetrees.org/#ShapeTree"',
        }))).toEqual('https://storage.example/meta/c560224b');
      });
    });

    describe('fetchShapeTreesLocatorShapeTrees', () => {
      it('should invoke the dereference mediator and query engine', async() => {
        const context = new ActionContext();
        expect(await actor.fetchShapeTreesLocatorShapeTrees('ex:locator', context))
          .toEqual([ 'ex:st1', 'ex:st2' ]);

        expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:locator', context });
        expect(actor.queryEngine.queryBindings).toHaveBeenCalled();
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

        const context = new ActionContext();
        expect(await actor.dereferenceShapeTrees('ex:shapetree', context))
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
              id: 'ex:s1',
              type: 'Shape',
            }, 'template1'),
            new ShapeTree('ex:st2', {
              expression: {
                predicate: 'http://xmlns.com/foaf/0.1/familyName',
                type: 'TripleConstraint',
                valueExpr: {
                  datatype: 'http://www.w3.org/2001/XMLSchema#string',
                  type: 'NodeConstraint',
                },
              },
              id: 'ex:s2',
              type: 'Shape',
            }, 'template2'),
          ]);

        expect(mediatorDereferenceRdf.mediate)
          .toHaveBeenCalledWith({ url: 'ex:shapetree', mediaType: 'text/turtle', context });
        expect(actor.queryEngine.queryBindings).toHaveBeenCalled();
      });
    });

    describe('run', () => {
      it('should run', () => {
        return expect(actor.run(<any> { todo: true })).resolves.toMatchObject({ metadata: { traverse: []}});
      });
    });
  });
});
