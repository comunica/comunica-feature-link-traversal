import type * as RDF from 'rdf-js';
import type { IRelation, IRelationDescription } from './typeTreeMetadataExtraction';
import { RelationOperator, TreeNodes } from './typeTreeMetadataExtraction';

export function collectRelation(
  relationDescription: IRelationDescription,
  nodeLinks: string,
): IRelation {
  return {
    '@type': relationDescription.operator,
    remainingItems: relationDescription.remainingItems,
    path: relationDescription.subject,
    value: relationDescription.value,
    node: nodeLinks,
  };
}

export function buildRelations(relationDescriptions: Map<string, IRelationDescription>, quad: RDF.Quad): void {
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

export function addRelationDescription({
  relationDescriptions,
  quad,
  value,
  subject,
  operator,
  remainingItems,
}: {
  relationDescriptions: Map<string, IRelationDescription>;
  quad: RDF.Quad;
  value?: any;
  subject?: string | undefined;
  operator?: RelationOperator | undefined;
  remainingItems?: number | undefined;
}): void {
  const currentDescription: IRelationDescription | undefined = relationDescriptions.get(quad.subject.value);
  if (typeof currentDescription === 'undefined') {
    relationDescriptions.set(quad.subject.value, { value, subject, operator, remainingItems });
  } else {
    /* eslint-disable prefer-rest-params */
    const newDescription: IRelationDescription = currentDescription;
    const objectArgument = arguments[0];
    for (const [ arg, val ] of Object.entries(objectArgument)) {
      if (typeof val !== 'undefined' && arg !== 'relationDescriptions' && arg !== 'quad') {
        newDescription[<keyof typeof currentDescription>arg] = val;
        break;
      }
    }
    /* eslint-enable prefer-rest-params */
  }
}
