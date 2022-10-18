import type {
  IActionExtractLinks,
  IActorExtractLinksOutput, IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorTest } from '@comunica/core';
import { LinkTraversalFilterOperator, LinkTraversalOptimizationLinkFilter } from '@comunica/types-link-traversal';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { KeyOptimizationLinkTraversal } from '@comunica/context-entries-link-traversal';

const DF = new DataFactory<RDF.BaseQuad>();

interface RelationDescription {
  subject: string; value: any; operator: LinkTraversalFilterOperator;
}

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');

  private static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  private static readonly aTreePath = DF.namedNode('https://w3id.org/tree#path');
  private static readonly aTreeValue = DF.namedNode('https://w3id.org/tree#value');

  private static readonly treeGreaterThan: [RDF.NamedNode, LinkTraversalFilterOperator] = [DF.namedNode('https://w3id.org/tree#GreaterThanRelation'), LinkTraversalFilterOperator.GreaterThan];
  private static readonly treeGreaterThanOrEqual: [RDF.NamedNode, LinkTraversalFilterOperator] = [DF.namedNode('https://w3id.org/tree#GreaterThanOrEqualToRelation'), LinkTraversalFilterOperator.GreaterThanOrEqual];
  private static readonly treeLessThan: [RDF.NamedNode, LinkTraversalFilterOperator] = [DF.namedNode('https://w3id.org/tree#LessThanRelation'), LinkTraversalFilterOperator.LowerThan];
  private static readonly treeLessThanEqual: [RDF.NamedNode, LinkTraversalFilterOperator] = [DF.namedNode('https://w3id.org/tree#LessThanOrEqualToRelation'), LinkTraversalFilterOperator.LowerThanOrEqual];
  private static readonly treeEqual: [RDF.NamedNode, LinkTraversalFilterOperator] = [DF.namedNode('https://w3id.org/tree#EqualToRelation'), LinkTraversalFilterOperator.Equal];

  private static readonly treeOperators: [RDF.NamedNode, LinkTraversalFilterOperator][] = [
    ActorExtractLinksTree.treeEqual,
    ActorExtractLinksTree.treeLessThanEqual,
    ActorExtractLinksTree.treeLessThan,
    ActorExtractLinksTree.treeGreaterThanOrEqual,
    ActorExtractLinksTree.treeGreaterThan,
  ];

  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, reject) => {
      const metadata = action.metadata;
      const currentNodeUrl = action.url;
      const pageRelationNodes: Set<string> = new Set();
      const relationDescriptions: Map<string, RelationDescription> = new Map();
      const nodeLinks: [string, string][] = [];
      const filterFunctions: LinkTraversalOptimizationLinkFilter[] = typeof action.context.get(KeyOptimizationLinkTraversal.filterFunctions) !== 'undefined' ?
        <LinkTraversalOptimizationLinkFilter[]>action.context.get(KeyOptimizationLinkTraversal.filterFunctions) : [];
      const links: ILink[] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) =>
        this.getTreeQuadsRawRelations(quad,
          currentNodeUrl,
          pageRelationNodes,
          nodeLinks,
          relationDescriptions));

      // Resolve to discovered links
      metadata.on('end', () => {
        // Validate if the node forward have the current node as implicit subject
        for (const [nodeValue, link] of nodeLinks) {
          if (pageRelationNodes.has(nodeValue)) {
            const relationDescription = relationDescriptions.get(nodeValue)
            if (typeof relationDescription !== 'undefined' && filterFunctions.length !== 0) {
              let addLink: boolean = true;
              for (let filter of filterFunctions) {
                if (!filter(relationDescription.subject, relationDescription.value, relationDescription.operator)) {
                  addLink = false
                }
              }
              if (addLink) {
                links.push({ url: link });
              }
            } else {
              links.push({ url: link });
            }
          }
        }
        resolve({ links });
      });
    });
  }

  /**
   * A helper function to find all the relations of a TREE document and the possible next nodes to visit.
   * The next nodes are not guaranteed to have as subject the URL of the current page,
   * so filtering is necessary afterward.
   * @param quad the current quad.
   * @param url url of the page
   * @param pageRelationNodes the url of the relation node of the page that have as subject the URL of the page
   * @param nodeLinks the url of the next potential page that has to be visited,
   *  regardless if the implicit subject is the node of the page
   */
  private getTreeQuadsRawRelations(
    quad: RDF.Quad,
    url: string,
    pageRelationNodes: Set<string>,
    nodeLinks: [string, string][],
    relationDescriptions: Map<string, RelationDescription>,
  ): void {
    // If it's a relation of the current node
    if (quad.subject.value === url && quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      pageRelationNodes.add(quad.object.value);
      // If it's a node forward
    } else if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeLinks.push([quad.subject.value, quad.object.value]);
    }
    // set the operator of the relation
    else if (quad.predicate.equals(ActorExtractLinksTree.rdfTypeNode)) {
      let operator: LinkTraversalFilterOperator = LinkTraversalFilterOperator.Equal;
      for (const treeOperator of ActorExtractLinksTree.treeOperators) {
        if (quad.object.equals(treeOperator[0])) {
          operator = treeOperator[1]
        }
      }
      this.addRelationDescription(relationDescriptions, 'operator', quad, undefined, '', operator);
    }// set the subject of the relation condition 
    else if (quad.predicate.equals(ActorExtractLinksTree.aTreePath)) {
      this.addRelationDescription(relationDescriptions, 'subject', quad, undefined, quad.object.value);
    }
    // set the value of the relation condition
    else if (quad.predicate.equals(ActorExtractLinksTree.aTreeValue)) {
      this.addRelationDescription(relationDescriptions, 'value', quad, quad.object.value);
    }
  }

  private addRelationDescription(relationDescriptions: Map<string, RelationDescription>, field: string, quad: RDF.Quad, value: any = undefined, subject: string = '', operator: LinkTraversalFilterOperator = LinkTraversalFilterOperator.Equal) {
    const newDescription = relationDescriptions.get(quad.subject.value);
    if (typeof newDescription === 'undefined') {
      relationDescriptions.set(quad.subject.value, { value: value, subject: subject, operator: operator });
    } else {
      switch (field) {
        case "value":{
          newDescription[field as keyof typeof newDescription] = value;
          break;
        }
        case "subject": {
          newDescription[field as keyof typeof newDescription] = subject;
          break;
        }
        case "operator":{
          newDescription[field as keyof typeof newDescription] = operator;
          break;
        }
      }
      relationDescriptions.set(quad.subject.value, newDescription);
    }
  }
}
