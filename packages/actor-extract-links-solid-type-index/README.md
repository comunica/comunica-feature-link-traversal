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
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-solid-type-index/^0.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#solid-type-index",
      "@type": "ActorExtractLinksSolidTypeIndex",
      "mediatorDereferenceRdf": { "@id": "urn:comunica:default:dereference-rdf/mediators#main" },
    }
  ]
}
```

### Config Parameters

* `typeIndexPredicates`: The type index predicate URLs that will be followed, defaults to `http://www.w3.org/ns/solid/terms#publicTypeIndex` and `http://www.w3.org/ns/solid/terms#privateTypeIndex`.
* `actorInitQuery`: An instance of [ActorInitQuery](https://github.com/comunica/comunica/tree/master/packages/actor-init-query), defaults to `urn:comunica:default:init/actors#query`.
* `mediatorDereferenceRdf`: A mediator over the [Dereference RDF bus](https://github.com/comunica/comunica/tree/master/packages/bus-dereference-rdf).
