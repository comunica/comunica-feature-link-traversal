import {ActorRdfMetadataExtract} from "@comunica/bus-rdf-metadata-extract";
import {Bus} from "@comunica/core";
import {ActorRdfMetadataExtractTraverseQuadPattern} from "../lib/ActorRdfMetadataExtractTraverseQuadPattern";

describe('ActorRdfMetadataExtractTraverseQuadPattern', () => {
  let bus;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfMetadataExtractTraverseQuadPattern module', () => {
    it('should be a function', () => {
      expect(ActorRdfMetadataExtractTraverseQuadPattern).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfMetadataExtractTraverseQuadPattern constructor', () => {
      expect(new (<any> ActorRdfMetadataExtractTraverseQuadPattern)({ name: 'actor', bus })).toBeInstanceOf(ActorRdfMetadataExtractTraverseQuadPattern);
      expect(new (<any> ActorRdfMetadataExtractTraverseQuadPattern)({ name: 'actor', bus })).toBeInstanceOf(ActorRdfMetadataExtract);
    });

    it('should not be able to create new ActorRdfMetadataExtractTraverseQuadPattern objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfMetadataExtractTraverseQuadPattern)(); }).toThrow();
    });
  });

  describe('An ActorRdfMetadataExtractTraverseQuadPattern instance', () => {
    let actor: ActorRdfMetadataExtractTraverseQuadPattern;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTraverseQuadPattern({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
