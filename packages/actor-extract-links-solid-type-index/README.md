# Comunica Solid Type Index Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-solid-type-index.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-solid-type-index)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-extract-links) actor that
collects all links to types from the [Solid type index](https://github.com/solid/solid/blob/main/proposals/data-discovery.md).

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-solid-type-index
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-solid-type-index/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#solid-type-index",
      "@type": "ActorExtractLinksSolidTypeIndex"
    }
  ]
}
```

### Config Parameters

TODO: fill in parameters (this section can be removed if there are none)

* `someParam`: Description of the param
