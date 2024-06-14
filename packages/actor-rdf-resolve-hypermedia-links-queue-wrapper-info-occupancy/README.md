# Comunica Wrapper Info Occupancy RDF Resolve Hypermedia Links Queue Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy)

A comunica Wrapper Info Occupancy RDF Resolve Hypermedia Links Queue Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

This link queue wrapper's purpose is to collect information about the occupancy of the link queue in a file.
It should not be used in production or in a browser environment.
To observe non-standard properties of the link queue the `IOptionalLinkQueueParameters` can be extended and the methods can be modified to process those parameters.
## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy/^0.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/actors#wrapper-info-occupancy",
      "@type": "ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy"
    }
  ]
}
```
**It is preferable that the actor is the last called on the bus by specifying an `beforeActors` adequately.**
