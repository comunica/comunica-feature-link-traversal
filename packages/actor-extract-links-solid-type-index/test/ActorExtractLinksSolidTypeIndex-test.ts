import { Bus } from '@comunica/core';
import { ActorExtractLinksSolidTypeIndex } from '../lib/ActorExtractLinksSolidTypeIndex';

describe('ActorExtractLinksSolidTypeIndex', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorExtractLinksSolidTypeIndex instance', () => {
    let actor: ActorExtractLinksSolidTypeIndex;

    beforeEach(() => {
      actor = new ActorExtractLinksSolidTypeIndex({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test(<any>{})).resolves.toBeTruthy();
    });

    it('should run', () => {
      return expect(actor.run(<any> {})).resolves.toMatchObject({ links: []});
    });
  });
});
