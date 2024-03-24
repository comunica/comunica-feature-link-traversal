# Comunica Extract Links Tree Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-tree.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-tree)

A comunica [Extract Links](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/bus-extract-links) [TREE](https://treecg.github.io/specification/) Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-tree
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-tree/^2.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#extract-links-tree",
      "@type": "ActorExtractLinksTree"
    }
  ]
}
```
