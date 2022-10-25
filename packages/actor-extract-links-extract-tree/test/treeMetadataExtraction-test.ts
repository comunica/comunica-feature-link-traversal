import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { buildRelations, addRelationDescription } from '../lib/treeMetadataExtraction';
import type { IRelationDescription } from '../lib/typeTreeMetadataExtraction';
import { TreeNodes, RelationOperator } from '../lib/typeTreeMetadataExtraction';

const DF = new DataFactory<RDF.Quad>();

describe('treeMetadataExtraction', () => {
  describe('addRelationDescription', () => {
    it('should add relation to the map when an operator is provided and the relation map is empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, IRelationDescription> = new Map();
        addRelationDescription({ relationDescriptions, quad, operator: RelationOperator.EqualThanRelation });
        expect(relationDescriptions.size).toBe(1);
      });

    it(`should add relation to the map when an operator is provided and
     the relation map at the current key is not empty`,
    () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
        DF.namedNode(TreeNodes.RDFTypeNode),
        DF.namedNode(RelationOperator.EqualThanRelation));
      const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s', { value: 22 }]]);
      addRelationDescription({ relationDescriptions, quad, operator: RelationOperator.EqualThanRelation });
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when an operator is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s2', { value: 22 }]]);
        addRelationDescription({ relationDescriptions, quad, operator: RelationOperator.EqualThanRelation });
        expect(relationDescriptions.size).toBe(2);
      });

    it('should add relation to the map when a value is provided and the relation map is empty', () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
      const relationDescriptions: Map<string, IRelationDescription> = new Map();
      addRelationDescription({ relationDescriptions, quad, value: '5' });
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when a value is provided and the relation map at the current key is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s', { subject: 'ex:s' }]]);
        addRelationDescription({ relationDescriptions, quad, value: '5' });
        expect(relationDescriptions.size).toBe(1);
      });

    it('should add relation to the map when a value is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s2', { value: 22 }]]);
        addRelationDescription({ relationDescriptions, quad, value: '5' });
        expect(relationDescriptions.size).toBe(2);
      });

    it('should add relation to the map when a subject is provided and the relation map is empty', () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Path), DF.namedNode('ex:path'));
      const relationDescriptions: Map<string, IRelationDescription> = new Map();
      addRelationDescription({ relationDescriptions, quad, subject: 'ex:path' });
      expect(relationDescriptions.size).toBe(1);
    });

    it('should add relation to the map when a subject is provided and the relation map at the current key is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Path), DF.namedNode('ex:path'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s', { subject: 'ex:s' }]]);
        addRelationDescription({ relationDescriptions, quad, subject: 'ex:path' });
        expect(relationDescriptions.size).toBe(1);
      });

    it('should add relation to the map when a subject is provided and the relation map is not empty',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode(TreeNodes.Value), DF.namedNode('5'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s2', { value: 22 }]]);
        addRelationDescription({ relationDescriptions, quad, subject: 'ex:path' });
        expect(relationDescriptions.size).toBe(2);
      });
  });

  describe('buildRelations', () => {
    it('should not modify the relation map when the predicate is not related to the relations',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map();
        buildRelations(relationDescriptions, quad);
        expect(relationDescriptions.size).toBe(0);
      });

    it('should modify the relation map when the predicate is a rdf type with a supported relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, IRelationDescription> = new Map();

        const expectedDescription = new Map([[ 'ex:s', { operator: RelationOperator.EqualThanRelation,
          subject: undefined,
          value: undefined,
          remainingItems: undefined }]]);
        buildRelations(relationDescriptions, quad);
        expect(relationDescriptions.size).toBe(1);

        expect(relationDescriptions).toStrictEqual(expectedDescription);
      });

    it('should not modify the relation map when the predicate is a rdf type an supported relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode('foo'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map();
        buildRelations(relationDescriptions, quad);

        expect(relationDescriptions.size).toBe(0);
      });

    it('should modify an map with another relation when the predicate is a rdf type an supported relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s2', {}]]);
        const expectedDescription: Map<string, IRelationDescription> = new Map([[ 'ex:s2', {}],
          [ 'ex:s',
            { operator: RelationOperator.EqualThanRelation,
              subject: undefined,
              value: undefined,
              remainingItems: undefined }]]);

        buildRelations(relationDescriptions, quad);
        expect(relationDescriptions.size).toBe(2);
        expect(relationDescriptions).toStrictEqual(expectedDescription);
      });

    it(`should modify an map with a relation that has already been started 
    to be defined when the predicate is a rdf type an supported relation`,
    () => {
      const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
        DF.namedNode(TreeNodes.RDFTypeNode),
        DF.namedNode(RelationOperator.EqualThanRelation));
      const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s',
        { subject: 'ex:path', value: undefined, remainingItems: undefined }]]);
      const expectedDescription: Map<string, IRelationDescription> = new Map([[ 'ex:s',
        { operator: RelationOperator.EqualThanRelation,
          subject: 'ex:path',
          value: undefined,
          remainingItems: undefined }]]);

      buildRelations(relationDescriptions, quad);

      expect(relationDescriptions.size).toBe(1);
      expect(relationDescriptions).toStrictEqual(expectedDescription);
    });

    it('should not modify the relation map when no new values are provided',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode('bar'),
          DF.namedNode(RelationOperator.EqualThanRelation));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s',
          { subject: 'ex:path',
            value: undefined,
            remainingItems: undefined }]]);
        const expectedDescription: Map<string, IRelationDescription> = relationDescriptions;

        buildRelations(relationDescriptions, quad);

        expect(relationDescriptions.size).toBe(1);
        expect(relationDescriptions).toStrictEqual(expectedDescription);
      });

    it('should modify the relation map when a remainingItems field is provided with a valid number',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RemainingItems),
          DF.namedNode('45'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map([[ 'ex:s',
          { subject: 'ex:path',
            value: undefined,
            remainingItems: undefined }]]);
        const expectedDescription: Map<string, IRelationDescription> = new Map([[ 'ex:s',
          { subject: 'ex:path', value: undefined, remainingItems: 45 }]]);

        buildRelations(relationDescriptions, quad);

        expect(relationDescriptions.size).toBe(1);
        expect(relationDescriptions).toStrictEqual(expectedDescription);
      });

    it('should not modify the relation map when a remainingItems field is provided with an unvalid number',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RemainingItems),
          DF.namedNode('foo'));
        const relationDescriptions: Map<string, IRelationDescription> = new Map();

        buildRelations(relationDescriptions, quad);

        expect(relationDescriptions.size).toBe(0);
      });
  });
});
