import type * as ShEx from 'shexj';

export class ShapeTree {
  public constructor(
    public readonly iri: string,
    public readonly shape: ShEx.Shape,
    public readonly uriTemplate: string,
  ) {
    this.iri = iri;
    this.shape = shape;
    this.uriTemplate = uriTemplate;
  }
}
