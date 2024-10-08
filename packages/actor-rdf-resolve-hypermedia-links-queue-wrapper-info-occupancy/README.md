# Comunica Wrapper Info Occupancy RDF Resolve Hypermedia Links Queue Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-info-occupancy)

**Warning: Should not be used in production or in a browser environment**

A comunica Wrapper Info Occupancy RDF Resolve Hypermedia Links Queue Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

This link queue wrapper collects information about the occupancy of the underlying link queues and logs it using a [comunica loggers](https://comunica.dev/docs/query/advanced/logging/) defined by the user. It is preferable to use the [`@comunica/logger-bunyan`](https://github.com/comunica/comunica/tree/master/packages/logger-bunyan).

The [`comunica-link-queue-parser-rs`](https://github.com/constraintAutomaton/comunica-link-queue-parser-rs) tie-in software can interpret the link queue event and output it as a JSON in the console and/or a file. An example output is presented below.

```json
{
  "SELECT ?messageId ?messageCreationDate ?messageContent WHERE {\\n  ?message <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasCreator> <https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/card#me>.\\n  ?message <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/Post>.\\n  ?message <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/content> ?messageContent.\\n  ?message <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/creationDate> ?messageCreationDate.\\n  ?message <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/id> ?messageId.\\n}": {
    "push": [
      {
        "url": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/",
        "producedByActor": {
          "name": "urn:comunica:default:extract-links/actors#predicates-solid",
          "metadata": {
            "predicates": [
              "http://www.w3.org/ns/pim/space#storage"
            ],
            "matchingPredicate": "http://www.w3.org/ns/pim/space#storage",
            "checkSubject": true
          }
        },
        "timestamp": 1718631765370,
        "parent": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/card",
        "queue": {
          "size": 1,
          "push": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1
          },
          "pop": {}
        }
      },
      {
        "url": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/",
        "producedByActor": {
          "name": "urn:comunica:default:extract-links/actors#predicates-ldp",
          "metadata": {
            "predicates": [
              "http://www.w3.org/ns/ldp#contains"
            ],
            "matchingPredicate": "http://www.w3.org/ns/ldp#contains",
            "checkSubject": true
          }
        },
        "timestamp": 1718631765472,
        "parent": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/",
        "queue": {
          "size": 1,
          "push": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 1
          },
          "pop": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1
          }
        }
      },
      {
        "url": "https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/data/forum00000000755914244125",
        "producedByActor": {
          "name": "urn:comunica:default:extract-links/actors#predicates-common",
          "metadata": {
            "predicates": [
              "http://www.w3.org/2000/01/rdf-schema#seeAlso",
              "http://www.w3.org/2002/07/owl##sameAs",
              "http://xmlns.com/foaf/0.1/isPrimaryTopicOf"
            ],
            "matchingPredicate": "http://www.w3.org/2000/01/rdf-schema#seeAlso",
            "checkSubject": false
          }
        },
        "timestamp": 1718631766440,
        "parent": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/posts/2011-11-17",
        "queue": {
          "size": 1,
          "push": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 91,
            "urn:comunica:default:extract-links/actors#predicates-common": 32
          },
          "pop": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 91,
            "urn:comunica:default:extract-links/actors#predicates-common": 31
          }
        }
      }
    ],
    "pop": [
      {
        "url": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/",
        "producedByActor": {
          "name": "urn:comunica:default:extract-links/actors#predicates-solid",
          "metadata": {
            "predicates": [
              "http://www.w3.org/ns/pim/space#storage"
            ],
            "matchingPredicate": "http://www.w3.org/ns/pim/space#storage",
            "checkSubject": true
          }
        },
        "timestamp": 1718631765370,
        "queue": {
          "size": 0,
          "push": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1
          },
          "pop": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1
          }
        }
      },
      {
        "url": "https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/",
        "producedByActor": {
          "name": "urn:comunica:default:extract-links/actors#predicates-ldp",
          "metadata": {
            "predicates": [
              "http://www.w3.org/ns/ldp#contains"
            ],
            "matchingPredicate": "http://www.w3.org/ns/ldp#contains",
            "checkSubject": true
          }
        },
        "timestamp": 1718631765473,
        "queue": {
          "size": 4,
          "push": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 5
          },
          "pop": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 1
          }
        }
      },
      {
        "url": "https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/data/forum00000000755914244125",
        "producedByActor": {
          "name": "urn:comunica:default:extract-links/actors#predicates-common",
          "metadata": {
            "predicates": [
              "http://www.w3.org/2000/01/rdf-schema#seeAlso",
              "http://www.w3.org/2002/07/owl##sameAs",
              "http://xmlns.com/foaf/0.1/isPrimaryTopicOf"
            ],
            "matchingPredicate": "http://www.w3.org/2000/01/rdf-schema#seeAlso",
            "checkSubject": false
          }
        },
        "timestamp": 1718631766440,
        "queue": {
          "size": 0,
          "push": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 91,
            "urn:comunica:default:extract-links/actors#predicates-common": 32
          },
          "pop": {
            "urn:comunica:default:extract-links/actors#predicates-solid": 1,
            "urn:comunica:default:extract-links/actors#predicates-ldp": 91,
            "urn:comunica:default:extract-links/actors#predicates-common": 32
          }
        }
      }
    ]
  }
}
```

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
      "@type": "ActorRdfResolveHypermediaLinksQueueWrapperInfoOccupancy",
      "mediatorRdfResolveHypermediaLinksQueue": { "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/mediators#main" }
    }
  ]
}
```
**It is preferable that the actor is the last called on the bus by specifying an `beforeActors` adequately.**
