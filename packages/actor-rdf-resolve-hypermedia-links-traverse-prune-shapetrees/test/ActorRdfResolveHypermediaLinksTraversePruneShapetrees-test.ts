import { ShapeTree } from '@comunica/actor-rdf-metadata-extract-shapetrees';
import type { MediatorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { ActionContext, Bus } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import {
  ActorRdfResolveHypermediaLinksTraversePruneShapetrees,
} from '../lib/ActorRdfResolveHypermediaLinksTraversePruneShapetrees';
import '@comunica/utils-jest';

describe('ActorRdfResolveHypermediaLinksTraversePruneShapetrees', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveHypermediaLinksTraversePruneShapetrees instance', () => {
    let mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
    let actor: ActorRdfResolveHypermediaLinksTraversePruneShapetrees;
    let context: IActionContext;

    beforeEach(() => {
      mediatorRdfResolveHypermediaLinks = <any> {
        async mediate(arg: any) {
          return arg;
        },
      };
      actor = new ActorRdfResolveHypermediaLinksTraversePruneShapetrees({
        name: 'actor',
        bus,
        mediatorRdfResolveHypermediaLinks,
      });
      context = new ActionContext();
    });

    describe('test', () => {
      it('should fail with empty metadata', async() => {
        await expect(actor.test({ metadata: {}, context })).resolves
          .toFailTest('Actor actor requires a \'traverse\' metadata entry.');
      });

      it('should fail without shapetrees in metadata', async() => {
        await expect(actor.test({ metadata: { traverse: true }, context }))
          .resolves.toFailTest(`Actor actor requires a 'shapetrees' metadata entry.`);
      });

      it('should fail without traverse in metadata', async() => {
        await expect(actor.test({ metadata: { shapetrees: true }, context }))
          .resolves.toFailTest(`Actor actor requires a 'traverse' metadata entry.`);
      });

      it('should pass with traverse and shapetrees in metadata', async() => {
        await expect(actor.test({ metadata: { traverse: true, shapetrees: true }, context }))
          .resolves.toPassTestVoid();
      });
    });

    describe('run', () => {
      it('should run with empty data', async() => {
        const action = {
          metadata: {
            traverse: [],
            shapetrees: [],
          },
          context,
        };
        await expect(actor.run(action)).resolves.toEqual({
          metadata: {
            traverse: [],
          },
          context,
        });
      });

      it('should run with a mix of links matching or not with nonApplicable', async() => {
        const action = {
          metadata: {
            traverse: [
              { url: 'ex:url/a/a' },
              { url: 'ex:url/a/b' },
              { url: 'ex:url/b/a' },
              { url: 'ex:url/b/b' },
              { url: 'ex:url/a' },
              { url: 'ex:url/c/c' },
            ],
            shapetrees: {
              nonApplicable: [
                new ShapeTree(<any> undefined, <any> undefined, 'ex:url/a/{id}'),
                new ShapeTree(<any> undefined, <any> undefined, 'ex:url/b/{id}'),
              ],
            },
          },
          context,
        };
        await expect(actor.run(action)).resolves.toEqual({
          metadata: {
            traverse: [
              { url: 'ex:url/a' },
              { url: 'ex:url/c/c' },
            ],
          },
          context,
        });
      });
    });

    describe('urlMatchesTemplate', () => {
      it('should return true on an exact match', () => {
        expect(actor.urlMatchesTemplate('http://ex.org/bla', 'http://ex.org/bla'))
          .toBeTruthy();
      });

      it('should return false on an exact non-match', () => {
        expect(actor.urlMatchesTemplate('http://ex.org/bla', 'http://ex.org/bla2'))
          .toBeFalsy();
      });

      it('should return true with one template variable that matches', () => {
        expect(actor.urlMatchesTemplate('http://ex.org/bla', 'http://ex.org/{id}'))
          .toBeTruthy();
      });

      it('should return false with one template variable that does not match', () => {
        expect(actor.urlMatchesTemplate('http://ex.com/bla', 'http://ex.org/{id}'))
          .toBeFalsy();
      });

      it('should return true with two template variables that match', () => {
        expect(actor.urlMatchesTemplate('http://ex.org/abc/def', 'http://ex.org/{id1}/{id2}'))
          .toBeTruthy();
      });

      it('should return false with two template variables that does not match', () => {
        expect(actor.urlMatchesTemplate('http://ex.org/abc/', 'http://ex.org/{id1}/{id2}'))
          .toBeFalsy();
        expect(actor.urlMatchesTemplate('http://ex.org/abc', 'http://ex.org/{id1}/{id2}'))
          .toBeFalsy();
      });
    });
  });
});
