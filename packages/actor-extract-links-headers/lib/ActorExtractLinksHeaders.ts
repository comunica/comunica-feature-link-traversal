import type { IActionExtractLinks, IActorExtractLinksOutput } from '@comunica/bus-extract-links';
import { ActorExtractLinks } from '@comunica/bus-extract-links';
import type { IActorArgs, IActorTest, TestResult } from '@comunica/core';
import { passTestVoid } from '@comunica/core';
import type { ILink } from '@comunica/types';

/**
 * A comunica Traverse Predicates RDF Link Header Actor.
 */
export class ActorExtractLinksHeaders extends ActorExtractLinks {
  private readonly headers: RegExp[];
  private readonly linkRegEx = /<(.*)>/u;

  public constructor(args: IActorExtractLinksTraverseHeadersArgs) {
    super(args);
    this.headers = args.headersRegexes.map(stringRegex => new RegExp(stringRegex, 'u'));
  }

  public async test(_action: IActionExtractLinks): Promise<TestResult<IActorTest>> {
    return passTestVoid();
  }

  public async run(action: IActionExtractLinks): Promise<IActorExtractLinksOutput> {
    return new Promise((resolve, _reject) => {
      const headers = action.headers;
      const links: ILink[] = [];

      for (const regex of this.headers) {
        const linkHeaders = headers?.get('link')?.split(',');
        if (linkHeaders) {
          for (const header of linkHeaders) {
            if (regex.test(header)) {
              const match = this.linkRegEx.exec(header);
              if (match) {
                links.push({ url: new URL(match[1], action.url).href });
              }
            }
          }
        }
      }
      resolve({ links });
    });
  }
}

export interface IActorExtractLinksTraverseHeadersArgs
  extends IActorArgs<IActionExtractLinks, IActorTest, IActorExtractLinksOutput> {
  headersRegexes: string[];
}
