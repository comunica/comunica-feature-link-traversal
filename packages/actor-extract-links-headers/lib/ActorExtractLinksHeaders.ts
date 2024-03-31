import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { ILink } from '@comunica/bus-rdf-resolve-hypermedia-links';

/**
 * A comunica Traverse Predicates RDF Link Header Actor.
 */
export class ActorExtractLinksHeaders extends ActorExtractLinks {
  private readonly headers: RegExp[];
  private readonly linkRegEx = new RegExp("<(.*)>","u");

  public constructor(args: IActorExtractLinksTraverseHeadersArgs) {
    super(args);
    this.headers = args.headersRegexes.map(stringRegex => new RegExp(stringRegex, 'u'));
  }

  public async test(action: IActionExtractLinks): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return {
      links: this.collectLinkHeaders(action.headers),
    };
  }

  private collectLinkHeaders(headers?:Headers): ILink[] {
    let links:ILink[] = [];
    for (const regex of this.headers) {
      headers?.forEach((header) => {
        if (regex.test( header)) {
          let match = header.match(this.linkRegEx);
          if(match) {
            links.push({ url: match[1] });
          }
        }  
      })
    }
    return links;
  } 
}

export interface IActorExtractLinksTraverseHeadersArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> { 
  headersRegexes: string[];
}
