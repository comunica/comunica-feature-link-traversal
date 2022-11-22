import type { ITreeRelationRaw, ITreeRelation } from '@comunica/types-link-traversal';
import { TreeNodes, RelationOperator } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { buildRelationElement, addRelationDescription, materializeTreeRelation } from '../lib/treeMetadataExtraction';

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
    it('should return undefined when the quad don\'t respect any relation',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
        expect(buildRelationElement(quad)).toBeUndefined();
      });

    it('should return the relation element when the quad respect a relation semantic',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode(RelationOperator.EqualThanRelation));

        const res = buildRelationElement(quad);
        expect(res).toBeDefined();
        const [ value, key ] = <any> res;
        expect(key).toBe(<keyof ITreeRelationRaw> 'operator');
        expect(value).toBe(RelationOperator.EqualThanRelation);
      });

    it('should return undefined when the type does not exist',
      () => {
        const quad: RDF.Quad = DF.quad(DF.namedNode('ex:s'),
          DF.namedNode(TreeNodes.RDFTypeNode),
          DF.namedNode('foo'));

        const res = buildRelationElement(quad);
        expect(res).toBeUndefined();
      });
  });

  describe('materializeTreeRelation', () => {
    it('should materialize a tree Relation when all the raw relation are provided', () => {
      const aSubject = 'foo';
      const aValue = '0';
      const anOperator = RelationOperator.PrefixRelation;
      const aRemainingItemDefinition = 44;
      const aQuad = DF.quad(
        DF.blankNode(''),
        DF.namedNode(''),
        DF.blankNode(''),
      );
      const aNode = 'test';
      const relationRaw: ITreeRelationRaw = {
        subject: [ aSubject, aQuad ],
        value: [ aValue, aQuad ],
        operator: [ anOperator, aQuad ],
        remainingItems: [ aRemainingItemDefinition, aQuad ],
      };
      const expectedTreeRelation: ITreeRelation = {
        type: anOperator,
        remainingItems: aRemainingItemDefinition,
        path: aSubject,
        value: {
          value: aValue,
          term: aQuad.object,
        },
        node: aNode,
      };

      const res = materializeTreeRelation(relationRaw, aNode);

      expect(res).toStrictEqual(expectedTreeRelation);
    });

    it('should materialize a tree Relation when the remaining item is missing', () => {
      const aSubject = 'foo';
      const aValue = '0';
      const anOperator = RelationOperator.PrefixRelation;
      const aQuad = DF.quad(
        DF.blankNode(''),
        DF.namedNode(''),
        DF.blankNode(''),
      );
      const aNode = 'test';
      const relationRaw: ITreeRelationRaw = {
        subject: [ aSubject, aQuad ],
        value: [ aValue, aQuad ],
        operator: [ anOperator, aQuad ],
      };
      const expectedTreeRelation: ITreeRelation = {
        type: anOperator,
        path: aSubject,
        value: {
          value: aValue,
          term: aQuad.object,
        },
        node: aNode,
      };

      const res = materializeTreeRelation(relationRaw, aNode);

      expect(res).toStrictEqual(expectedTreeRelation);
    });

    it('should materialize a tree Relation when the value is missing', () => {
      const aSubject = 'foo';
      const anOperator = RelationOperator.PrefixRelation;
      const aQuad = DF.quad(
        DF.blankNode(''),
        DF.namedNode(''),
        DF.blankNode(''),
      );
      const aNode = 'test';
      const relationRaw: ITreeRelationRaw = {
        subject: [ aSubject, aQuad ],
        operator: [ anOperator, aQuad ],
      };
      const expectedTreeRelation: ITreeRelation = {
        type: anOperator,
        path: aSubject,
        node: aNode,
      };

      const res = materializeTreeRelation(relationRaw, aNode);

      expect(res).toStrictEqual(expectedTreeRelation);
    });
  });
});
