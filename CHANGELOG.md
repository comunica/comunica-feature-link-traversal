# Changelog
All notable changes to this project will be documented in this file.

<a name="v0.2.0"></a>
## [v0.2.0](https://github.com/comunica/comunica-feature-link-traversal/compare/v0.1.1...v0.2.0) - 2023-06-06

### Added
* [Allow strict-mode to be disabled for invalid TREE documents](https://github.com/comunica/comunica-feature-link-traversal/commit/83347a600a460104f332f69d511b012860e03a78)
* [Add adaptive destroy join actor](https://github.com/comunica/comunica-feature-link-traversal/commit/942fc8b3ad9ba35f0e810931b15de8beeaa81d23)
* [Add skipAdaptiveJoin context entry](https://github.com/comunica/comunica-feature-link-traversal/commit/2fe9b14f801873ecf3d7e8ca5ce43c03dd461910)
* [Add adaptive Solid config](https://github.com/comunica/comunica-feature-link-traversal/commit/824731e73c64db946f767f9f40de46218f7ac2bd)

### Changed
* [Update to Comunica 2.7](https://github.com/comunica/comunica-feature-link-traversal/commit/643c76e0065ce9de88eb1ad26f76f121e3758d97)

### Fixed
* [Fix Solid auth not working due to invalid baseURL](https://github.com/comunica/comunica-feature-link-traversal/commit/31db332993b11dd45a30ce6bd3735385c98979b7)

<a name="v0.1.1"></a>
## [v0.1.1](https://github.com/comunica/comunica-feature-link-traversal/compare/v0.1.0...v0.1.1) - 2023-03-08

### Fixed
* [Update to comunica 2.6.9](https://github.com/comunica/comunica-feature-link-traversal/commit/1cca693d6f94aeb08390c71c82d50ce293e00313)
  * Fix stream EOF for some queries
  * Fix some queries having no end event, #95
  * Fix results being incomplete when more than one query is executed in the same engine.

<a name="v0.1.0"></a>
## [v0.1.0](https://github.com/comunica/comunica-feature-link-traversal/compare/v0.0.1...v0.1.0) - 2023-02-15

Initial minor release, with generic (`@comunica/query-sparql-link-traversal`) and Solid-specific (`@comunica/query-sparql-link-traversal-solid`) link traversal engines. 

<a name="0.0.1"></a>
## [0.0.1] - 2019-09-30

* Initial release
