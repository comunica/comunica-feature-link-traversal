// From
// https://github.com/TREEcg/tree-metadata-extraction/blob/42be38925cf6a033ddadaca5ecce929902ef1545/src/util/Util.ts
export enum RelationOperator {
  PrefixRelation = 'https://w3id.org/tree#PrefixRelation',
  SubstringRelation = 'https://w3id.org/tree#SubstringRelation',
  GreaterThanRelation = 'https://w3id.org/tree#GreaterThanRelation',
  GreaterThanOrEqualToRelation = 'https://w3id.org/tree#GreaterThanOrEqualToRelation',
  LessThanRelation = 'https://w3id.org/tree#LessThanRelation',
  LessThanOrEqualToRelation = 'https://w3id.org/tree#LessThanOrEqualToRelation',
  EqualThanRelation = 'https://w3id.org/tree#EqualThanRelation',
  GeospatiallyContainsRelation = 'https://w3id.org/tree#GeospatiallyContainsRelation',
  InBetweenRelation = 'https://w3id.org/tree#InBetweenRelation',
}

export enum TreeNodes {
  Node = 'https://w3id.org/tree#node',
  Relation = 'https://w3id.org/tree#relation',
  RDFTypeNode = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  Path = 'https://w3id.org/tree#path',
  Value = 'https://w3id.org/tree#value',
  RemainingItems = 'https://w3id.org/tree#remainingItems'
}

export interface IRelation {
  '@type'?: string;
  'remainingItems'?: number;
  'path'?: any;
  'value'?: any;
  'node': string;
  'conditionalImport'?: IConditionalImport;
}

export interface IConditionalImport {
  'path'?: string;
  'import'?: string;
  'importStream'?: string;
}

// An helper to build the relation from a stream
export interface IRelationDescription {
  subject?: string; value?: any; operator?: RelationOperator; remainingItems?: number;
}

