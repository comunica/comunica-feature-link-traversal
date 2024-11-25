import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';
import { Bus, ActionContext } from '@comunica/core';
import type { LinkFilterType } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import '@comunica/utils-jest';

import { ActorRdfMetadataExtractLinkFilterVoid } from '../lib/ActorRdfMetadataExtractLinkFilterVoid';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

const voidUriSpace = DF.namedNode('http://rdfs.org/ns/void#uriSpace');
const voidUriRegexPattern = DF.namedNode('http://rdfs.org/ns/void#uriRegexPattern');
const voidSparqlEndpoint = DF.namedNode('http://rdfs.org/ns/void#sparqlEndpoint');

describe('ActorRdfMetadataExtractLinkFilterVoid', () => {
  let bus: any;
  let actor: ActorRdfMetadataExtractLinkFilterVoid;
  let linkFilters: LinkFilterType[];

  beforeEach(() => {
    jest.resetAllMocks();
    bus = new Bus({ name: 'bus' });
    actor = new ActorRdfMetadataExtractLinkFilterVoid({ bus, name: 'actor' });
    linkFilters = [];
  });

  describe('test', () => {
    it('should pass with filter storage in context', async() => {
      await expect(actor.test({
        context: new ActionContext({ [KeysRdfResolveHypermediaLinks.linkFilters.name]: linkFilters }),
        metadata: <any>{},
        requestTime: 0,
        url: 'url',
      })).resolves.toPassTestVoid();
    });

    it('should fail without filter storage in context', async() => {
      await expect(actor.test({
        context: new ActionContext(),
        metadata: <any>{},
        requestTime: 0,
        url: 'url',
      })).resolves.toFailTest('unable to extract link filters without context storage target present');
    });
  });

  describe('run', () => {
    it('should register discovered link filters', async() => {
      jest.spyOn(actor, 'extractFilters').mockResolvedValue([ <any>'filter' ]);
      await expect(actor.run({
        context: new ActionContext({ [KeysRdfResolveHypermediaLinks.linkFilters.name]: linkFilters }),
        metadata: <any>{},
        requestTime: 0,
        url: 'url',
      })).resolves.toEqual({ metadata: {}});
      expect(linkFilters).toEqual([ 'filter' ]);
    });

    it('should not register any filters when none are discovered', async() => {
      jest.spyOn(actor, 'extractFilters').mockResolvedValue([]);
      await expect(actor.run({
        context: new ActionContext({ [KeysRdfResolveHypermediaLinks.linkFilters.name]: linkFilters }),
        metadata: <any>{},
        requestTime: 0,
        url: 'url',
      })).resolves.toEqual({ metadata: {}});
      expect(linkFilters).toEqual([]);
    });
  });

  describe('extractFilters', () => {
    it('should parse filters from void:uriSpace', async() => {
      const subjectWithEndpoint = DF.blankNode();
      const subjectWithoutEndpoint = DF.blankNode();
      const stream = streamifyArray([
        DF.quad(subjectWithEndpoint, voidSparqlEndpoint, DF.literal('http://localhost/endpoint')),
        DF.quad(subjectWithEndpoint, voidUriSpace, DF.literal('http://localhost/')),
        DF.quad(subjectWithoutEndpoint, voidUriSpace, DF.literal('http://otherhost/')),
      ]);
      const filters = await actor.extractFilters(stream);
      expect(filters).toHaveLength(1);
      expect(filters[0]({ url: 'http://localhost/some/uri' })).toBeFalsy();
    });

    it('should parse filters from void:uriRegexPattern', async() => {
      const subjectWithEndpoint = DF.blankNode();
      const subjectWithoutEndpoint = DF.blankNode();
      const stream = streamifyArray([
        DF.quad(subjectWithEndpoint, voidSparqlEndpoint, DF.literal('http://localhost/endpoint')),
        DF.quad(subjectWithEndpoint, voidUriRegexPattern, DF.literal('^http://localhost/')),
        DF.quad(subjectWithoutEndpoint, voidUriRegexPattern, DF.literal('^http://otherhost/')),
      ]);
      const filters = await actor.extractFilters(stream);
      expect(filters).toHaveLength(1);
      expect(filters[0]({ url: 'http://localhost/some/uri' })).toBeFalsy();
    });
  });
});
