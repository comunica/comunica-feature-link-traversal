import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';
import type { IActorArgs, IActorOutput, IActorTest, Mediate, IAction } from '@comunica/core';
import { Actor } from '@comunica/core';
import type * as RDF from '@rdfjs/types';

/**
 * A comunica actor for extract-links events.
 *
 * Actor types:
 * * Input:  IActionExtractLinks:      Metdata from which links can be extracted.
 * * Test:   <none>
 * * Output: IActorExtractLinksOutput: The extracted links.
 *
 * @see IActionExtractLinks
 * @see IActorExtractLinksOutput
 */
export abstract class ActorExtractLinks extends Actor<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  /**
   * @param args - @defaultNested {<default_bus> a <cc:components/Bus.jsonld#Bus>} bus
   */
  public constructor(args: IActorExtractLinksArgs) {
    super(args);
  }

  /**
   * A helper function to append links based on incoming quads.
   * @param metadata A metadata stream of quads.
   * @param onQuad A callback that will be invoked for each quad in the metadata stream.
   *               The second argument is the array of links that can be appended to.
   */
  public static collectStream(
    metadata: RDF.Stream,
    onQuad: (quad: RDF.Quad, links: ILink[]) => void,
  ): Promise<ILink[]> {
    return new Promise((resolve, reject) => {
      const links: ILink[] = [];

      // Forward errors
      metadata.on('error', reject);

      // Invoke callback on each metadata quad
      metadata.on('data', (quad: RDF.Quad) => onQuad(quad, links));

      // Resolve to discovered links
      metadata.on('end', () => {
        resolve(links);
      });
    });
  }
}

export interface IActionExtractLinks extends IAction {
  /**
   * The page URL from which the quads were retrieved.
   */
  url: string;
  /**
   * The stream of quads to extract links from.
   */
  metadata: RDF.Stream;
  /**
   * The time it took to request the page in milliseconds.
   * This is the time until the first byte arrives.
   */
  requestTime: number;
  /**
   * The headers of the page.
   */
  headers?: Headers;
}

export interface IActorExtractLinksOutput extends IActorOutput {
  /**
   * The links to follow.
   */
  links: ILink[];
  /**
   * The conditional links.
   */
  linksConditional?: ILink[];
}

export type IActorExtractLinksArgs = IActorArgs<
IActionExtractLinks,
IActorTest,
IActorExtractLinksOutput
>;

export type MediatorExtractLinks = Mediate<
IActionExtractLinks,
IActorExtractLinksOutput
>;
