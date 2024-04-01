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
* `onlyMatchingTypes`: If only those type index entries matching with the current query should be considered. If false, all links within the type index entries will be followed. Defaults to true.
* `actorInitQuery`: An instance of [ActorInitQuery](https://github.com/comunica/comunica/tree/master/packages/actor-init-query), defaults to `urn:comunica:default:init/actors#query`.
* `mediatorDereferenceRdf`: A mediator over the [Dereference RDF bus](https://github.com/comunica/comunica/tree/master/packages/bus-dereference-rdf).

### How it works

If the `onlyMatchingTypes` option is true (which it is by default), then only those type links will be extracted
that match with at least one pattern within the query.

For example, assuming the following type index contents:
```turtle
@prefix : <#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix bookm: <http://www.w3.org/2002/01/bookmark#>.

:id1566207550642
    a solid:TypeRegistration;
    solid:forClass bookm:Bookmark;
    solid:instance <bookmarks.ttl>.
```

The link to `bookmarks.ttl` will _only_ be followed
if the query requests contains the `_:any rdf:type bookm:Bookmark` pattern.
For example, the link will be followed for the following query:

```sparql
PREFIX bookm: <http://www.w3.org/2002/01/bookmark#>

SELECT * WHERE {
  ?bookmark a bookm:Bookmark;
    bookm:hasTopic ?topic.
}

```
