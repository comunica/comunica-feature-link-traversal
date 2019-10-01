import {ActorRdfMetadataExtract} from "@comunica/bus-rdf-metadata-extract";
import {Bus} from "@comunica/core";
import {ActorRdfMetadataExtractTraverseAll} from "../lib/ActorRdfMetadataExtractTraverseAll";

describe('ActorRdfMetadataExtractTraverseAll', () => {
  let bus;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfMetadataExtractTraverseAll module', () => {
    it('should be a function', () => {
      expect(ActorRdfMetadataExtractTraverseAll).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfMetadataExtractTraverseAll constructor', () => {
      expect(new (<any> ActorRdfMetadataExtractTraverseAll)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtractTraverseAll);
      expect(new (<any> ActorRdfMetadataExtractTraverseAll)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfMetadataExtract);
    });

    it('should not be able to create new ActorRdfMetadataExtractTraverseAll objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfMetadataExtractTraverseAll)(); }).toThrow();
    });
  });

  describe('An ActorRdfMetadataExtractTraverseAll instance', () => {
    let actor: ActorRdfMetadataExtractTraverseAll;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseAll({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
