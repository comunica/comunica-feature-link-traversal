import type {
  IActionExtractLinks,
  IActorExtractLinksOutput,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysExtractLinksTree } from '@comunica/context-entries-link-traversal';
import type { IActorTest, IActorArgs } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { termToString } from 'rdf-string';
import { filterNode } from './filterNode';
import { isBooleanExpressionTreeRelationFilterSolvable } from './solver';
import type { ITreeRelationRaw, ITreeRelation, SparqlRelationOperator, ITreeNode } from './TreeMetadata';
import { TreeNodes, RelationOperatorReversed } from './TreeMetadata';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  private readonly filterPruning: boolean = true;
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');
  public static readonly aView = DF.namedNode('https://w3id.org/tree#view');
  public static readonly aSubset = DF.namedNode('http://rdfs.org/ns/void#subset');
  public static readonly isPartOf = DF.namedNode('http://purl.org/dc/terms/isPartOf');

  public constructor(args: IActorExtractLinksTreeArgs) {
    super(args);
    this.filterPruning = args.filterPruning === undefined ?
      true :
      args.filterPruning;
  }

  public async test(_: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public isUsingfilterPruning(): boolean {
    return this.filterPruning;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, reject) => {
      const strictModeFlag: boolean | undefined =
        action.context.get(KeysExtractLinksTree.strictTraversal);
      const strictMode = strictModeFlag === undefined ? true : strictModeFlag;
      const metadata = action.metadata;

      // Maps tree:Relation id to their description.
      const relationDescriptions: Map<string, ITreeRelationRaw> = new Map();
      const relations: ITreeRelation[] = [];
      const currentNodeUrl = action.url;
      // The tree:Relation id and the subject of the node.
      const relationNodeSubject: Map<string, string> = new Map();
      // The subject of the node and the next link.
      const nodeLinks: [string, string][] = [];
      // The subjects of the node that is linked to tree:relation considering the type of node.
      const effectiveTreeDocumentSubject: Set<string> = new Set();

      // Forward errors
      metadata.on('error', reject);

      // Collect information about relationships spread over quads, so that we can materialized them afterwards.
      metadata.on('data', (quad: RDF.Quad) =>
        this.interpretQuad(
          quad,
          currentNodeUrl,
          relationNodeSubject,
          nodeLinks,
          effectiveTreeDocumentSubject,
          relationDescriptions,
          strictMode,
        ));

      // Materialized the tree:Relation, prune them if necessary and fill the link queue.
      metadata.on('end', async() => {
        // If we are not in the un-strict then the subject of the page is the URL.
        if (effectiveTreeDocumentSubject.size === 0) {
          effectiveTreeDocumentSubject.add(currentNodeUrl);
        }

        // Materialize the tree:Relation by considering if they are attached to the subject(s) of the node
        for (const [ relationId, link ] of nodeLinks) {
          const subjectOfRelation = relationNodeSubject.get(relationId);
          if (subjectOfRelation && effectiveTreeDocumentSubject.has(subjectOfRelation)) {
            const relationDescription = relationDescriptions.get(relationId);
            relations.push(
              ActorExtractLinksTree.materializeTreeRelation(relationDescription || {}, link),
            );
          }
        }

        // Prune the link based on satisfiability of the combination of the SPARQL filter and the tree:Relation
        // equation.
        const node: ITreeNode = { relation: relations, identifier: currentNodeUrl };
        let acceptedRelations = relations;
        if (this.filterPruning) {
          const filters = await this.createFilter(node, action.context);
          acceptedRelations = this.applyFilter(filters, acceptedRelations);
        }
        resolve({ links: acceptedRelations.map(el => ({ url: el.node })) });
      });
    });
  }

  /**
   * Create the filter to prune links.
   * @param {ITreeNode} node - TREE metadata
   * @param {IActionContext} context - context of the action; containing the query
   * @returns {Promise<Map<string, boolean>>} a map containing representing the filter
   */
  public async createFilter(node: ITreeNode, context: IActionContext): Promise<Map<string, boolean>> {
    return await filterNode(node, context, isBooleanExpressionTreeRelationFilterSolvable);
  }

  /**
   * Apply the filter to prune the relations.
   * @param { Map<string, boolean>} filters
   * @param {ITreeRelation[]} acceptedRelations - the current accepted relation
   * @returns {ITreeRelation[]} the resulting relations
   */
  private applyFilter(filters: Map<string, boolean>, acceptedRelations: ITreeRelation[]): ITreeRelation[] {
    return filters.size > 0 ?
      acceptedRelations.filter(relation => filters?.get(relation.node)) :
      acceptedRelations;
  }

  /**
   * A helper function to find all the relations of a TREE document and the possible next nodes to visit.
   * The next nodes are not guaranteed to have as subject the URL of the current page,
   * so filtering is necessary afterward.
   * @param {RDF.Quad} quad - current quad
   * @param {string} url - url of the current node
   * @param {Map<string, string>} relationNodeSubject - the tree:Relation id and the subject of the node
   * @param {[string, string][]} nodeLinks - the subject of the node and the next link
   * @param {Set<string>} effectiveTreeDocumentSubject - the subjects of the node that is linked to
   *    tree:relation considering the type of node
   * @param {Map<string, ITreeRelationRaw>} relationDescriptions - the tree:Relation id associated
   *    with the relation description
   * @param {boolean} strictMode - define whether we the subject of the node should match the page URL
   */
  private interpretQuad(
    quad: RDF.Quad,
    url: string,
    relationNodeSubject: Map<string, string>,
    nodeLinks: [string, string][],
    effectiveTreeDocumentSubject: Set<string>,
    relationDescriptions: Map<string, ITreeRelationRaw>,
    strictMode: boolean,
  ): void {
    if (quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      relationNodeSubject.set(termToString(quad.object), termToString(quad.subject));
    }

    if (
      (!strictMode || quad.subject.value === url) &&
      (quad.predicate.equals(ActorExtractLinksTree.aView) ||
        quad.predicate.equals(ActorExtractLinksTree.aSubset))) {
      effectiveTreeDocumentSubject.add(termToString(quad.object));
    }

    if (
      (!strictMode || quad.object.value === url) &&
      quad.predicate.equals(ActorExtractLinksTree.isPartOf)) {
      effectiveTreeDocumentSubject.add(termToString(quad.subject));
    }

    if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeLinks.push([ termToString(quad.subject), quad.object.value ]);
    }

    const descriptionElement = ActorExtractLinksTree.buildRelationElement(quad);
    if (descriptionElement) {
      const { value, key } = descriptionElement;
      ActorExtractLinksTree.addRelationDescription(relationDescriptions, quad, value, key);
    }
  }

  /**
 * Materialize a raw tree Relation using the captured values.
 * @param {ITreeRelationRaw} relationRaw - Raw representation of a tree relation.
 * @param {string} nextLink -  Link to the next page.
 * @returns {ITreeRelation} The tree:Relation javascript object
 */
  public static materializeTreeRelation(
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
   * From a quad stream return a {@link ITreeRelationElement} if the quad refer to one.
   * For example if the quad describe the operator the tree:relation it will return
   * the value of the operator and the key operator
   * @param {RDF.Quad} quad - Current quad of the stream.
   * @returns {ITreeRelationElement | undefined} The {@link ITreeRelationElement}
   */
  public static buildRelationElement(
    quad: RDF.Quad,
  ): ITreeRelationElement | undefined {
    if (quad.predicate.value === TreeNodes.RDFTypeNode) {
      // Set the operator of the relation
      const operator: SparqlRelationOperator | undefined = RelationOperatorReversed.get(quad.object.value);
      if (typeof operator !== 'undefined') {
        return { value: operator, key: 'operator' };
      }
    } else if (quad.predicate.value === TreeNodes.Path) {
      // Set the subject of the relation condition
      return { value: quad.object.value, key: 'subject' };
    } else if (quad.predicate.value === TreeNodes.Value) {
      // Set the value of the relation condition
      return { value: quad.object.value, key: 'value' };
    } else if (quad.predicate.value === TreeNodes.RemainingItems) {
      const remainingItems = Number.parseInt(quad.object.value, 10);
      if (!Number.isNaN(remainingItems)) {
        return { value: remainingItems, key: 'remainingItems' };
      }
    }
    return undefined;
  }

  /**
   * Update the relationDescriptions with the new relevant quad value.
   * @param {Map<string, ITreeRelationRaw>} relationDescriptions - maps relationship identifiers to their description.
   * @param {RDF.Quad} quad - current quad of the steam
   * @param {SparqlRelationOperator | number | string} value - current description value fetch
   * @param {keyof ITreeRelationRaw} key - key associated with the value.
   */
  public static addRelationDescription(
    relationDescriptions: Map<string, ITreeRelationRaw>,
    quad: RDF.Quad,
    value: SparqlRelationOperator | number | string,
    key: keyof ITreeRelationRaw,
  ): void {
    const rawRelation: ITreeRelationRaw = relationDescriptions?.get(termToString(quad.subject)) || {};
    rawRelation[key] = [ value, quad ];

    relationDescriptions.set(termToString(quad.subject), rawRelation);
  }
}

export interface IActorExtractLinksTreeArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * If true (default), then we use a reachability criterion that prune links that don't respect the
   * SPARQL filter
   * @default {true}
   */
  filterPruning: boolean;
}
/**
 * An element of a TREE relation
 */
interface ITreeRelationElement{
  key: keyof ITreeRelationRaw;
  value: SparqlRelationOperator | number | string;
}
