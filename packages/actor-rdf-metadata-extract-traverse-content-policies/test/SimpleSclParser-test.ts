import { DataFactory } from 'rdf-data-factory';
import type { Algebra } from 'sparqlalgebrajs';
import { Factory } from 'sparqlalgebrajs';
import { ContentPolicy } from '../lib/ContentPolicy';
import { SimpleSclParser } from '../lib/SimpleSclParser';
const DF = new DataFactory();

describe('SimpleSclParser', () => {
  let parser: SimpleSclParser;
  let factory: Factory;

  beforeEach(() => {
    parser = new SimpleSclParser();
    factory = new Factory();
  });

  function makeIncludeClause(patterns: Algebra.Pattern[]): Algebra.Construct {
    return factory.createConstruct(factory.createBgp(patterns), patterns);
  }

  describe('parse', () => {
    describe('valid policies', () => {
      it('should handle a policy with one variable and one triple pattern', () => {
        expect(parser.parse(`FOLLOW ?uri {
        ?s <ex:p> ?uri.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy padded with spaces', () => {
        expect(parser.parse(`  FOLLOW ?uri {
        ?s <ex:p> ?uri.
      }  `)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy padded with tabs', () => {
        expect(parser.parse(`\t\tFOLLOW ?uri {
        ?s <ex:p> ?uri.
      }\t\t`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy padded with newlines', () => {
        expect(parser.parse(`\n\nFOLLOW ?uri {
        ?s <ex:p> ?uri.
      }\n\n`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy with one variable and three triple pattern', () => {
        expect(parser.parse(`FOLLOW ?uri {
        ?s1 <ex:p> ?uri.
        ?s2 <ex:p> ?uri.
        ?s3 <ex:p> ?uri.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s1'), DF.namedNode('ex:p'), DF.variable('uri')),
            factory.createPattern(DF.variable('s2'), DF.namedNode('ex:p'), DF.variable('uri')),
            factory.createPattern(DF.variable('s3'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy with three variables and one triple pattern', () => {
        expect(parser.parse(`FOLLOW ?uri1 ?uri2 ?uri3 {
        ?s <ex:p> ?uri.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri1', withPolicies: false },
            { name: 'uri2', withPolicies: false },
            { name: 'uri3', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy with one variable with policies and one triple pattern', () => {
        expect(parser.parse(`FOLLOW (?uri WITH POLICIES) {
        ?s <ex:p> ?uri.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: true },
          ]),
        );
      });

      it('should handle a policy with mixed variables with and without policies and one triple pattern', () => {
        expect(parser.parse(`FOLLOW (?uri1 WITH POLICIES) ?uri2 (?uri3 WITH POLICIES) {
        ?s <ex:p> ?uri.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri1', withPolicies: true },
            { name: 'uri2', withPolicies: false },
            { name: 'uri3', withPolicies: true },
          ]),
        );
      });

      it('should handle a policy with an INCLUDE WHERE clause', () => {
        expect(parser.parse(`FOLLOW ?uri {
        ?s <ex:p> ?uri.
      } INCLUDE WHERE {
        ?a <ex:b> ?c.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ], makeIncludeClause([
            factory.createPattern(DF.variable('a'), DF.namedNode('ex:b'), DF.variable('c')),
          ])),
        );
      });

      it('should handle a policy with an INCLUDE WHERE clause with three triple patterns', () => {
        expect(parser.parse(`FOLLOW ?uri {
        ?s <ex:p> ?uri.
      } INCLUDE WHERE {
        ?a1 <ex:b> ?c.
        ?a2 <ex:b> ?c.
        ?a3 <ex:b> ?c.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ], makeIncludeClause([
            factory.createPattern(DF.variable('a1'), DF.namedNode('ex:b'), DF.variable('c')),
            factory.createPattern(DF.variable('a2'), DF.namedNode('ex:b'), DF.variable('c')),
            factory.createPattern(DF.variable('a3'), DF.namedNode('ex:b'), DF.variable('c')),
          ])),
        );
      });

      it('should handle a policy with an INCLUDE WHERE clause in expanded form', () => {
        expect(parser.parse(`FOLLOW ?uri {
        ?s <ex:p> ?uri.
      } INCLUDE {
        ?a <ex:b> ?c.
      } WHERE {
        ?a <ex:b> ?c.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ], makeIncludeClause([
            factory.createPattern(DF.variable('a'), DF.namedNode('ex:b'), DF.variable('c')),
          ])),
        );
      });

      it('should handle a policy with an INCLUDE WHERE clause in expanded form with complex operators', () => {
        expect(parser.parse(`FOLLOW ?uri {
        ?s <ex:p> ?uri.
      } INCLUDE {
        ?a <ex:b> ?c.
      } WHERE {
        { ?a <ex:b> ?c } UNION { ?a <ex:c> ?c. }
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ], factory.createConstruct(factory.createUnion(
            factory.createBgp([
              factory.createPattern(DF.variable('a'), DF.namedNode('ex:b'), DF.variable('c')),
            ]),
            factory.createBgp([
              factory.createPattern(DF.variable('a'), DF.namedNode('ex:c'), DF.variable('c')),
            ]),
          ), [
            factory.createPattern(DF.variable('a'), DF.namedNode('ex:b'), DF.variable('c')),
          ])),
        );
      });

      it('should handle a policy with IRI relative to baseIRI', () => {
        expect(parser.parse(`FOLLOW ?uri {
        <> <#p> ?uri.
      }`, 'http://example.org/base')).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(
              DF.namedNode('http://example.org/base'),
              DF.namedNode('http://example.org/base#p'),
              DF.variable('uri'),
            ),
          ]), [
            { name: 'uri', withPolicies: false },
          ]),
        );
      });

      it('should handle a policy with blank nodes', () => {
        expect(parser.parse(`FOLLOW ?uri {
        _:s <ex:p> ?uri.
      } INCLUDE WHERE {
        _:a <ex:b> ?c.
      }`)).toMatchObject(
          new ContentPolicy(factory.createBgp([
            factory.createPattern(DF.variable('e_s'), DF.namedNode('ex:p'), DF.variable('uri')),
          ]), [
            { name: 'uri', withPolicies: false },
          ], factory.createConstruct(factory.createBgp([
            factory.createPattern(DF.variable('e_a'), DF.namedNode('ex:b'), DF.variable('c')),
          ]), [
            factory.createPattern(DF.blankNode('e_a'), DF.namedNode('ex:b'), DF.variable('c')),
          ])),
        );
      });
    });

    describe('invalid policies', () => {
      it('should throw on another start that F', () => {
        expect(() => parser.parse(`ABC {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Content policy starting with illegal character \'A\', while \'FOLLOW\' is expected'));
      });

      it('should throw on another continuation of FOLLOW', () => {
        expect(() => parser.parse(`FAFA {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Content policy must start with \'FOLLOW\', but found \'FAFA {\''));
      });

      it('should throw for no variables', () => {
        expect(() => parser.parse(`FOLLOW {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: No followed variables are defined'));
      });

      it('should throw for variable without label', () => {
        expect(() => parser.parse(`FOLLOW ? {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: a variable must define a label after \'?\''));
      });

      it('should throw for variable with multiple', () => {
        expect(() => parser.parse(`FOLLOW ??a {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: a variable can only contain one \'?\''));
      });

      it('should throw for invalid WITH POLICIES', () => {
        expect(() => parser.parse(`FOLLOW (?var ABC) {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: expected variables to be in the form of \'(?varName WITH POLICIES)\''));
      });

      it('should throw for only closing bracket', () => {
        expect(() => parser.parse(`FOLLOW ?var) {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: Unexpected \')\''));
      });

      it('should throw for variable without ?', () => {
        expect(() => parser.parse(`FOLLOW var ?abc {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: Missing \'?\' or \'(\' before variable definition'));
      });

      it('should throw for double open brackets', () => {
        expect(() => parser.parse(`FOLLOW (( {
        ?s <ex:p> ?uri.
      }`)).toThrow(new Error('Invalid variable clause: a variable with policies clause can only contain one \'(\''));
      });

      it('should throw for missing } at the end', () => {
        expect(() => parser.parse(`FOLLOW ?var {
        ?s <ex:p> ?uri.
      `)).toThrow(new Error('Missing \'}\' at the end of the policy'));
      });

      it('should throw for an invalid FOLLOW clause', () => {
        expect(() => parser.parse(`FOLLOW ?var {
        ?s <ex:p>>>>>> ?uri.
      }`)).toThrow(/^Parse error on line 2/u);
      });

      it('should throw for an invalid INCLUDE WHERE clause', () => {
        expect(() => parser.parse(`FOLLOW ?var {
        ?s <ex:p> ?uri.
      } INCLUDE WHERE {
        ?s <ex:p>>>>>> ?uri.
      }`)).toThrow(/^Parse error on line 2/u);
      });

      it('should throw on a policy with IRI relative but no baseIRI', () => {
        expect(() => parser.parse(`FOLLOW ?uri {
        <> <#p> ?uri.
      }`)).toThrow(new Error('Cannot resolve relative IRI  because no base IRI was set.'));
      });
    });
  });
});
