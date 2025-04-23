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
  let context: ActionContext;
  let linkFilters: LinkFilterType[];

  beforeEach(() => {
    jest.resetAllMocks();
    bus = new Bus({ name: 'bus' });
    actor = new ActorRdfMetadataExtractLinkFilterVoid({ bus, name: 'actor' });
    (<any>actor).logDebug = (_context: any, _message: string, extraDataFn: () => any) => extraDataFn();
    linkFilters = [];
    context = new ActionContext({ [KeysRdfResolveHypermediaLinks.linkFilters.name]: linkFilters });
  });

  describe('test', () => {
    it('should pass with filter storage in context', async() => {
      await expect(actor.test({
        context,
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
    it('should parse filters from void:uriSpace', async() => {
      const subjectWithEndpoint = DF.blankNode();
      const subjectWithoutEndpoint = DF.blankNode();
      const metadata = streamifyArray([
        DF.quad(subjectWithEndpoint, voidSparqlEndpoint, DF.literal('http://localhost/endpoint')),
        DF.quad(subjectWithEndpoint, voidUriSpace, DF.literal('http://localhost/')),
        DF.quad(subjectWithoutEndpoint, voidUriSpace, DF.literal('http://otherhost/')),
      ]);
      await expect(actor.run(<any>{ metadata, context })).resolves.toEqual({ metadata: {}});
      expect(linkFilters).toHaveLength(1);
      expect(linkFilters[0]({ url: 'http://localhost/some/uri' })).toBeFalsy();
      expect(linkFilters[0]({ url: 'http://otherhose/some/uri' })).toBeTruthy();
    });

    it('should parse filters from void:uriRegexPattern', async() => {
      const subjectWithEndpoint = DF.blankNode();
      const subjectWithoutEndpoint = DF.blankNode();
      const metadata = streamifyArray([
        DF.quad(subjectWithEndpoint, voidSparqlEndpoint, DF.literal('http://localhost/endpoint')),
        DF.quad(subjectWithEndpoint, voidUriRegexPattern, DF.literal('^http://localhost/')),
        DF.quad(subjectWithoutEndpoint, voidUriRegexPattern, DF.literal('^http://otherhost/')),
      ]);
      await expect(actor.run(<any>{ metadata, context })).resolves.toEqual({ metadata: {}});
      expect(linkFilters).toHaveLength(1);
      expect(linkFilters[0]({ url: 'http://localhost/some/uri' })).toBeFalsy();
      expect(linkFilters[0]({ url: 'http://otherhose/some/uri' })).toBeTruthy();
    });
  });
});
