export type LinkTraversalOptimizationLinkFilter = (subject: string,
  value: any,
  operator: LinkTraversalFilterOperator) => boolean;

export enum LinkTraversalFilterOperator {
  GreaterThan = '>',
  GreaterThanOrEqual = '>=',

  LowerThan = '<',
  LowerThanOrEqual = '<=',

  Equal = '==',
  Not = '!'
}
