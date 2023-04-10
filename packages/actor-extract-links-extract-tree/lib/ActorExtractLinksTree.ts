import type {
  IActionExtractLinks,
  IActorExtractLinksOutput,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorTest, IActorArgs } from '@comunica/core';
import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');
  private static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly aView = DF.namedNode('https://w3id.org/tree#view');
  public static readonly aSubset = DF.namedNode('http://rdfs.org/ns/void#subset');
  public static readonly isPartOf = DF.namedNode('http://purl.org/dc/terms/isPartOf');

  private readonly looseMode: boolean = false;

  public constructor(args: IActorExtractLinksTreeArgs) {
    super(args);
    if (args.loose !== undefined) {
      this.looseMode = args.loose;
    }
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, reject) => {
      const metadata = action.metadata;
      const currentNodeUrl = action.url;
      const pageRelationNodes: Map<string, string> = new Map();
      const nodeLinks: [string, string][] = [];
      const links: ILink[] = [];
      const rootNodeEffectiveSubject: Set<string> = new Set();

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) =>
        this.getTreeQuadsRawRelations(quad,
          currentNodeUrl,
          pageRelationNodes,
          nodeLinks,
          rootNodeEffectiveSubject));

      // Resolve to discovered links
      metadata.on('end', () => {
        // If we are not in the loose mode then the subject of the page is the URL
        if (rootNodeEffectiveSubject.size === 0) {
          rootNodeEffectiveSubject.add(currentNodeUrl);
        }
        // If there are multiple subjects for the node, we consider that the page is inconsistent
        // and rejects all the relations. It has to be noted that we don't support owl reasoning.
        if (rootNodeEffectiveSubject.size === 1) {
          // Validate if the nodes forward have the current node has implicit subject
          for (const [ nodeValue, link ] of nodeLinks) {
            const subjectOfRelation = pageRelationNodes.get(nodeValue);
            if (subjectOfRelation && rootNodeEffectiveSubject.has(subjectOfRelation)
            ) {
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
    pageRelationNodes: Map<string, string>,
    nodeLinks: [string, string][],
    rootNodeEffectiveSubject: Set<string>,
  ): void {
    if (
      (this.looseMode || !this.looseMode && quad.subject.value === url) &&
      (quad.predicate.equals(ActorExtractLinksTree.aView) ||
      quad.predicate.equals(ActorExtractLinksTree.aSubset))) {
      rootNodeEffectiveSubject.add(quad.object.value);
    }

    if (
      (this.looseMode || !this.looseMode && quad.object.value === url) &&
    quad.predicate.equals(ActorExtractLinksTree.isPartOf)) {
      rootNodeEffectiveSubject.add(quad.subject.value);
    }

    if (quad.predicate.equals(ActorExtractLinksTree.aRelation)) {
      // If it's a relation of the current node
      pageRelationNodes.set(quad.object.value, quad.subject.value);
    }

    // If it's a node forward
    if (quad.predicate.equals(ActorExtractLinksTree.aNodeType)) {
      nodeLinks.push([ quad.subject.value, quad.object.value ]);
    }
  }
}

export interface IActorExtractLinksTreeArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * If true, then during the traversal of TREE document
   * regardless if the subject of the relation is the URL of the page
   * we still consider the relations.
   * This option exist because there are multiple TREE document that doesn't respect this rule.
   * @default {false}
   */
  loose: boolean;
}
