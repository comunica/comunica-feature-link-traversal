# Comunica Set Defaults Link Traversal Context Preprocess Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-context-preprocess-set-defaults-link-traversal.svg)](https://www.npmjs.com/package/@comunica/actor-context-preprocess-set-defaults-link-traversal)

An [Context Preprocess](https://github.com/comunica/comunica/tree/master/packages/bus-context-preprocess) actor
that sets `KeysQuerySourceIdentify.traverse` to true in the context, unless it was defined before.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-context-preprocess-set-defaults-link-traversal
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-context-preprocess-set-defaults-link-traversal/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:context-preprocess/actors#set-defaults-link-traversal",
      "@type": "ActorContextPreprocessSetDefaultsLinkTraversal"
    }
  ]
}
```
