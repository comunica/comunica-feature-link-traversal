# Comunica Set Seed Sources Quadpattern IRIs Optimize Query Operation Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-optimize-query-operation-set-seed-sources-quadpattern-iris.svg)](https://www.npmjs.com/package/@comunica/actor-optimize-query-operation-set-seed-sources-quadpattern-iris)

A comunica Set Seed Sources Quadpattern IRIs Optimize Query Operation Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-optimize-query-operation-set-seed-sources-quadpattern-iris
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-optimize-query-operation-set-seed-sources-quadpattern-iris/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "config-setsslt:set-seeds.json#mySeedSetter",
      "@type": "ActorOptimizeQueryOperationSetSeedSourcesQuadpatternIris",
      "mediatorQuerySourceIdentify": { "@id": "urn:comunica:default:query-source-identify/mediators#main" }
    }
  ]
}
```

### Config Parameters

* `mediatorQuerySourceIdentify`: A mediator over the [Query Source Identify bus](https://github.com/comunica/comunica/tree/master/packages/bus-query-source-identify).
* `extractSubjects`: If IRIs should be extracted from subject positions. (default `true`)
* `extractPredicates`: If IRIs should be extracted from predicate positions. (default `false`)
* `extractObjects`: If IRIs should be extracted from object positions. (default `true`)
* `extractGraphs`: If IRIs should be extracted from graph positions. (default `true`)
* `extractVocabIris`: If object IRIs should be extracted if the predicate is rdf:type. (default `false`)
