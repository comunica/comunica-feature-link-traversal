import type {
  IActionExtractLinks,
  IActorExtractLinksOutput,
  IActorExtractLinksArgs,
} from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import { KeysExtractLinksTree } from '@comunica/context-entries-link-traversal';
import type { IActorTest, TestResult } from '@comunica/core';
import { passTestVoid } from '@comunica/core';
import type { ILink } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * A comunica Extract Links Tree Extract Links Actor.
 */
export class ActorExtractLinksTree extends ActorExtractLinks {
  public static readonly aNodeType = DF.namedNode('https://w3id.org/tree#node');
  public static readonly aRelation = DF.namedNode('https://w3id.org/tree#relation');
  public static readonly aView = DF.namedNode('https://w3id.org/tree#view');
  public static readonly aSubset = DF.namedNode('http://rdfs.org/ns/void#subset');
  public static readonly isPartOf = DF.namedNode('http://purl.org/dc/terms/isPartOf');

  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  public async test(_action: IActionExtractLinks): Promise<TestResult<IActorTest>> {
    return passTestVoid();
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, reject) => {
      const strictModeFlag: boolean | undefined =
        action.context.get(KeysExtractLinksTree.strictTraversal);
      const strictMode = strictModeFlag ?? true;
      const metadata = action.metadata;
      const currentNodeUrl = action.url;
      // The relation node value and the subject of the relation are the values of the map
      const relationNodeSubject: Map<string, string> = new Map();
      const nodeLinks: [string, string][] = [];
      const links: ILink[] = [];
      const effectiveTreeDocumentSubject: Set<string> = new Set();

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) =>
        this.getTreeQuadsRawRelations(
          quad,
          currentNodeUrl,
          relationNodeSubject,
          nodeLinks,
          effectiveTreeDocumentSubject,
          strictMode,
        ));

      // Resolve to discovered links
      metadata.on('end', () => {
        // If we are not in the loose mode then the subject of the page is the URL
        if (effectiveTreeDocumentSubject.size === 0) {
          effectiveTreeDocumentSubject.add(currentNodeUrl);
        }

        // Validate if the nodes forward have the current node has implicit subject
        for (const [ nodeValue, link ] of nodeLinks) {
          const subjectOfRelation = relationNodeSubject.get(nodeValue);
          if (subjectOfRelation && effectiveTreeDocumentSubject.has(subjectOfRelation)
          ) {
            links.push({ url: link, metadata: { producedByActor: { name: this.name }}});
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
    strictMode: boolean,
  ): void {
    if (
      (!strictMode || quad.subject.value === url) &&
      (quad.predicate.equals(ActorExtractLinksTree.aView) ||
        quad.predicate.equals(ActorExtractLinksTree.aSubset))) {
      rootNodeEffectiveSubject.add(quad.object.value);
    }

    if (
      (!strictMode || quad.object.value === url) &&
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
