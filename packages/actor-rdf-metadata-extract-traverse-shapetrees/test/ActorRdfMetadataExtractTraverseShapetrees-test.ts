import { Actor, Bus, IActorTest, Mediator } from '@comunica/core';
import { ActorRdfMetadataExtractTraverseShapetrees } from '../lib/ActorRdfMetadataExtractTraverseShapetrees';
import { IActionRdfDereference, IActorRdfDereferenceOutput } from '@comunica/bus-rdf-dereference';
import { ActorHttp, IActionHttp, IActorHttpOutput } from '@comunica/bus-http';
import { IQueryEngine } from '@comunica/types';

describe('ActorRdfMetadataExtractTraverseShapetrees', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfMetadataExtractTraverseShapetrees instance', () => {
    let actor: ActorRdfMetadataExtractTraverseShapetrees;
    let mediatorRdfDereference: Mediator<Actor<IActionRdfDereference, IActorTest,
    IActorRdfDereferenceOutput>, IActionRdfDereference, IActorTest, IActorRdfDereferenceOutput>;
    let mediatorHttp: Mediator<ActorHttp, IActionHttp, IActorTest, IActorHttpOutput>;
    let queryEngine: IQueryEngine;

    beforeEach(() => {
      mediatorRdfDereference = <any> {
        mediate: jest.fn(),
      };
      mediatorHttp = <any> {
        mediate: jest.fn(),
      };
      queryEngine = <any> {};
      actor = new ActorRdfMetadataExtractTraverseShapetrees({
        name: 'actor',
        bus,
        mediatorRdfDereference,
        mediatorHttp,
        queryEngine,
      });
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
        expect(actor.discoverShapeTreeLocator({})).toEqual(undefined);
      });

      it('should return undefined on empty link header', () => {
        expect(actor.discoverShapeTreeLocator({
          link: '',
        })).toEqual(undefined);
      });

      it('should return undefined on invalid link header', () => {
        expect(actor.discoverShapeTreeLocator({
          link: 'bla',
        })).toEqual(undefined);
      });

      it('should return undefined on other link header', () => {
        expect(actor.discoverShapeTreeLocator({
          link: '<https://storage.example/meta/c560224b>; rel="OTHER"',
        })).toEqual(undefined);
      });

      it('should return the target on a valid link header', () => {
        expect(actor.discoverShapeTreeLocator({
          link: '<https://storage.example/meta/c560224b>; rel="http://www.w3.org/ns/shapetrees#ShapeTreeLocator"',
        })).toEqual('https://storage.example/meta/c560224b');
      });

      it('should return the target on a valid link header with the old rel type', () => {
        expect(actor.discoverShapeTreeLocator({
          link: '<https://storage.example/meta/c560224b>; rel="http://shapetrees.org/#ShapeTree"',
        })).toEqual('https://storage.example/meta/c560224b');
      });
    });

    describe('run', () => {
      it('should run', () => {
        return expect(actor.run(<any> { todo: true })).resolves.toMatchObject({ todo: true }); // TODO
      });
    });
  });
});
