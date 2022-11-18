import type { ITreeRelation, ITreeRelationRaw } from '@comunica/types-link-traversal';
import { RelationOperator, RelationOperatorReversed, TreeNodes } from '@comunica/types-link-traversal';
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
    relation.type = {
      value: relationRaw.operator[0],
      quad: relationRaw.operator[1],
    };
  }

  if (relationRaw?.remainingItems) {
    relation.remainingItems = {
      value: relationRaw.remainingItems[0],
      quad: relationRaw.remainingItems[1],
    };
  }

  if (relationRaw?.subject) {
    relation.path = {
      value: relationRaw.subject[0],
      quad: relationRaw.subject[1],
    };
  }

  if (relationRaw?.value) {
    relation.value = {
      value: relationRaw.value[0],
      quad: relationRaw.value[1],
    };
  }

  return relation;
}

// TODO: add doc
export function buildRelations(
  relationDescriptions: Map<string, ITreeRelationRaw>, // TODO: remove this param, and return ITreeRelationRaw | undefined instead.
  quad: RDF.Quad,
): void {
  if (quad.predicate.value === TreeNodes.RDFTypeNode) {
    // Set the operator of the relation
    //const operator = RelationOperatorReversed[quad.object.value]; // TODO: make sure this happens in constant time
    const enumIndexOperator = (<string[]> Object.values(RelationOperator)).indexOf(quad.object.value);
    const operator: RelationOperator | undefined =
        enumIndexOperator === -1 ? undefined : Object.values(RelationOperator)[enumIndexOperator];

    if (typeof operator !== 'undefined') {
      addRelationDescription({ relationDescriptions, quad, operator });
    }
  } else if (quad.predicate.value === TreeNodes.Path) {
    // Set the subject of the relation condition
    addRelationDescription({
      relationDescriptions,
      quad,
      subject: quad.object.value,
    });
  } else if (quad.predicate.value === TreeNodes.Value) {
    // Set the value of the relation condition
    addRelationDescription({ relationDescriptions, quad, value: quad.object.value });
  } else if (quad.predicate.value === TreeNodes.RemainingItems) {
    const remainingItems = Number.parseInt(quad.object.value, 10);
    if (!Number.isNaN(remainingItems)) {
      addRelationDescription({ relationDescriptions, quad, remainingItems });
    }
  }
}
/**
 * TODO: update docs
 * @param rawRelations: Map<string, IRelationDescription>
 * @param quad: RDF.Quad
 * @param value?: string
 * @param subject?: string
 * @param operator?: RelationOperator
 * @param remainingItems?: number
 * from a quad capture the TREE relation information and put it into
 * a IRelationDescription map
 */
export function addRelationDescription({
  rawRelations,
  quad,
  value,
  subject,
  operator,
  remainingItems,
}: {
  rawRelations: Map<string, ITreeRelationRaw>;
  quad: RDF.Quad;
  value?: string;
  subject?: string;
  operator?: RelationOperator;
  remainingItems?: number;
}): void {
  const rawRelation: ITreeRelationRaw = rawRelations?.get(quad.subject.value) || {};
  /* eslint-disable prefer-rest-params */
  const objectArgument = arguments[0]; // TODO: make explicit
  for (const [ arg, val ] of Object.entries(objectArgument)) {
    if (val && arg !== 'relationDescriptions' && arg !== 'quad') {
      rawRelation[<keyof typeof rawRelation>arg] = [ val, quad ];
      break;
    }
  }
  /* eslint-enable prefer-rest-params */
  rawRelations.set(quad.subject.value, rawRelation);
}
