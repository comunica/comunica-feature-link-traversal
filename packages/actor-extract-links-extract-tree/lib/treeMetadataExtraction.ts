import type * as RDF from 'rdf-js';
import type { IRelation, IRelationDescription } from '@comunica/types-link-traversal';
import { RelationOperator, TreeNodes } from '@comunica/types-link-traversal';

export function collectRelation(
  relationDescription: IRelationDescription,
  nodeLinks: string,
): IRelation {
  const relation: IRelation = {node: nodeLinks};
  const typeRelation = typeof relationDescription.operator !== 'undefined'? (
   typeof relationDescription.operator[0] !== 'undefined'? relationDescription.operator[0]: undefined): undefined;
  if (typeof typeRelation !== 'undefined' && typeof relationDescription.operator !== 'undefined'){
    relation['@type'] = {
      value: <string> typeRelation,
      quad: relationDescription.operator[1],
    }
  }
  const remainingItems = typeof relationDescription.remainingItems !== 'undefined'?(
    typeof relationDescription.remainingItems[0] !== 'undefined'? relationDescription.remainingItems[0]: undefined):undefined;
  if (typeof remainingItems !== 'undefined' && typeof relationDescription.remainingItems !== 'undefined') {
    relation.remainingItems = {
      value: remainingItems,
      quad: relationDescription.remainingItems[1]
    }
  }

  const path = typeof relationDescription.subject !== 'undefined'?(
    typeof relationDescription.subject[0] !=='undefined'? relationDescription.subject[0]: undefined):undefined;
  if (typeof path !== 'undefined' && typeof relationDescription.subject !== 'undefined') {
    relation.path = {
      value: path,
      quad: relationDescription.subject[1]
    }
  }

  const value = typeof relationDescription.value !== 'undefined'?(
    typeof relationDescription.value[0] !== 'undefined'? relationDescription.value[0]: undefined):undefined;
  if (typeof value !== 'undefined' && typeof relationDescription.value!== 'undefined'){
    relation.value = {
      value:value,
      quad: relationDescription.value[1]
    }
  }

  return relation
  
}

export function buildRelations(
  relationDescriptions: Map<string, IRelationDescription>,
  quad: RDF.Quad): void {
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
  value?: string;
  subject?: string;
  operator?: RelationOperator;
  remainingItems?: number;
}): void {
  const currentDescription: IRelationDescription | undefined = relationDescriptions.get(quad.subject.value);
  if (typeof currentDescription === 'undefined') {
    relationDescriptions.set(quad.subject.value, {
      value:typeof value !== 'undefined'?[value, quad]:undefined, 
      subject: typeof subject !== 'undefined'? [subject, quad]: undefined, 
      operator:typeof operator !== 'undefined'?[operator, quad]: undefined, 
      remainingItems: typeof remainingItems !== 'undefined'?[remainingItems, quad]: undefined, 
    });
  } else {
    /* eslint-disable prefer-rest-params */
    const newDescription: IRelationDescription = currentDescription;
    const objectArgument = arguments[0];
    for (const [ arg, val ] of Object.entries(objectArgument)) {
      if (typeof val !== 'undefined' && arg !== 'relationDescriptions' && arg !== 'quad') {
        newDescription[<keyof typeof currentDescription>arg] = [val, quad];
        break;
      }
    }
    /* eslint-enable prefer-rest-params */
  }
}
