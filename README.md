<p align="center">
  <a href="https://comunica.dev/">
    <img alt="Comunica" src="https://comunica.dev/img/comunica_red.svg" width="200">
  </a>
</p>

<p align="center">
  <strong>Link Traversal for Comunica</strong>
</p>

<p align="center">
<a href="https://travis-ci.org/comunica/comunica-feature-link-traversal"><img src="https://travis-ci.org/comunica/comunica-feature-link-traversal.svg?branch=master" alt="Build Status"></a>
<a href="https://coveralls.io/github/comunica/comunica-feature-link-traversal?branch=master"><img src="https://coveralls.io/repos/github/comunica/comunica-feature-link-traversal/badge.svg?branch=master" alt="Coverage Status"></a>
<a href="https://gitter.im/comunica/Lobby"><img src="https://badges.gitter.im/comunica.png" alt="Gitter chat"></a>
</p>

**[Learn more about Comunica on our website](https://comunica.dev/).**

This is a monorepo that contains packages for allowing [Comunica](https://github.com/comunica/comunica) to link traversal-based query execution.
If you want to _use_ an Link Traversal-enabled Comunica engine, have a look at [Comunica SPARQL Link Traversal](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-init-sparql-link-traversal).

Concretely, this monorepo adds link traversal support to Comunica using the following packages:

* Seed URL actors:
    * [Seed URL preprocessor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-context-preprocess-set-seed-sources-quadpattern-iris): Actor that sets sources based on the given query, if no other sources were set.
* Query operation actors:
    * [BGP query operator](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-query-operation-bgp-traversal): Actor that handles BGP operations based on heuristics for plan selection in link traversal environments.
* Link extractors (all require [Traverse RDF Resolve Hypermedia Links Actor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-resolve-hypermedia-links-traverse)):
    * [All links extractor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-metadata-extract-traverse-all): Actor that extracts all URLs in a document for traversal.
    * [Content policies extractor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-metadata-extract-traverse-content-policies): Actor that extracts URLs matching content policies in a document for traversal.
        * _Requires [Traverse Filter Conditional RDF Resolve Hypermedia Links Actor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-resolve-hypermedia-links-traverse-replace-conditional)_
    * [Quad pattern extractor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-metadata-extract-traverse-quad-pattern): Actor that extracts all URLs that match the current quad pattern in a document for traversal.
    * [Quad pattern query extractor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-metadata-extract-traverse-quad-pattern-query): Actor that extracts all URLs that match any quad pattern in the current query in a document for traversal.
* Query termination actors:
    * [Link count limit](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count): Actor that imposes a limit of the maximum number of links that can be pushed into the link queue.
    * [Link depth limit](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-depth): Actor that imposes a limit of the depth of link paths that can be pushed into the link queue.

**Warning: All packages in this repo should be considered unstable, and breaking changes may occur at any time.**

## Development Setup

_(JSDoc: https://comunica.github.io/comunica-feature-link-traversal/)_

This repository should be used by Comunica module **developers** as it contains multiple Comunica modules that can be composed.
This repository is managed as a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)
using [Lerna](https://lernajs.io/).

If you want to develop new features
or use the (potentially unstable) in-development version,
you can set up a development environment for Comunica.

Comunica requires [Node.JS](http://nodejs.org/) 8.0 or higher and the [Yarn](https://yarnpkg.com/en/) package manager.
Comunica is tested on OSX, Linux and Windows.

This project can be setup by cloning and installing it as follows:

```bash
$ git clone https://github.com/comunica/comunica.git
$ cd comunica
$ yarn install
```

**Note: `npm install` is not supported at the moment, as this project makes use of Yarn's [workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) functionality**

This will install the dependencies of all modules, and bootstrap the Lerna monorepo.
After that, all [Comunica packages](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages) are available in the `packages/` folder
and can be used in a development environment, such as querying with [Comunica SPARQL Link Traversal (`packages/actor-init-sparql-link-traversal`)](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/actor-init-sparql-link-traversal).

Furthermore, this will add [pre-commit hooks](https://www.npmjs.com/package/pre-commit)
to build, lint and test.
These hooks can temporarily be disabled at your own risk by adding the `-n` flag to the commit command.

## License
This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/)
and released under the [MIT license](http://opensource.org/licenses/MIT).
