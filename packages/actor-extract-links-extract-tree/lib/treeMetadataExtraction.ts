import type { ITreeRelation, ITreeRelationDescription } from '@comunica/types-link-traversal';
import { RelationOperator, TreeNodes } from '@comunica/types-link-traversal';
import type * as RDF from 'rdf-js';

/**
 * @param relationDescription
 * @param nodeLinks
 * @returns IRelation
 * collect the relevant values and quad capture from a IRelationDescription object
 * to create a IRelation object
 */
export function collectRelation(
  relationDescription: ITreeRelationDescription,
  nodeLinks: string,
): ITreeRelation {
  const relation: ITreeRelation = { node: nodeLinks };
  if (relationDescription?.operator) {
    relation['@type'] = {
      value: <string> relationDescription.operator[0],
      quad: relationDescription.operator[1],
    };
  }

  if (relationDescription?.remainingItems) {
    relation.remainingItems = {
      value: relationDescription.remainingItems[0],
      quad: relationDescription.remainingItems[1],
    };
  }

  if (relationDescription?.subject) {
    relation.path = {
      value: relationDescription.subject[0],
      quad: relationDescription.subject[1],
    };
  }

  if (relationDescription?.value) {
    relation.value = {
      value: relationDescription.value[0],
      quad: relationDescription.value[1],
    };
  }

  return relation;
}

export function buildRelations(
  relationDescriptions: Map<string, ITreeRelationDescription>,
  quad: RDF.Quad,
): void {
  if (quad.predicate.value === TreeNodes.RDFTypeNode) {
    // Set the operator of the relation
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
 * @param relationDescriptions: Map<string, IRelationDescription>
 * @param quad: RDF.Quad
 * @param value?: string
 * @param subject?: string
 * @param operator?: RelationOperator
 * @param remainingItems?: number
 * from a quad capture the TREE relation information and put it into
 * a IRelationDescription map
 */
export function addRelationDescription({
  relationDescriptions,
  quad,
  value,
  subject,
  operator,
  remainingItems,
}: {
  relationDescriptions: Map<string, ITreeRelationDescription>;
  quad: RDF.Quad;
  value?: string;
  subject?: string;
  operator?: RelationOperator;
  remainingItems?: number;
}): void {
  const newDescription: ITreeRelationDescription =
  typeof relationDescriptions?.get(quad.subject.value) !== 'undefined' ?
    relationDescriptions.get(quad.subject.value)! :
    {};
  /* eslint-disable prefer-rest-params */
  const objectArgument = arguments[0];
  for (const [ arg, val ] of Object.entries(objectArgument)) {
    if (val && arg !== 'relationDescriptions' && arg !== 'quad') {
      newDescription[<keyof typeof newDescription>arg] = [ val, quad ];
      break;
    }
  }
  /* eslint-enable prefer-rest-params */
  relationDescriptions.set(quad.subject.value, newDescription);
}
