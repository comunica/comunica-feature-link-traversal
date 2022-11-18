/**
 * Inspired from
 * https://github.com/TREEcg/tree-metadata-extraction/blob/42be38925cf6a033ddadaca5ecce929902ef1545/src/util/Util.ts
 */

import type * as RDF from 'rdf-js';

// The type of the relationship.
// https://treecg.github.io/specification/#vocabulary
export enum RelationOperator {
  //  All elements in the related node have this prefix
  PrefixRelation = 'https://w3id.org/tree#PrefixRelation',
  //  All elements in the related node have this substring
  SubstringRelation = 'https://w3id.org/tree#SubstringRelation',
  //  All members of this related node end with this suffix
  SuffixRelation = 'https://w3id.org/tree#SuffixRelation',
  // The related Node’s members are greater than the value. For string comparison,
  // this relation can refer to a comparison configuration
  GreaterThanRelation = 'https://w3id.org/tree#GreaterThanRelation',
  // Similar to GreaterThanRelation
  GreaterThanOrEqualToRelation = 'https://w3id.org/tree#GreaterThanOrEqualToRelation',
  // Similar to GreaterThanRelation
  LessThanRelation = 'https://w3id.org/tree#LessThanRelation',
  // Similar to GreaterThanRelation
  LessThanOrEqualToRelation = 'https://w3id.org/tree#LessThanOrEqualToRelation',
  // Similar to GreaterThanRelation
  EqualThanRelation = 'https://w3id.org/tree#EqualThanRelation',
  // A contains b iff no points of b lie in the exterior of a, and at least one point
  // of the interior of b lies in the interior of a
  // reference http://lin-ear-th-inking.blogspot.com/2007/06/subtleties-of-ogc-covers-spatial.html
  GeospatiallyContainsRelation = 'https://w3id.org/tree#GeospatiallyContainsRelation',
}
export const RelationOperatorReversed: Record<string, keyof RelationOperator> = Object.fromEntries(Object
  .entries(RelationOperator)
  .map(([ key, value ]) => [ value, key ]));

// Reference
// https://treecg.github.io/specification/#classes
// https://treecg.github.io/specification/#properties
export enum TreeNodes {
  // A tree:Node is a node that may contain links to other dereferenceable resources
  // that lead to a full overview of a tree:Collection.
  Node = 'https://w3id.org/tree#node',
  // An entity that describes a relation between two tree:Nodes.
  Relation = 'https://w3id.org/tree#relation',
  // The relation operator type describe by the enum RelationOperator
  RDFTypeNode = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  // A property path, as defined by SHACL, that indicates what resource the tree:value affects.
  // reference SHACL: https://www.w3.org/TR/shacl/
  Path = 'https://w3id.org/tree#path',
  // The contextual value of this node
  Value = 'https://w3id.org/tree#value',
  // Remaining number of items of this node, the items in its children included.
  RemainingItems = 'https://w3id.org/tree#remainingItems'
}

/**
 * A TREE HTTP document with relationships.
 */
export interface ITreeNode {
  /**
   * Page URL that identifies this node.
   */
  identifier: string;
  /**
   * All available relationships in the node.
   */
  relation?: ITreeRelation[];
}

/**
 * Represents a relationship between the members across two nodes.
 */
export interface ITreeRelation {
  /**
   * The type of relationship.
   */
  type?: {
    value: RelationOperator;
    quad: RDF.Quad; // TODO: can this be removed?
  };
  /**
   * How many members can be reached when following this relation.
   */
  remainingItems?: {
    value: number;
    quad: RDF.Quad; // TODO: can this be removed?
  };
  /**
   * A property path, as defined by SHACL, that indicates what resource the tree:value affects.
   */
  path?: {
    value: string;
    quad: RDF.Quad; // TODO: can this be removed?
  };
  /**
   * The contextual value of this node.
   */
  value?: {
    value: any;
    quad: RDF.Quad; // TODO: can this be removed? And replaced by RDF.Term
  };
  /**
   * Link to the TREE node document for this relationship.
   * This can be dereferenced.
   */
  node: string ;
}

/**
 * A temporary helper object to build the relation while reading from a stream.
 */
export interface ITreeRelationRaw {
  // Id of the blank node of the relation
  subject?: [string, RDF.Quad];
  // Refer to the TreeNodes of the similar name
  value?: any;
  // The relation operator type describe by the enum RelationOperator
  operator?: [RelationOperator, RDF.Quad];
  // Refer to the TreeNodes of the similar name
  remainingItems?: [number, RDF.Quad];
}
