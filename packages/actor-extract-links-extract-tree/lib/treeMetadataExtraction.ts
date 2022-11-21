import type { ITreeRelation, ITreeRelationRaw, RelationOperator } from '@comunica/types-link-traversal';
import { TreeNodes, RelationOperatorReversed } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';

/**
 * Materialize a raw tree relation using the captured values.
 * @param relationRaw Raw representation of a tree relation.
 * @param nextLink Link to the next page.
 * @returns ITreeRelation
 */
export function materializeTreeRelation(
  relationRaw: ITreeRelationRaw,
  nextLink: string,
): ITreeRelation {
  const relation: ITreeRelation = { node: nextLink };
  if (relationRaw?.operator) {
    relation.type = relationRaw.operator[0];
  }

  if (relationRaw?.remainingItems) {
    relation.remainingItems = relationRaw.remainingItems[0];
  }

  if (relationRaw?.subject) {
    relation.path = relationRaw.subject[0];
  }

  if (relationRaw?.value) {
    relation.value = {
      value: relationRaw.value[0],
      term: relationRaw.value[1],
    };
  }

  return relation;
}

// TODO: add doc
export function buildRelations(
  quad: RDF.Quad,
): [RelationOperator | number | string, keyof ITreeRelationRaw] | undefined {
  if (quad.predicate.value === TreeNodes.RDFTypeNode) {
    console.log(RelationOperatorReversed);
    // Set the operator of the relation
    const operator: RelationOperator | undefined = RelationOperatorReversed.get(quad.object.value);
    if (typeof operator !== 'undefined') {
      return [ operator, 'operator' ];
    }
  } else if (quad.predicate.value === TreeNodes.Path) {
    // Set the subject of the relation condition
    return [ quad.object.value, 'subject' ];
  } else if (quad.predicate.value === TreeNodes.Value) {
    // Set the value of the relation condition
    return [ quad.object.value, 'value' ];
  } else if (quad.predicate.value === TreeNodes.RemainingItems) {
    const remainingItems = Number.parseInt(quad.object.value, 10);
    if (!Number.isNaN(remainingItems)) {
      return [ remainingItems, 'remainingItems' ];
    }
  }
  return undefined;
}
/**
 * Update the relationDescriptions with the new quad value
 * @param {Map<string, ITreeRelationRaw>} relationDescriptions - Maps relationship identifiers to their description.
 * @param {RDF.Quad} quad - Current quad of the steam.
 * @param {RelationOperator | number | string} value - Current description value fetch
 * @param {keyof ITreeRelationRaw} key - Key associated with the value.
 */
export function addRelationDescription(
  relationDescriptions: Map<string, ITreeRelationRaw>,
  quad: RDF.Quad,
  value: RelationOperator | number | string,
  key: keyof ITreeRelationRaw,
): void {
  const rawRelation: ITreeRelationRaw = relationDescriptions?.get(quad.subject.value) || {};
  rawRelation[key] = [ value, quad ];

  relationDescriptions.set(quad.subject.value, rawRelation);
}

