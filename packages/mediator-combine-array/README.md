# Comunica Mediator Combine Array

[![npm version](https://badge.fury.io/js/%40comunica%2Fmediator-combine-array.svg)](https://www.npmjs.com/package/@comunica/mediator-combine-array)

A comunica mediator that concatenates an array of all actor results.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/mediator-combine-array
```

## Configure

After installing, this mediator can be instantiated as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/mediator-combine-array/^2.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@type": "SomeActor",
      "someMediator": {
        "@id": "#mediatorRdfParseMediatypes",
        "@type": "MediatorCombineArray",
        "bus": { "@id": "ActorRdfParse:_default_bus" },
        "field": "mediaTypes"
      }
    }
  ]
}
```

### Config Parameters

* `bus`: Identifier of the bus to mediate over.
* `field`: The field name to mediate over and concat arrays in.
* `filterErrors`: Optional flag to indicate if actors that throw test errors should be filtered out of the pipeline, defaults to false.
