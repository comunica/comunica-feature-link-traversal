# Comunica Memory Factory Aggregated Store Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-factory-aggregated-store-memory.svg)](https://www.npmjs.com/package/@comunica/actor-factory-aggregated-store-memory)

An [Aggregated Store Factory](https://github.com/comunica/comunica/tree/master/packages/bus-factory-aggregated-store) actor that
constructs a memory-based aggregated store.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-factory-aggregated-store-memory
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-factory-aggregated-store-memory/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:factory-aggregated-store/actors#memory",
      "@type": "ActorAggregatedStoreFactoryMemory",
      "mediatorMetadataAccumulate": { "@id": "urn:comunica:default:rdf-metadata-accumulate/mediators#main" }
    }
  ]
}
```

### Config Parameters

* `emitPartialCardinalities`: Indicates whether the store should emit updated partial cardinalities for each matching quad.
* `mediatorMetadataAccumulate`: A mediator over the [Metadata Accumulate bus](https://github.com/comunica/comunica/tree/master/packages/bus-metadata-accumulate).
