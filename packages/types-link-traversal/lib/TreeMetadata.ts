/**
 * Inspired from
 * https://github.com/TREEcg/tree-metadata-extraction/blob/42be38925cf6a033ddadaca5ecce929902ef1545/src/util/Util.ts
 */

import type * as RDF from 'rdf-js';

// Reference
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

export interface ITreeNode {
  // Relation of the node
  relation?: ITreeRelation[];
  // Name/URL of the node
  subject: string;
}

export interface ITreeRelation {
  // The relation operator type describe by the enum RelationOperator
  '@type'?: {
    value: string;
    quad: RDF.Quad;
  };
  // Refer to the TreeNodes of the similar name
  remainingItems?: {
    value: number;
    quad: RDF.Quad;
  };
  // Refer to the TreeNodes of the similar name
  path?: {
    value: string;
    quad: RDF.Quad;
  };
  // Refer to the TreeNodes of the similar name
  value?: {
    value: any;
    quad: RDF.Quad;
  };
  // The URL to be derefenced when this relation cannot be pruned.
  node: string ;
}

// An helper to build the relation from a stream
export interface ITreeRelationDescription {
  // Id of the blank node of the relation
  subject?: [string, RDF.Quad];
  // Refer to the TreeNodes of the similar name
  value?: any;
  // The relation operator type describe by the enum RelationOperator
  operator?: [RelationOperator, RDF.Quad];
  // Refer to the TreeNodes of the similar name
  remainingItems?: [number, RDF.Quad];
}
