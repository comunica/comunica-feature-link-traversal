import { TreeNodes, RelationOperatorReversed } from './TreeMetadata';
import type * as RDF from 'rdf-js';
import { termToString } from 'rdf-string';
import type { ITreeRelation, ITreeRelationRaw, SparqlRelationOperator } from './TreeMetadata';

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
      term: relationRaw.value[1].object,
    };
  }

  return relation;
}

/**
 * From a quad stream return a relation element if it exist
 * @param {RDF.Quad} quad - Current quad of the stream.
 * @returns {[SparqlRelationOperator | number | string, keyof ITreeRelationRaw] | undefined} The relation element
 * and the key associated with it.
 */
export function buildRelationElement(
  quad: RDF.Quad,
): [SparqlRelationOperator | number | string, keyof ITreeRelationRaw] | undefined {
  if (quad.predicate.value === TreeNodes.RDFTypeNode) {
    // Set the operator of the relation
    const operator: SparqlRelationOperator | undefined = RelationOperatorReversed.get(quad.object.value);
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
 * @param {SparqlRelationOperator | number | string} value - Current description value fetch
 * @param {keyof ITreeRelationRaw} key - Key associated with the value.
 */
export function addRelationDescription(
  relationDescriptions: Map<string, ITreeRelationRaw>,
  quad: RDF.Quad,
  value: SparqlRelationOperator | number | string,
  key: keyof ITreeRelationRaw,
): void {
  const rawRelation: ITreeRelationRaw = relationDescriptions?.get(termToString(quad.subject)) || {};
  rawRelation[key] = [ value, quad ];

  relationDescriptions.set(termToString(quad.subject), rawRelation);
}

