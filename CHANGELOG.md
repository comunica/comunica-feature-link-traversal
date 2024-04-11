# Changelog
All notable changes to this project will be documented in this file.

<a name="v0.4.0"></a>
## [v0.4.0](https://github.com/comunica/comunica-feature-link-traversal/compare/v0.3.0...v0.4.0) - 2024-04-11

### Added
* [Add ActorExtractLinksHeaders for following auxiliary resources in Solid](https://github.com/comunica/comunica-feature-link-traversal/commit/66181c0b1d6c9c2fa96c587960b33922c6a3be69)

### Changed
* [Update dependency @comunica/query-sparql to ^3.0.2](https://github.com/comunica/comunica-feature-link-traversal/commit/ffb72b3178dd05f40d0abaa6c77b3141c5d295ae)

<a name="v0.3.0"></a>
## [v0.3.0](https://github.com/comunica/comunica-feature-link-traversal/compare/v0.2.0...v0.3.0) - 2024-03-20

### Changed
* [Update to Comunica v3](https://github.com/comunica/comunica-feature-link-traversal/commit/b1314c1813df156e726f568f04b9f96d67f00968)
  * [Remove KeysRdfResolveHypermediaLinks.traverse](https://github.com/comunica/comunica-feature-link-traversal/commit/1bdd810eec99355e71ddfd5a3dd1d60c98a3389a)
* [Disable type index inference by default, as it's unevaluated](https://github.com/comunica/comunica-feature-link-traversal/commit/f1c37bfa9706ec092a902942202b8cad859041c2)
* [Update dependency cross-fetch to v4](https://github.com/comunica/comunica-feature-link-traversal/commit/6b484e95060f5cd3be1056d8c6f1d2fcb662c5c9)
* [Update dependency rdf-store-stream to v2 (#113)](https://github.com/comunica/comunica-feature-link-traversal/commit/8291759566131084868a392075fa0387d88332e0)

### Fixed
* [Fix breaking changes in ShEx, Closes #68](https://github.com/comunica/comunica-feature-link-traversal/commit/e1eb462dc6ee80d45a8e1468698d448786b16dd4)
* [Fix webpacking of shapetrees config failing](https://github.com/comunica/comunica-feature-link-traversal/commit/367d2961b18e4f4632c38201b5f1f099f5a9d451)

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
