import type { ITreeRelationRaw } from '@comunica/types-link-traversal';
import { TreeNodes, RelationOperator } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { buildRelations, addRelationDescription } from '../lib/treeMetadataExtraction';

const DF = new DataFactory<RDF.Quad>();

describe('treeMetadataExtraction', () => {
  describe('addRelationDescription', () => {
    it('should add relation to the map when an operator is provided and the relation map is empty',
      () => {
        const quad: RDF.Quad = DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation),
        );
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
        addRelationDescription(relationDescriptions, quad, RelationOperator.EqualThanRelation, 'operator');

        expect(relationDescriptions.size).toBe(1);
      });

    it(`should add relation to the map when an operator is provided and
     the relation map at the current key is not empty`,
    () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
        DF.namedNode(TreeNodes.RDFTypeNode),
        DF.namedNode(RelationOperator.EqualThanRelation));
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s', { value: 22 }]]);
      addRelationDescription(relationDescriptions, quad, RelationOperator.EqualThanRelation, 'operator');
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when an operator is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s2', { value: 22 }]]);
        addRelationDescription(relationDescriptions, quad, RelationOperator.EqualThanRelation, 'operator');
        expect(relationDescriptions.size).toBe(2);
      });

    it('should add relation to the map when a value is provided and the relation map is empty', () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      addRelationDescription(relationDescriptions, quad, '5', 'value');
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when a value is provided and the relation map at the current key is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, ITreeRelationRaw> =
        new Map([[ 'ex:s', { subject: [ 'ex:s', quad ]}]]);
        addRelationDescription(relationDescriptions, quad, '5', 'value');
        expect(relationDescriptions.size).toBe(1);
      });

    it('should add relation to the map when a value is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s2', { value: 22 }]]);
        addRelationDescription(relationDescriptions, quad, '5', 'value');
        expect(relationDescriptions.size).toBe(2);
      });

    it('should add relation to the map when a subject is provided and the relation map is empty', () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Path), DF.namedNode('ex:path'));
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      addRelationDescription(relationDescriptions, quad, 'ex:path', 'subject');
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when a subject is provided and the relation map at the current key is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Path), DF.namedNode('ex:path'));
        const relationDescriptions: Map<string, ITreeRelationRaw> =
        new Map([[ 'ex:s', { subject: [ 'ex:s', quad ]}]]);
        addRelationDescription(relationDescriptions, quad, 'ex:path', 'subject');
        expect(relationDescriptions.size).toBe(1);
      });

    it('should add relation to the map when a subject is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, ITreeRelationRaw> = new Map([[ 'ex:s2', { value: 22 }]]);
        addRelationDescription(relationDescriptions, quad, 'ex:path', 'subject');
        expect(relationDescriptions.size).toBe(2);
      });
  });

  describe('buildRelations', () => {
    it('should not modify the relation map when the predicate is not related to the relations',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
        expect(buildRelations(quad)).toBeUndefined();
      });

    it('should modify the relation map when the predicate is a rdf type with a supported relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));

        const res = buildRelations(quad);
        expect(res).toBeDefined();
        const [ value, key ] = <any> res;
        expect(key).toBe(<keyof ITreeRelationRaw> 'operator');
        expect(value).toBe(RelationOperator.EqualThanRelation);
      });

    it('should not modify the relation map when the predicate is a rdf type an supported relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode('foo'));

        const res = buildRelations(quad);
        expect(res).toBeUndefined();
      });
  });
});
