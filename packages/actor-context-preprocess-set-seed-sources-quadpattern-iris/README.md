# Comunica Set Seed Sources Quadpattern IRIs Context Preprocess Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-context-preprocess-set-seed-sources-quadpattern-iris.svg)](https://www.npmjs.com/package/@comunica/actor-context-preprocess-set-seed-sources-quadpattern-iris)

A comunica Set Seed Sources Quadpattern IRIs Context Preprocess Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-context-preprocess-set-seed-sources-quadpattern-iris
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-context-preprocess-set-seed-sources-quadpattern-iris/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "config-setsslt:set-seeds.json#mySeedSetter",
      "@type": "ActorContextPreprocessSetSeedSourcesQuadpatternIris"
    }
  ]
}
```

### Config Parameters

* `cacpsssqi:Actor/ContextPreprocess/SetSeedSourcesQuadpatternIris#extractSubjects`: If IRIs should be extracted from subject positions.
* `cacpsssqi:Actor/ContextPreprocess/SetSeedSourcesQuadpatternIris#extractPredicates`: If IRIs should be extracted from predicate positions.
* `cacpsssqi:Actor/ContextPreprocess/SetSeedSourcesQuadpatternIris#extractObjects`: If IRIs should be extracted from object positions.
* `cacpsssqi:Actor/ContextPreprocess/SetSeedSourcesQuadpatternIris#extractGraphs`: If IRIs should be extracted from graph positions.
