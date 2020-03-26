# [18.2.0](https://github.com/elastic/elastic-charts/compare/v18.1.0...v18.2.0) (2020-03-26)


### Bug Fixes

* **line_annotation:** keep the spec in state after chart rerender ([#605](https://github.com/elastic/elastic-charts/issues/605)) ([43c13f1](https://github.com/elastic/elastic-charts/commit/43c13f1a9652e9a50b7f9cf25a84a7a772695f81)), closes [#604](https://github.com/elastic/elastic-charts/issues/604)


### Features

* **partition:** stroke configuration and linked label value font format ([#602](https://github.com/elastic/elastic-charts/issues/602)) ([7dce0a3](https://github.com/elastic/elastic-charts/commit/7dce0a3598d4c4e59087bcb086a5d520381485cb))

# [18.1.0](https://github.com/elastic/elastic-charts/compare/v18.0.0...v18.1.0) (2020-03-18)


### Bug Fixes

* add unicorn eslint as dev dependency ([#591](https://github.com/elastic/elastic-charts/issues/591)) ([30fd07c](https://github.com/elastic/elastic-charts/commit/30fd07c15399551ae12441145744b3fd6f617bd7))


### Features

* remove duplicate tick labels from axis ([#577](https://github.com/elastic/elastic-charts/issues/577)) ([e8c89ec](https://github.com/elastic/elastic-charts/commit/e8c89ec0588f829acdbdf169a223f96dffb067a2)), closes [#445](https://github.com/elastic/elastic-charts/issues/445)
* **api:** cleanup exposed types ([#593](https://github.com/elastic/elastic-charts/issues/593)) ([544b7cc](https://github.com/elastic/elastic-charts/commit/544b7cc3825d9f277b4c4cacf51c10cb96fbc142))
* **partition:** general sunburst via slice show control ([#592](https://github.com/elastic/elastic-charts/issues/592)) ([5e6a30b](https://github.com/elastic/elastic-charts/commit/5e6a30b41f38d1991c991c7003da3f6bf5bc0575))

# [18.0.0](https://github.com/elastic/elastic-charts/compare/v17.1.1...v18.0.0) (2020-03-17)


### Code Refactoring

* clean up TS types ([#554](https://github.com/elastic/elastic-charts/issues/554)) ([22f7635](https://github.com/elastic/elastic-charts/commit/22f7635f0a1c8564b8f59b311079224f500522b9)), closes [#547](https://github.com/elastic/elastic-charts/issues/547) [#547](https://github.com/elastic/elastic-charts/issues/547)
* decouple tooltip from XY chart ([#553](https://github.com/elastic/elastic-charts/issues/553)) ([e70792e](https://github.com/elastic/elastic-charts/commit/e70792ea437c851dafc8f0f58e2faf3fb03143ae)), closes [#246](https://github.com/elastic/elastic-charts/issues/246)


### Features

* cleaner color API on SeriesSpec ([#571](https://github.com/elastic/elastic-charts/issues/571)) ([f769f7c](https://github.com/elastic/elastic-charts/commit/f769f7c0a7e15fab793f84befbf0661e3deb75c6))
* **legend:** allow color picker component render prop ([#545](https://github.com/elastic/elastic-charts/issues/545)) ([90f4b95](https://github.com/elastic/elastic-charts/commit/90f4b95656ac2704693c87211a3c63993251ead4))
* **partition:** add element click, over and out events ([#578](https://github.com/elastic/elastic-charts/issues/578)) ([103df02](https://github.com/elastic/elastic-charts/commit/103df026981c396eae16c406d77731ad3fe4bcec))
* **partition:** add tooltip ([#544](https://github.com/elastic/elastic-charts/issues/544)) ([6bf9a69](https://github.com/elastic/elastic-charts/commit/6bf9a69b12d3075330a5728b7bdb4443e6244985)), closes [#246](https://github.com/elastic/elastic-charts/issues/246)
* percentage display in partitioning charts ([#558](https://github.com/elastic/elastic-charts/issues/558)) ([d6aa8d7](https://github.com/elastic/elastic-charts/commit/d6aa8d72db1411a1967a37b5940020dc2f8037ec))
* specify series name with a function on SeriesSpec ([#539](https://github.com/elastic/elastic-charts/issues/539)) ([358455a](https://github.com/elastic/elastic-charts/commit/358455aea73591965401f43ae4bfa4525c3d2953))
* xAccessor can be a function accessor ([#574](https://github.com/elastic/elastic-charts/issues/574)) ([bcc3d63](https://github.com/elastic/elastic-charts/commit/bcc3d63bb126dc1714a8bf2a94d072a0c92a0231))


### BREAKING CHANGES

* The `getSpecId`, `getGroupId`, `getAxisId` and `getAnnotationId` are no longer available. Use a simple `string` instead.
* `customSeriesColors` prop on `SeriesSpec` is now `color`. The `CustomSeriesColors` type is  replaced with `SeriesColorAccessor`.
* Remove `customSubSeriesName` prop on series specs in favor of cleaner api using just the `name` prop on `SeriesSpec`. The types `SeriesStringPredicate`, `SubSeriesStringPredicate` have been removed.
* the `SeriesIdentifier` type is generalized into a simplified object with two values in common: `specId` and `key`. A specialized `XYChartSeriesIdentifier` extends now the base `SeriesIdentifier`. The `SettingsSpec` prop `showLegendDisplayValue` is renamed to `showLegendExtra` and its default value is now `false` hiding the current/last value on the legend by default.

## [17.1.1](https://github.com/elastic/elastic-charts/compare/v17.1.0...v17.1.1) (2020-02-21)


### Bug Fixes

* redux connect memo issue related to spec upserting ([#563](https://github.com/elastic/elastic-charts/issues/563)) ([f3a05f1](https://github.com/elastic/elastic-charts/commit/f3a05f1abe35d690e433a8ad9b6f5a999a7da7fe))

# [17.1.0](https://github.com/elastic/elastic-charts/compare/v17.0.3...v17.1.0) (2020-02-12)


### Features

* remove konva and add native canvas rendering ([#540](https://github.com/elastic/elastic-charts/issues/540)) ([08a4d5d](https://github.com/elastic/elastic-charts/commit/08a4d5dca21c98236c645e09548f918f088a6e96))

## [17.0.3](https://github.com/elastic/elastic-charts/compare/v17.0.2...v17.0.3) (2020-02-10)


### Bug Fixes

* **ie11:** replace fast-deep-equal with an internal copy IE11 safe ([#542](https://github.com/elastic/elastic-charts/issues/542)) ([2a02d7d](https://github.com/elastic/elastic-charts/commit/2a02d7d0692c6c43f6fce529bd9555552aeb093a))

## [17.0.2](https://github.com/elastic/elastic-charts/compare/v17.0.1...v17.0.2) (2020-02-05)


### Bug Fixes

* empty domain error for ordinal x scale ([#536](https://github.com/elastic/elastic-charts/issues/536)) ([ce4e84f](https://github.com/elastic/elastic-charts/commit/ce4e84fac8b51861cde377303ecaf9038611158b))

## [17.0.1](https://github.com/elastic/elastic-charts/compare/v17.0.0...v17.0.1) (2020-02-05)


### Bug Fixes

* replace PureComponent with shouldComponentUpdate ([#534](https://github.com/elastic/elastic-charts/issues/534)) ([5043725](https://github.com/elastic/elastic-charts/commit/5043725b7581bfea2340ca5323743d9fe03a4e19))

# [17.0.0](https://github.com/elastic/elastic-charts/compare/v16.2.1...v17.0.0) (2020-01-30)


### Bug Fixes

* **brush:** rotate brush on rotated charts ([#528](https://github.com/elastic/elastic-charts/issues/528)) ([985ac21](https://github.com/elastic/elastic-charts/commit/985ac21e1e6669d812dd9cf6c688668eee06aa65)), closes [#527](https://github.com/elastic/elastic-charts/issues/527)


### Features

* text improvements ([#524](https://github.com/elastic/elastic-charts/issues/524)) ([6e61700](https://github.com/elastic/elastic-charts/commit/6e617007f953e23cb96bef610f7ea2ce5a81161a))
* **listeners:** add seriesIdentifiers to element listeners ([#525](https://github.com/elastic/elastic-charts/issues/525)) ([027d008](https://github.com/elastic/elastic-charts/commit/027d008b79996ac465b062fd9b7ecace10a3080f)), closes [#419](https://github.com/elastic/elastic-charts/issues/419) [#505](https://github.com/elastic/elastic-charts/issues/505)


### BREAKING CHANGES

* **listeners:** the `onElementOver` and the `onElementClick` are now called with
`Array<[GeometryValue, SeriesIdentifier]>` instead of `Array<GeometryValue>`
* renames in `Partition` charts— `Layers`: `fillLabel.formatter`->`fillLabel.valueFormatter`; type `FillLabel`-> `FillLabelConfig`

Non-breaking changes:

* feat: the values in linked labels are rendered, just like they have been in the sectors (formerly, the value could optionally be put in the link label accessor itself)

* feat: font styling is possible separately for values: `valueFormatter` configs

* test: opacity decrease example; coloring examples

* feat: hierarchical data (`parent`, `sortIndex`) is made available to accessors (see stories, helpful with eg. coloring)

* refactor: tighter types; other code improvements

## [16.2.1](https://github.com/elastic/elastic-charts/compare/v16.2.0...v16.2.1) (2020-01-23)


### Bug Fixes

* try to get canvas post mounting ([#521](https://github.com/elastic/elastic-charts/issues/521)) ([141f465](https://github.com/elastic/elastic-charts/commit/141f4658acd3047eb6652ef3324fcfe2b9e42903))

# [16.2.0](https://github.com/elastic/elastic-charts/compare/v16.1.0...v16.2.0) (2020-01-21)


### Features

* implement treemap, sunburst, pie and donut charts ([#493](https://github.com/elastic/elastic-charts/issues/493)) ([e4de627](https://github.com/elastic/elastic-charts/commit/e4de6275d63250a92ca8a07c6f7e6420ba3da73a))

# [16.1.0](https://github.com/elastic/elastic-charts/compare/v16.0.2...v16.1.0) (2020-01-08)


### Features

* add domain fitting ([#510](https://github.com/elastic/elastic-charts/issues/510)) ([fefe728](https://github.com/elastic/elastic-charts/commit/fefe728da21be72a38855f719bce19588319fb71))

## [16.0.2](https://github.com/elastic/elastic-charts/compare/v16.0.1...v16.0.2) (2020-01-03)


### Bug Fixes

* add utility-types as dependency ([#509](https://github.com/elastic/elastic-charts/issues/509)) ([26b4d9c](https://github.com/elastic/elastic-charts/commit/26b4d9c545bcd139b3e0850ce48c83051db1bd3b))

## [16.0.1](https://github.com/elastic/elastic-charts/compare/v16.0.0...v16.0.1) (2020-01-03)


### Bug Fixes

* **specs:** shows a chart message without series specified ([#506](https://github.com/elastic/elastic-charts/issues/506)) ([ba1a67b](https://github.com/elastic/elastic-charts/commit/ba1a67b5c59396fa38dc87516487403e53d30405))

# [16.0.0](https://github.com/elastic/elastic-charts/compare/v15.0.5...v16.0.0) (2020-01-02)


### Bug Fixes

* **external pointer:** avoid recursive-loops on pointer events ([#503](https://github.com/elastic/elastic-charts/issues/503)) ([c170f0d](https://github.com/elastic/elastic-charts/commit/c170f0ddfade407d4c2b2e7d1b1d72a8142b59b8)), closes [#504](https://github.com/elastic/elastic-charts/issues/504)


### BREAKING CHANGES

* **external pointer:** The `onCursorUpdate` Settings property is changed to a more generic
`onPointerUpdate`. The same apply for the event type `CursorEvent` that is now `PointerEvent` and can assume a `PointerOverEvent` or `PointOutEvent` shape (see TS types)

## [15.0.5](https://github.com/elastic/elastic-charts/compare/v15.0.4...v15.0.5) (2019-12-12)


### Bug Fixes

* render stacked bar with stringified values ([#488](https://github.com/elastic/elastic-charts/issues/488)) ([811ee90](https://github.com/elastic/elastic-charts/commit/811ee900280706933fa33ce72b52be89684b5188)), closes [#487](https://github.com/elastic/elastic-charts/issues/487)

## [15.0.4](https://github.com/elastic/elastic-charts/compare/v15.0.3...v15.0.4) (2019-12-12)


### Bug Fixes

* **highlighter:** clip path unique id ([#490](https://github.com/elastic/elastic-charts/issues/490)) ([dc93624](https://github.com/elastic/elastic-charts/commit/dc936242546bb39ce973fd6dddbb60538f8be5d6)), closes [#489](https://github.com/elastic/elastic-charts/issues/489)

## [15.0.3](https://github.com/elastic/elastic-charts/compare/v15.0.2...v15.0.3) (2019-12-05)


### Bug Fixes

* **highlighter:** hide it when tooltip type is None ([#482](https://github.com/elastic/elastic-charts/issues/482)) ([6032c29](https://github.com/elastic/elastic-charts/commit/6032c29194d0e507fe4a9d36bf63b4b78692d271)), closes [#478](https://github.com/elastic/elastic-charts/issues/478) [#479](https://github.com/elastic/elastic-charts/issues/479)

## [15.0.2](https://github.com/elastic/elastic-charts/compare/v15.0.1...v15.0.2) (2019-12-05)


### Bug Fixes

* **crosshair:** hide horizontal line when the pointer is outside chart ([#484](https://github.com/elastic/elastic-charts/issues/484)) ([654d929](https://github.com/elastic/elastic-charts/commit/654d9296215d183e7433edab65a99122143b56e7)), closes [#483](https://github.com/elastic/elastic-charts/issues/483)

## [15.0.1](https://github.com/elastic/elastic-charts/compare/v15.0.0...v15.0.1) (2019-12-02)


### Bug Fixes

* redux dev tools config ([#465](https://github.com/elastic/elastic-charts/issues/465)) ([89d5364](https://github.com/elastic/elastic-charts/commit/89d53648f254983efc11f5f9a1636554aba31dd4))

# [15.0.0](https://github.com/elastic/elastic-charts/compare/v14.2.0...v15.0.0) (2019-12-02)


### Code Refactoring

* series identifications throughout library ([#419](https://github.com/elastic/elastic-charts/issues/419)) ([66a48ff](https://github.com/elastic/elastic-charts/commit/66a48ff170cec4e6d48b9219dee53a9f36b8d23d))
* use redux in favour of mobx ([#281](https://github.com/elastic/elastic-charts/issues/281)) ([cd34716](https://github.com/elastic/elastic-charts/commit/cd34716c744598b8fd56a1d4d6b2eda43437d365))


### BREAKING CHANGES

* `GeometryId` is now `SeriesIdentifier`. `customSeriesColors` prop on `SeriesSpec` which used to take a `CustomSeriesColorsMap`, now expects a `CustomSeriesColors` type. `LegendItemListener` now passes the `SeriesIdentifier` type as the first callback argument.
* `SpecId`,`AxisId`, `AnnotationId` types are down-casted to a `string` type. The `getSpecId`, `getAxisId` and `getAnnotationId` methods still exist and but return just the same passed string until deprecated in a future version. The spec ids, previously `id`, `axisId`,`annotationId` etc are now aligned to use the same prop name: `id`. The chart rendering status `data-ech-render-complete` and `data-ech-render-count` is no more at the root level of the `echChart` div, but on its child element: `echChartStatus`. The `Spec` has two new private properties called `chartType` and `specType`.

# [14.2.0](https://github.com/elastic/elastic-charts/compare/v14.1.0...v14.2.0) (2019-11-25)


### Features

* add PNG export ([#451](https://github.com/elastic/elastic-charts/issues/451)) ([e844687](https://github.com/elastic/elastic-charts/commit/e844687)), closes [#82](https://github.com/elastic/elastic-charts/issues/82)

# [14.1.0](https://github.com/elastic/elastic-charts/compare/v14.0.0...v14.1.0) (2019-11-13)


### Features

* fit functions for null y1 values ([#416](https://github.com/elastic/elastic-charts/issues/416)) ([e083755](https://github.com/elastic/elastic-charts/commit/e083755)), closes [#450](https://github.com/elastic/elastic-charts/issues/450) [#388](https://github.com/elastic/elastic-charts/issues/388)

# [14.0.0](https://github.com/elastic/elastic-charts/compare/v13.6.0...v14.0.0) (2019-11-11)


### Code Refactoring

* **typings:** prepare for upgrade TS to 3.7 ([#402](https://github.com/elastic/elastic-charts/issues/402)) ([e2700de](https://github.com/elastic/elastic-charts/commit/e2700de))


### BREAKING CHANGES

* **typings:** We have a few exported styles, used in the Theme that are changed: SharedGeometryStyle to SharedGeometryStateStyle and GeometryStyle to GeometryStateStyle

# [13.6.0](https://github.com/elastic/elastic-charts/compare/v13.5.12...v13.6.0) (2019-11-01)


### Features

* **bar_spec:** min bar render height ([#443](https://github.com/elastic/elastic-charts/issues/443)) ([dac21c1](https://github.com/elastic/elastic-charts/commit/dac21c1))

## [13.5.12](https://github.com/elastic/elastic-charts/compare/v13.5.11...v13.5.12) (2019-10-31)


### Bug Fixes

* clip bar highlighter edges  ([#447](https://github.com/elastic/elastic-charts/issues/447)) ([c9fc3e2](https://github.com/elastic/elastic-charts/commit/c9fc3e2))

## [13.5.11](https://github.com/elastic/elastic-charts/compare/v13.5.10...v13.5.11) (2019-10-31)


### Bug Fixes

* **tooltip:** render tooltip on portal to avoid hidden overflows ([#418](https://github.com/elastic/elastic-charts/issues/418)) ([1c00e23](https://github.com/elastic/elastic-charts/commit/1c00e23)), closes [#375](https://github.com/elastic/elastic-charts/issues/375)

## [13.5.10](https://github.com/elastic/elastic-charts/compare/v13.5.9...v13.5.10) (2019-10-31)


### Bug Fixes

* **legend:** disable fade of other charts when hiding an item ([#446](https://github.com/elastic/elastic-charts/issues/446)) ([ff4e097](https://github.com/elastic/elastic-charts/commit/ff4e097))

## [13.5.9](https://github.com/elastic/elastic-charts/compare/v13.5.8...v13.5.9) (2019-10-25)


### Bug Fixes

* initial legend sizing issue ([#441](https://github.com/elastic/elastic-charts/issues/441)) ([64b9f83](https://github.com/elastic/elastic-charts/commit/64b9f83)), closes [#367](https://github.com/elastic/elastic-charts/issues/367)

## [13.5.8](https://github.com/elastic/elastic-charts/compare/v13.5.7...v13.5.8) (2019-10-25)


### Bug Fixes

* xDomain to exclude undefined values ([#440](https://github.com/elastic/elastic-charts/issues/440)) ([6389356](https://github.com/elastic/elastic-charts/commit/6389356))

## [13.5.7](https://github.com/elastic/elastic-charts/compare/v13.5.6...v13.5.7) (2019-10-23)


### Bug Fixes

* switch to momentjs to handle timezones ([#436](https://github.com/elastic/elastic-charts/issues/436)) ([a9f98c8](https://github.com/elastic/elastic-charts/commit/a9f98c8))

## [13.5.6](https://github.com/elastic/elastic-charts/compare/v13.5.5...v13.5.6) (2019-10-22)


### Bug Fixes

* **tickformatter:** add timeZone to tickFormatter ([#430](https://github.com/elastic/elastic-charts/issues/430)) ([6256d4d](https://github.com/elastic/elastic-charts/commit/6256d4d)), closes [#427](https://github.com/elastic/elastic-charts/issues/427)

## [13.5.5](https://github.com/elastic/elastic-charts/compare/v13.5.4...v13.5.5) (2019-10-22)


### Bug Fixes

* resize observer loop limit exception ([#429](https://github.com/elastic/elastic-charts/issues/429)) ([5243ef3](https://github.com/elastic/elastic-charts/commit/5243ef3))

## [13.5.4](https://github.com/elastic/elastic-charts/compare/v13.5.3...v13.5.4) (2019-10-17)


### Bug Fixes

* seedrandom dependency ([#424](https://github.com/elastic/elastic-charts/issues/424)) ([2670d28](https://github.com/elastic/elastic-charts/commit/2670d28))

## [13.5.3](https://github.com/elastic/elastic-charts/compare/v13.5.2...v13.5.3) (2019-10-17)


### Bug Fixes

* align series names on splitted series configuration ([#421](https://github.com/elastic/elastic-charts/issues/421)) ([bbecbcc](https://github.com/elastic/elastic-charts/commit/bbecbcc)), closes [#420](https://github.com/elastic/elastic-charts/issues/420)

## [13.5.2](https://github.com/elastic/elastic-charts/compare/v13.5.1...v13.5.2) (2019-10-10)


### Bug Fixes

* handle null y0 values on y log scale rendering ([#413](https://github.com/elastic/elastic-charts/issues/413)) ([5731c10](https://github.com/elastic/elastic-charts/commit/5731c10))

## [13.5.1](https://github.com/elastic/elastic-charts/compare/v13.5.0...v13.5.1) (2019-10-09)


### Bug Fixes

* mixing bars with line or area series breaks legend toggle ([#410](https://github.com/elastic/elastic-charts/issues/410)) ([57c0e3c](https://github.com/elastic/elastic-charts/commit/57c0e3c)), closes [#399](https://github.com/elastic/elastic-charts/issues/399)

# [13.5.0](https://github.com/elastic/elastic-charts/compare/v13.4.1...v13.5.0) (2019-10-09)


### Features

* **data:** fill datasets with zeros with missing points when stacked ([#409](https://github.com/elastic/elastic-charts/issues/409)) ([ef84fd4](https://github.com/elastic/elastic-charts/commit/ef84fd4)), closes [#388](https://github.com/elastic/elastic-charts/issues/388)

## [13.4.1](https://github.com/elastic/elastic-charts/compare/v13.4.0...v13.4.1) (2019-10-09)


### Bug Fixes

* **tooltip:** fix spec naming ([#412](https://github.com/elastic/elastic-charts/issues/412)) ([3690cca](https://github.com/elastic/elastic-charts/commit/3690cca)), closes [#411](https://github.com/elastic/elastic-charts/issues/411)

# [13.4.0](https://github.com/elastic/elastic-charts/compare/v13.3.0...v13.4.0) (2019-10-07)


### Features

* banded legend values ([#398](https://github.com/elastic/elastic-charts/issues/398) & [#408](https://github.com/elastic/elastic-charts/issues/408)) ([5c35a4d](https://github.com/elastic/elastic-charts/commit/5c35a4d)), closes [#162](https://github.com/elastic/elastic-charts/issues/162)

# [13.3.0](https://github.com/elastic/elastic-charts/compare/v13.2.0...v13.3.0) (2019-10-02)


### Features

* **tooltip:** tooltip label format for upper/lower banded area series ([#391](https://github.com/elastic/elastic-charts/issues/391)) ([dfd5d7b](https://github.com/elastic/elastic-charts/commit/dfd5d7b)), closes [#162](https://github.com/elastic/elastic-charts/issues/162)

# [13.2.0](https://github.com/elastic/elastic-charts/compare/v13.1.1...v13.2.0) (2019-10-01)


### Features

* **style:** point style overrides ([#385](https://github.com/elastic/elastic-charts/issues/385)) ([0f587d0](https://github.com/elastic/elastic-charts/commit/0f587d0))

## [13.1.1](https://github.com/elastic/elastic-charts/compare/v13.1.0...v13.1.1) (2019-09-28)


### Bug Fixes

* **rendering:** out-of-domain rendering of points/bars/lines/areas ([#395](https://github.com/elastic/elastic-charts/issues/395)) ([b6fee52](https://github.com/elastic/elastic-charts/commit/b6fee52)), closes [#386](https://github.com/elastic/elastic-charts/issues/386)

# [13.1.0](https://github.com/elastic/elastic-charts/compare/v13.0.1...v13.1.0) (2019-09-27)


### Features

* **axis:** add option for integer only axis ticks ([#389](https://github.com/elastic/elastic-charts/issues/389)) ([4fcfe3c](https://github.com/elastic/elastic-charts/commit/4fcfe3c)), closes [#387](https://github.com/elastic/elastic-charts/issues/387)

## [13.0.1](https://github.com/elastic/elastic-charts/compare/v13.0.0...v13.0.1) (2019-09-27)


### Bug Fixes

* x-scale for linear band charts ([#384](https://github.com/elastic/elastic-charts/issues/384)) ([daa3b55](https://github.com/elastic/elastic-charts/commit/daa3b55))

# [13.0.0](https://github.com/elastic/elastic-charts/compare/v12.1.0...v13.0.0) (2019-09-19)


### Features

* **axis:** add visibility to tick style ([#374](https://github.com/elastic/elastic-charts/issues/374)) ([265a6bb](https://github.com/elastic/elastic-charts/commit/265a6bb)), closes [#330](https://github.com/elastic/elastic-charts/issues/330)


### BREAKING CHANGES

* **axis:** `theme.axes.tickLineStyle.visible` is now required (default base is `true`)

# [12.1.0](https://github.com/elastic/elastic-charts/compare/v12.0.2...v12.1.0) (2019-09-19)


### Features

* **axis:** option to hide duplicate axes ([#370](https://github.com/elastic/elastic-charts/issues/370)) ([ada2ddc](https://github.com/elastic/elastic-charts/commit/ada2ddc)), closes [#368](https://github.com/elastic/elastic-charts/issues/368)

## [12.0.2](https://github.com/elastic/elastic-charts/compare/v12.0.1...v12.0.2) (2019-09-16)


### Bug Fixes

* **reactive_chart:** fix order of instantiation of onBrushEnd callback ([#376](https://github.com/elastic/elastic-charts/issues/376)) ([527d68d](https://github.com/elastic/elastic-charts/commit/527d68d)), closes [#360](https://github.com/elastic/elastic-charts/issues/360)

## [12.0.1](https://github.com/elastic/elastic-charts/compare/v12.0.0...v12.0.1) (2019-09-12)


### Bug Fixes

* **theme:** fix grid position check ([#373](https://github.com/elastic/elastic-charts/issues/373)) ([af4805f](https://github.com/elastic/elastic-charts/commit/af4805f)), closes [#372](https://github.com/elastic/elastic-charts/issues/372)

# [12.0.0](https://github.com/elastic/elastic-charts/compare/v11.2.0...v12.0.0) (2019-09-11)


### Features

* **theme:** add gridLineStyle to AxisConfig ([#257](https://github.com/elastic/elastic-charts/issues/257)) ([97dd812](https://github.com/elastic/elastic-charts/commit/97dd812)), closes [#237](https://github.com/elastic/elastic-charts/issues/237)


### BREAKING CHANGES

* **theme:** Added `GridLineStyle` to `Theme` (`theme.axes.gridLineStyle.horizontal` and `theme.axes.gridLineStyle.vertical`)

* add gridLineStyle to AxisConfig
* add chartTheme vs axisSpec
* add gridLineStyle for theme or spec
* merge gridLineConfig from theme with axisSpec
* add visible key to GridLineConfig
* specify theme styling per axis in story
* add gridLineStyle theme with horiz and vert

# [11.2.0](https://github.com/elastic/elastic-charts/compare/v11.1.2...v11.2.0) (2019-09-04)


### Features

* **chart_state:** add render change event ([#365](https://github.com/elastic/elastic-charts/issues/365)) ([521889b](https://github.com/elastic/elastic-charts/commit/521889b))

## [11.1.2](https://github.com/elastic/elastic-charts/compare/v11.1.1...v11.1.2) (2019-08-30)


### Bug Fixes

* **engines:** update node engine ([#363](https://github.com/elastic/elastic-charts/issues/363)) ([7fcd98c](https://github.com/elastic/elastic-charts/commit/7fcd98c)), closes [#359](https://github.com/elastic/elastic-charts/issues/359)

## [11.1.1](https://github.com/elastic/elastic-charts/compare/v11.1.0...v11.1.1) (2019-08-28)


### Bug Fixes

* **annotations:** markers shown in empty chart ([#358](https://github.com/elastic/elastic-charts/issues/358)) ([8dbf54e](https://github.com/elastic/elastic-charts/commit/8dbf54e)), closes [#357](https://github.com/elastic/elastic-charts/issues/357)

# [11.1.0](https://github.com/elastic/elastic-charts/compare/v11.0.5...v11.1.0) (2019-08-27)


### Features

* add prop to set debounce time, lower default ([#356](https://github.com/elastic/elastic-charts/issues/356)) ([38e41e0](https://github.com/elastic/elastic-charts/commit/38e41e0))

## [11.0.5](https://github.com/elastic/elastic-charts/compare/v11.0.4...v11.0.5) (2019-08-27)


### Bug Fixes

* clip overflowing rect/lines/areas ([#355](https://github.com/elastic/elastic-charts/issues/355)) ([3ff7379](https://github.com/elastic/elastic-charts/commit/3ff7379)), closes [#354](https://github.com/elastic/elastic-charts/issues/354)

## [11.0.4](https://github.com/elastic/elastic-charts/compare/v11.0.3...v11.0.4) (2019-08-27)


### Bug Fixes

* **crosshair:** limit the width of the cursor band on edges ([#353](https://github.com/elastic/elastic-charts/issues/353)) ([1177e59](https://github.com/elastic/elastic-charts/commit/1177e59)), closes [#352](https://github.com/elastic/elastic-charts/issues/352)

## [11.0.3](https://github.com/elastic/elastic-charts/compare/v11.0.2...v11.0.3) (2019-08-26)


### Bug Fixes

* **vertical_cursor:** fix tooltip and external events for 1st datapoint ([#349](https://github.com/elastic/elastic-charts/issues/349)) ([5c5b8d4](https://github.com/elastic/elastic-charts/commit/5c5b8d4))

## [11.0.2](https://github.com/elastic/elastic-charts/compare/v11.0.1...v11.0.2) (2019-08-26)


### Bug Fixes

* better theme defaults for light and dark themes ([#340](https://github.com/elastic/elastic-charts/issues/340)) ([693cdc1](https://github.com/elastic/elastic-charts/commit/693cdc1))

## [11.0.1](https://github.com/elastic/elastic-charts/compare/v11.0.0...v11.0.1) (2019-08-26)


### Bug Fixes

* **renderer:** stroke opacity ([#335](https://github.com/elastic/elastic-charts/issues/335)) ([d8c8459](https://github.com/elastic/elastic-charts/commit/d8c8459))

# [11.0.0](https://github.com/elastic/elastic-charts/compare/v10.3.1...v11.0.0) (2019-08-26)


### Bug Fixes

* **histogram:** fix overflowing annotation with single value ([#343](https://github.com/elastic/elastic-charts/issues/343)) ([2268f04](https://github.com/elastic/elastic-charts/commit/2268f04)), closes [#342](https://github.com/elastic/elastic-charts/issues/342) [#341](https://github.com/elastic/elastic-charts/issues/341)


### BREAKING CHANGES

* **histogram:** The current coordinate configuration of a rect annotation were inverted. This commit now reverse them: a rect coordinate with only the x0 value will cover from the x0 value to the end of the domain, a rect coordinate with only the x1 value will cover the interval from the beginning of the domain till the x1 value.

## [10.3.1](https://github.com/elastic/elastic-charts/compare/v10.3.0...v10.3.1) (2019-08-26)


### Bug Fixes

* **scales:** bisect correctly on continuous scales ([#346](https://github.com/elastic/elastic-charts/issues/346)) ([5112208](https://github.com/elastic/elastic-charts/commit/5112208)), closes [#227](https://github.com/elastic/elastic-charts/issues/227) [#221](https://github.com/elastic/elastic-charts/issues/221)

# [10.3.0](https://github.com/elastic/elastic-charts/compare/v10.2.0...v10.3.0) (2019-08-26)


### Features

* compute global y domain on multiple groups ([#348](https://github.com/elastic/elastic-charts/issues/348)) ([5ab46ca](https://github.com/elastic/elastic-charts/commit/5ab46ca)), closes [#169](https://github.com/elastic/elastic-charts/issues/169) [#185](https://github.com/elastic/elastic-charts/issues/185)

# [10.2.0](https://github.com/elastic/elastic-charts/compare/v10.1.1...v10.2.0) (2019-08-23)


### Features

* **theme:** multiple-partials ([#345](https://github.com/elastic/elastic-charts/issues/345)) ([82da5de](https://github.com/elastic/elastic-charts/commit/82da5de)), closes [#344](https://github.com/elastic/elastic-charts/issues/344)

## [10.1.1](https://github.com/elastic/elastic-charts/compare/v10.1.0...v10.1.1) (2019-08-22)


### Bug Fixes

* **crosshair:** disable band when chart is empty ([#338](https://github.com/elastic/elastic-charts/issues/338)) ([3bd0c43](https://github.com/elastic/elastic-charts/commit/3bd0c43)), closes [#337](https://github.com/elastic/elastic-charts/issues/337)

# [10.1.0](https://github.com/elastic/elastic-charts/compare/v10.0.1...v10.1.0) (2019-08-22)


### Features

* hide tooltip when over line annotation ([#339](https://github.com/elastic/elastic-charts/issues/339)) ([bef1fc7](https://github.com/elastic/elastic-charts/commit/bef1fc7)), closes [#324](https://github.com/elastic/elastic-charts/issues/324)

## [10.0.1](https://github.com/elastic/elastic-charts/compare/v10.0.0...v10.0.1) (2019-08-21)


### Bug Fixes

* default theme ([#336](https://github.com/elastic/elastic-charts/issues/336)) ([2edadb2](https://github.com/elastic/elastic-charts/commit/2edadb2))

# [10.0.0](https://github.com/elastic/elastic-charts/compare/v9.2.1...v10.0.0) (2019-08-21)


### Bug Fixes

* **tooltip:** ie11 flex sizing ([#334](https://github.com/elastic/elastic-charts/issues/334)) ([abaa472](https://github.com/elastic/elastic-charts/commit/abaa472)), closes [#332](https://github.com/elastic/elastic-charts/issues/332)
* decuple brush cursor from chart rendering ([#331](https://github.com/elastic/elastic-charts/issues/331)) ([789f85a](https://github.com/elastic/elastic-charts/commit/789f85a)), closes [elastic/kibana#36517](https://github.com/elastic/kibana/issues/36517)
* remove clippings from chart geometries ([#320](https://github.com/elastic/elastic-charts/issues/320)) ([ed6d0e5](https://github.com/elastic/elastic-charts/commit/ed6d0e5)), closes [#20](https://github.com/elastic/elastic-charts/issues/20)


### Features

* auto legend resize ([#316](https://github.com/elastic/elastic-charts/issues/316)) ([659d27e](https://github.com/elastic/elastic-charts/commit/659d27e)), closes [#268](https://github.com/elastic/elastic-charts/issues/268)
* customize number of axis ticks ([#319](https://github.com/elastic/elastic-charts/issues/319)) ([2b838d7](https://github.com/elastic/elastic-charts/commit/2b838d7))
* **theme:** base theme prop ([#333](https://github.com/elastic/elastic-charts/issues/333)) ([a9ff5e1](https://github.com/elastic/elastic-charts/commit/a9ff5e1)), closes [#292](https://github.com/elastic/elastic-charts/issues/292)


### BREAKING CHANGES

* **theme:** remove `baseThemeType` prop on `Settings` component and `BaseThemeTypes` type.
* `theme.legend.spacingBuffer` added to `Theme` type. Controls the width buffer between the legend label and value.

## [9.2.1](https://github.com/elastic/elastic-charts/compare/v9.2.0...v9.2.1) (2019-08-20)


### Bug Fixes

* **tooltip:** fix duplicate key warning for band area charts ([#327](https://github.com/elastic/elastic-charts/issues/327)) ([0ca1884](https://github.com/elastic/elastic-charts/commit/0ca1884)), closes [#326](https://github.com/elastic/elastic-charts/issues/326)

# [9.2.0](https://github.com/elastic/elastic-charts/compare/v9.1.1...v9.2.0) (2019-08-19)


### Bug Fixes

* reduce opacity for points when hovering over legend items ([#322](https://github.com/elastic/elastic-charts/issues/322)) ([196341b](https://github.com/elastic/elastic-charts/commit/196341b)), closes [#291](https://github.com/elastic/elastic-charts/issues/291)


### Features

* add chart size type overrides ([#317](https://github.com/elastic/elastic-charts/issues/317)) ([b8dc9e1](https://github.com/elastic/elastic-charts/commit/b8dc9e1)), closes [#177](https://github.com/elastic/elastic-charts/issues/177)

## [9.1.1](https://github.com/elastic/elastic-charts/compare/v9.1.0...v9.1.1) (2019-08-16)


### Bug Fixes

* **axis:** limit chart dimensions to avoid axis labels overflow ([#314](https://github.com/elastic/elastic-charts/issues/314)) ([5751ce0](https://github.com/elastic/elastic-charts/commit/5751ce0))

# [9.1.0](https://github.com/elastic/elastic-charts/compare/v9.0.4...v9.1.0) (2019-08-14)


### Features

* add cursor sync mechanism ([#304](https://github.com/elastic/elastic-charts/issues/304)) ([c8c1d9d](https://github.com/elastic/elastic-charts/commit/c8c1d9d))

## [9.0.4](https://github.com/elastic/elastic-charts/compare/v9.0.3...v9.0.4) (2019-08-13)


### Bug Fixes

* **legend:** item hideInLegend prop ([#307](https://github.com/elastic/elastic-charts/issues/307)) ([3aa5ca3](https://github.com/elastic/elastic-charts/commit/3aa5ca3)), closes [#306](https://github.com/elastic/elastic-charts/issues/306)

## [9.0.3](https://github.com/elastic/elastic-charts/compare/v9.0.2...v9.0.3) (2019-08-13)


### Bug Fixes

* zIndex order for areas, lines and points ([#290](https://github.com/elastic/elastic-charts/issues/290)) ([6a4c1b1](https://github.com/elastic/elastic-charts/commit/6a4c1b1)), closes [#287](https://github.com/elastic/elastic-charts/issues/287)

## [9.0.2](https://github.com/elastic/elastic-charts/compare/v9.0.1...v9.0.2) (2019-08-12)


### Bug Fixes

* shift bars independently from the specs order ([#302](https://github.com/elastic/elastic-charts/issues/302)) ([1cd934d](https://github.com/elastic/elastic-charts/commit/1cd934d))

## [9.0.1](https://github.com/elastic/elastic-charts/compare/v9.0.0...v9.0.1) (2019-08-07)


### Bug Fixes

* handle splitted series with group value to 0 ([#289](https://github.com/elastic/elastic-charts/issues/289)) ([0f2217e](https://github.com/elastic/elastic-charts/commit/0f2217e)), closes [#288](https://github.com/elastic/elastic-charts/issues/288)

# [9.0.0](https://github.com/elastic/elastic-charts/compare/v8.1.8...v9.0.0) (2019-08-05)


### Features

* **bar_chart:** color/style override accessor ([#271](https://github.com/elastic/elastic-charts/issues/271)) ([7634f5c](https://github.com/elastic/elastic-charts/commit/7634f5c)), closes [#216](https://github.com/elastic/elastic-charts/issues/216)


### BREAKING CHANGES

* **bar_chart:** colorAccessors removed from YBasicSeriesSpec (aka for all series) which had acted similarly to a split accessor.

## [8.1.8](https://github.com/elastic/elastic-charts/compare/v8.1.7...v8.1.8) (2019-08-05)


### Bug Fixes

* **tooltip:** fix tooltip formatting for rotated charts ([#285](https://github.com/elastic/elastic-charts/issues/285)) ([651edd1](https://github.com/elastic/elastic-charts/commit/651edd1)), closes [#273](https://github.com/elastic/elastic-charts/issues/273)

## [8.1.7](https://github.com/elastic/elastic-charts/compare/v8.1.6...v8.1.7) (2019-08-05)


### Bug Fixes

* **tooltip:** fix overflow for long series names ([#274](https://github.com/elastic/elastic-charts/issues/274)) ([717486f](https://github.com/elastic/elastic-charts/commit/717486f)), closes [#270](https://github.com/elastic/elastic-charts/issues/270)

## [8.1.6](https://github.com/elastic/elastic-charts/compare/v8.1.5...v8.1.6) (2019-08-05)


### Bug Fixes

* **types:** export missing types ([#283](https://github.com/elastic/elastic-charts/issues/283)) ([7c475af](https://github.com/elastic/elastic-charts/commit/7c475af))

## [8.1.5](https://github.com/elastic/elastic-charts/compare/v8.1.4...v8.1.5) (2019-08-02)


### Bug Fixes

* disable tooltip when details or custom content is null ([#280](https://github.com/elastic/elastic-charts/issues/280)) ([4d78fdc](https://github.com/elastic/elastic-charts/commit/4d78fdc))

## [8.1.4](https://github.com/elastic/elastic-charts/compare/v8.1.3...v8.1.4) (2019-08-01)


### Bug Fixes

* **theme:** restore original point radius values ([#276](https://github.com/elastic/elastic-charts/issues/276)) ([16f789a](https://github.com/elastic/elastic-charts/commit/16f789a))

## [8.1.3](https://github.com/elastic/elastic-charts/compare/v8.1.2...v8.1.3) (2019-07-30)


### Bug Fixes

* update EUI, storybook and add autoprefixer ([#267](https://github.com/elastic/elastic-charts/issues/267)) ([f70e084](https://github.com/elastic/elastic-charts/commit/f70e084)), closes [#249](https://github.com/elastic/elastic-charts/issues/249)

## [8.1.2](https://github.com/elastic/elastic-charts/compare/v8.1.1...v8.1.2) (2019-07-24)


### Bug Fixes

* export GeometryValue so onElementClick callbacks can be typed ([#272](https://github.com/elastic/elastic-charts/issues/272)) ([8ed5d11](https://github.com/elastic/elastic-charts/commit/8ed5d11))

## [8.1.1](https://github.com/elastic/elastic-charts/compare/v8.1.0...v8.1.1) (2019-07-24)


### Bug Fixes

* handle chart click as mouseUp to prevent click while brushing ([#269](https://github.com/elastic/elastic-charts/issues/269)) ([7881b8d](https://github.com/elastic/elastic-charts/commit/7881b8d))

# [8.1.0](https://github.com/elastic/elastic-charts/compare/v8.0.2...v8.1.0) (2019-07-22)


### Features

* display empty chart status when no series is selected  ([f1505df](https://github.com/elastic/elastic-charts/commit/f1505df)), closes [#102](https://github.com/elastic/elastic-charts/issues/102)

## [8.0.2](https://github.com/elastic/elastic-charts/compare/v8.0.1...v8.0.2) (2019-07-17)


### Bug Fixes

* adjust domain & range for single value histogram ([#265](https://github.com/elastic/elastic-charts/issues/265)) ([3f1358e](https://github.com/elastic/elastic-charts/commit/3f1358e))

## [8.0.1](https://github.com/elastic/elastic-charts/compare/v8.0.0...v8.0.1) (2019-07-15)


### Bug Fixes

* position tooltip within chart with single value xScale ([#259](https://github.com/elastic/elastic-charts/issues/259)) ([f458bc9](https://github.com/elastic/elastic-charts/commit/f458bc9))

# [8.0.0](https://github.com/elastic/elastic-charts/compare/v7.2.1...v8.0.0) (2019-07-15)


### Code Refactoring

* **legend:** remove visibility button ([#252](https://github.com/elastic/elastic-charts/issues/252)) ([90a1ba7](https://github.com/elastic/elastic-charts/commit/90a1ba7))


### Features

* **style:** allow fill and stroke overrides ([#258](https://github.com/elastic/elastic-charts/issues/258)) ([99c5e9f](https://github.com/elastic/elastic-charts/commit/99c5e9f))


### BREAKING CHANGES

* **style:** `LineStyle`, `AreaStyle` and `BarSeriesStyle` types differs on the optional values.
`stroke` and `fill` on the theme or specific series style now override the computed series color.

* **legend:** the `onLegendItemClick` click handler is no longer applied when clicking on the title. Instead a simple visibility change is applied.

## [7.2.1](https://github.com/elastic/elastic-charts/compare/v7.2.0...v7.2.1) (2019-07-10)


### Bug Fixes

* **last_value:** compute last value for non stacked series ([#261](https://github.com/elastic/elastic-charts/issues/261)) ([803c34e](https://github.com/elastic/elastic-charts/commit/803c34e))

# [7.2.0](https://github.com/elastic/elastic-charts/compare/v7.1.0...v7.2.0) (2019-07-05)


### Bug Fixes

* **ticks:** fill in additional ticks for histogram ([#251](https://github.com/elastic/elastic-charts/issues/251)) ([af92736](https://github.com/elastic/elastic-charts/commit/af92736))


### Features

* **series:** stack series in percentage mode ([#250](https://github.com/elastic/elastic-charts/issues/250)) ([1bfb430](https://github.com/elastic/elastic-charts/commit/1bfb430)), closes [#222](https://github.com/elastic/elastic-charts/issues/222)

# [7.1.0](https://github.com/elastic/elastic-charts/compare/v7.0.2...v7.1.0) (2019-07-03)


### Features

* **axis:** add tickLabelPadding prop ([#217](https://github.com/elastic/elastic-charts/issues/217)) ([4d40936](https://github.com/elastic/elastic-charts/commit/4d40936)), closes [#94](https://github.com/elastic/elastic-charts/issues/94)

## [7.0.2](https://github.com/elastic/elastic-charts/compare/v7.0.1...v7.0.2) (2019-07-03)


### Bug Fixes

* **theme:** merge optional params ([#256](https://github.com/elastic/elastic-charts/issues/256)) ([9cd660c](https://github.com/elastic/elastic-charts/commit/9cd660c)), closes [#253](https://github.com/elastic/elastic-charts/issues/253)

## [7.0.1](https://github.com/elastic/elastic-charts/compare/v7.0.0...v7.0.1) (2019-06-25)


### Bug Fixes

* type error with RecursivePartial ([#248](https://github.com/elastic/elastic-charts/issues/248)) ([f2b90df](https://github.com/elastic/elastic-charts/commit/f2b90df))

# [7.0.0](https://github.com/elastic/elastic-charts/compare/v6.3.0...v7.0.0) (2019-06-24)


### Features

* **annotation:** simplify custom tooltip function ([#247](https://github.com/elastic/elastic-charts/issues/247)) ([982bc63](https://github.com/elastic/elastic-charts/commit/982bc63))


### BREAKING CHANGES

* **annotation:** this changes the type signature of `RectAnnotation.renderTooltip?` from `(position, details) => JSX.Element` to `(details) => JSX.Element`.  This allows the user to pass in a custom element without having to do the heavy lifting of writing the container positioning styles themselves.

# [6.3.0](https://github.com/elastic/elastic-charts/compare/v6.2.0...v6.3.0) (2019-06-20)


### Features

* **theme:** allow recursive partial theme ([#239](https://github.com/elastic/elastic-charts/issues/239)) ([d8144ee](https://github.com/elastic/elastic-charts/commit/d8144ee)), closes [#201](https://github.com/elastic/elastic-charts/issues/201)

# [6.2.0](https://github.com/elastic/elastic-charts/compare/v6.1.0...v6.2.0) (2019-06-19)


### Features

* add minInterval option for custom xDomain ([#240](https://github.com/elastic/elastic-charts/issues/240)) ([27f14a0](https://github.com/elastic/elastic-charts/commit/27f14a0))

# [6.1.0](https://github.com/elastic/elastic-charts/compare/v6.0.1...v6.1.0) (2019-06-19)


### Features

* **brush:** show crosshair cursor when brush enabled  ([#243](https://github.com/elastic/elastic-charts/issues/243)) ([0b44b87](https://github.com/elastic/elastic-charts/commit/0b44b87))

## [6.0.1](https://github.com/elastic/elastic-charts/compare/v6.0.0...v6.0.1) (2019-06-14)


### Bug Fixes

* **line_annotation:** use scaleAndValidate for line annotations ([#236](https://github.com/elastic/elastic-charts/issues/236)) ([48b180a](https://github.com/elastic/elastic-charts/commit/48b180a))

# [6.0.0](https://github.com/elastic/elastic-charts/compare/v5.2.0...v6.0.0) (2019-06-13)


### Features

* **tooltip:** add custom headerFormatter ([#233](https://github.com/elastic/elastic-charts/issues/233)) ([bd181b5](https://github.com/elastic/elastic-charts/commit/bd181b5))


### BREAKING CHANGES

* **tooltip:** Previously, you could define `tooltipType` and `tooltipSnap` props in a Settings component; this commit removes these from `SettingsSpecProps` and instead there is a single `tooltip` prop which can accept either a `TooltipType` or a full `TooltipProps` object which may include `type`, `snap`, and/or `headerFormattter` for formatting the header.

# [5.2.0](https://github.com/elastic/elastic-charts/compare/v5.1.0...v5.2.0) (2019-06-12)


### Features

* **scss:** export the theme as SCSS file ([#231](https://github.com/elastic/elastic-charts/issues/231)) ([ebae6ab](https://github.com/elastic/elastic-charts/commit/ebae6ab))

# [5.1.0](https://github.com/elastic/elastic-charts/compare/v5.0.0...v5.1.0) (2019-06-11)


### Features

* add histogram mode ([#218](https://github.com/elastic/elastic-charts/issues/218)) ([b418b67](https://github.com/elastic/elastic-charts/commit/b418b67))

# [5.0.0](https://github.com/elastic/elastic-charts/compare/v4.2.9...v5.0.0) (2019-06-10)


### Bug Fixes

* **css:** remove dependency on EUI components and use only EUI styles ([#208](https://github.com/elastic/elastic-charts/issues/208)) ([122fade](https://github.com/elastic/elastic-charts/commit/122fade))


### BREAKING CHANGES

* **css:** EUI components are removed from this library. The single chart `style.css` stylesheet is now replaced by a `theme_only_light.css` or `theme_only_dark.css` file that brings in all the required styling for chart, tooltip and legends. `theme_light.css` and `theme_dark.css` styles include also a reset CSS style

## [4.2.9](https://github.com/elastic/elastic-charts/compare/v4.2.8...v4.2.9) (2019-06-07)


### Bug Fixes

* **chart_resizer:** debounce resize only after initial render ([#229](https://github.com/elastic/elastic-charts/issues/229)) ([96d3fd6](https://github.com/elastic/elastic-charts/commit/96d3fd6)), closes [#109](https://github.com/elastic/elastic-charts/issues/109)

## [4.2.8](https://github.com/elastic/elastic-charts/compare/v4.2.7...v4.2.8) (2019-06-06)


### Bug Fixes

* **crosshair:** adjust band position for rotation ([#220](https://github.com/elastic/elastic-charts/issues/220)) ([ac02021](https://github.com/elastic/elastic-charts/commit/ac02021))

## [4.2.7](https://github.com/elastic/elastic-charts/compare/v4.2.6...v4.2.7) (2019-06-05)


### Bug Fixes

* **axis_title:** remove whitespace with empty axis title ([#226](https://github.com/elastic/elastic-charts/issues/226)) ([74198dc](https://github.com/elastic/elastic-charts/commit/74198dc)), closes [#225](https://github.com/elastic/elastic-charts/issues/225)

## [4.2.6](https://github.com/elastic/elastic-charts/compare/v4.2.5...v4.2.6) (2019-05-21)


### Bug Fixes

* **build:** compile module resolution in commonjs ([#214](https://github.com/elastic/elastic-charts/issues/214)) ([29e2a34](https://github.com/elastic/elastic-charts/commit/29e2a34))

## [4.2.5](https://github.com/elastic/elastic-charts/compare/v4.2.4...v4.2.5) (2019-05-21)


### Bug Fixes

* **build:** change build target to ES5 ([#211](https://github.com/elastic/elastic-charts/issues/211)) ([39b727e](https://github.com/elastic/elastic-charts/commit/39b727e))

## [4.2.4](https://github.com/elastic/elastic-charts/compare/v4.2.3...v4.2.4) (2019-05-21)


### Bug Fixes

* **eui:** generate css without EUI classes ([#210](https://github.com/elastic/elastic-charts/issues/210)) ([776387b](https://github.com/elastic/elastic-charts/commit/776387b))

## [4.2.3](https://github.com/elastic/elastic-charts/compare/v4.2.2...v4.2.3) (2019-05-20)


### Bug Fixes

* **legend:** avoid expanding label on click ([#209](https://github.com/elastic/elastic-charts/issues/209)) ([22cad8e](https://github.com/elastic/elastic-charts/commit/22cad8e))

## [4.2.2](https://github.com/elastic/elastic-charts/compare/v4.2.1...v4.2.2) (2019-05-20)


### Bug Fixes

* **ie11:** fix deps and layout compatibility issues on IE11 ([9555e2a](https://github.com/elastic/elastic-charts/commit/9555e2a)), closes [#184](https://github.com/elastic/elastic-charts/issues/184)

## [4.2.1](https://github.com/elastic/elastic-charts/compare/v4.2.0...v4.2.1) (2019-05-09)


### Bug Fixes

* **eui:** update EUI dependency to 11.0.0 ([#206](https://github.com/elastic/elastic-charts/issues/206)) ([24779cb](https://github.com/elastic/elastic-charts/commit/24779cb))

# [4.2.0](https://github.com/elastic/elastic-charts/compare/v4.1.0...v4.2.0) (2019-05-06)


### Features

* **rect_annotation:** add RectAnnotation type ([#180](https://github.com/elastic/elastic-charts/issues/180)) ([b339318](https://github.com/elastic/elastic-charts/commit/b339318))

# [4.1.0](https://github.com/elastic/elastic-charts/compare/v4.0.2...v4.1.0) (2019-05-04)


### Features

* add option to toggle value labels on bar charts ([#182](https://github.com/elastic/elastic-charts/issues/182)) ([6d8ec0e](https://github.com/elastic/elastic-charts/commit/6d8ec0e))

## [4.0.2](https://github.com/elastic/elastic-charts/compare/v4.0.1...v4.0.2) (2019-05-03)


### Bug Fixes

* **scales:** improve ticks for time domains spanning a DST switch ([#204](https://github.com/elastic/elastic-charts/issues/204)) ([2713336](https://github.com/elastic/elastic-charts/commit/2713336))

## [4.0.1](https://github.com/elastic/elastic-charts/compare/v4.0.0...v4.0.1) (2019-05-02)


### Bug Fixes

* **scales:** use bisect to handle invertWithStep ([#200](https://github.com/elastic/elastic-charts/issues/200)) ([f971d05](https://github.com/elastic/elastic-charts/commit/f971d05)), closes [#195](https://github.com/elastic/elastic-charts/issues/195) [#183](https://github.com/elastic/elastic-charts/issues/183)

# [4.0.0](https://github.com/elastic/elastic-charts/compare/v3.11.4...v4.0.0) (2019-04-28)


### Features

* **scales:** add paddings between bars ([#190](https://github.com/elastic/elastic-charts/issues/190)) ([e2e4a33](https://github.com/elastic/elastic-charts/commit/e2e4a33))


### BREAKING CHANGES

* **scales:** the `ScalesConfig` type of the theme is changed from `{ordinal:{padding: number}}` to `{barsPadding: number}`

## [3.11.4](https://github.com/elastic/elastic-charts/compare/v3.11.3...v3.11.4) (2019-04-26)


### Bug Fixes

* **bars:** remove border visibility based on bar width ([#192](https://github.com/elastic/elastic-charts/issues/192)) ([a270bab](https://github.com/elastic/elastic-charts/commit/a270bab)), closes [#189](https://github.com/elastic/elastic-charts/issues/189)

## [3.11.3](https://github.com/elastic/elastic-charts/compare/v3.11.2...v3.11.3) (2019-04-24)


### Bug Fixes

* merge multi-group indexed geometry ([#187](https://github.com/elastic/elastic-charts/issues/187)) ([8047c29](https://github.com/elastic/elastic-charts/commit/8047c29)), closes [#186](https://github.com/elastic/elastic-charts/issues/186)

## [3.11.2](https://github.com/elastic/elastic-charts/compare/v3.11.1...v3.11.2) (2019-04-16)


### Bug Fixes

* cleanup example prop default values ([#173](https://github.com/elastic/elastic-charts/issues/173)) ([ab19df0](https://github.com/elastic/elastic-charts/commit/ab19df0))

## [3.11.1](https://github.com/elastic/elastic-charts/compare/v3.11.0...v3.11.1) (2019-04-16)


### Bug Fixes

* apply transform.x to area & line geometries ([#172](https://github.com/elastic/elastic-charts/issues/172)) ([da4f07f](https://github.com/elastic/elastic-charts/commit/da4f07f))

# [3.11.0](https://github.com/elastic/elastic-charts/compare/v3.10.2...v3.11.0) (2019-04-16)


### Bug Fixes

* remove old specs with changed ids ([#167](https://github.com/elastic/elastic-charts/issues/167)) ([6c4f705](https://github.com/elastic/elastic-charts/commit/6c4f705))


### Features

* allow individual series styling ([#170](https://github.com/elastic/elastic-charts/issues/170)) ([c780d98](https://github.com/elastic/elastic-charts/commit/c780d98))

## [3.10.2](https://github.com/elastic/elastic-charts/compare/v3.10.1...v3.10.2) (2019-04-12)


### Bug Fixes

* **exports:** fix missing exports for annotations ([#166](https://github.com/elastic/elastic-charts/issues/166)) ([fe28afb](https://github.com/elastic/elastic-charts/commit/fe28afb))

## [3.10.1](https://github.com/elastic/elastic-charts/compare/v3.10.0...v3.10.1) (2019-04-11)


### Bug Fixes

* temporary disable animation ([#164](https://github.com/elastic/elastic-charts/issues/164)) ([80b3231](https://github.com/elastic/elastic-charts/commit/80b3231)), closes [#89](https://github.com/elastic/elastic-charts/issues/89) [#41](https://github.com/elastic/elastic-charts/issues/41) [#161](https://github.com/elastic/elastic-charts/issues/161)
* temporary disable animation ([#164](https://github.com/elastic/elastic-charts/issues/164)) ([c53c8a6](https://github.com/elastic/elastic-charts/commit/c53c8a6)), closes [#89](https://github.com/elastic/elastic-charts/issues/89) [#41](https://github.com/elastic/elastic-charts/issues/41) [#161](https://github.com/elastic/elastic-charts/issues/161)

# [3.10.0](https://github.com/elastic/elastic-charts/compare/v3.9.0...v3.10.0) (2019-04-11)


### Features

* add band area chart ([#157](https://github.com/elastic/elastic-charts/issues/157)) ([a9307ef](https://github.com/elastic/elastic-charts/commit/a9307ef)), closes [#144](https://github.com/elastic/elastic-charts/issues/144)

# [3.9.0](https://github.com/elastic/elastic-charts/compare/v3.8.0...v3.9.0) (2019-04-10)


### Features

* **legend:** display series value (dependent on hover) & sort in legend ([#155](https://github.com/elastic/elastic-charts/issues/155)) ([78af858](https://github.com/elastic/elastic-charts/commit/78af858))

# [3.8.0](https://github.com/elastic/elastic-charts/compare/v3.7.2...v3.8.0) (2019-04-08)


### Features

* **line_annotation:** add hideLines and hideTooltips props to spec ([#154](https://github.com/elastic/elastic-charts/issues/154)) ([ba806b1](https://github.com/elastic/elastic-charts/commit/ba806b1))

## [3.7.2](https://github.com/elastic/elastic-charts/compare/v3.7.1...v3.7.2) (2019-04-08)


### Bug Fixes

* **timescale:** consider timezone on axis ticks ([#151](https://github.com/elastic/elastic-charts/issues/151)) ([d860c97](https://github.com/elastic/elastic-charts/commit/d860c97)), closes [#130](https://github.com/elastic/elastic-charts/issues/130)

## [3.7.1](https://github.com/elastic/elastic-charts/compare/v3.7.0...v3.7.1) (2019-04-05)


### Bug Fixes

* **domain:** set domain bounds dependent on negative/positive values ([#149](https://github.com/elastic/elastic-charts/issues/149)) ([5b16be6](https://github.com/elastic/elastic-charts/commit/5b16be6))

# [3.7.0](https://github.com/elastic/elastic-charts/compare/v3.6.0...v3.7.0) (2019-04-04)


### Features

* **legend:** hide legend item if hideLegendItem on series spec is true ([#147](https://github.com/elastic/elastic-charts/issues/147)) ([6761c2b](https://github.com/elastic/elastic-charts/commit/6761c2b))

# [3.6.0](https://github.com/elastic/elastic-charts/compare/v3.5.1...v3.6.0) (2019-04-04)


### Features

* **annotations:** render line annotations via LineAnnotation spec ([#126](https://github.com/elastic/elastic-charts/issues/126)) ([98ff170](https://github.com/elastic/elastic-charts/commit/98ff170))

## [3.5.1](https://github.com/elastic/elastic-charts/compare/v3.5.0...v3.5.1) (2019-04-02)


### Bug Fixes

* **build:** fix dependencies for kibana integration ([#146](https://github.com/elastic/elastic-charts/issues/146)) ([b875e3d](https://github.com/elastic/elastic-charts/commit/b875e3d)), closes [#145](https://github.com/elastic/elastic-charts/issues/145)

# [3.5.0](https://github.com/elastic/elastic-charts/compare/v3.4.5...v3.5.0) (2019-04-01)


### Bug Fixes

* **areachart:** fix misaligned rendering props  ([#141](https://github.com/elastic/elastic-charts/issues/141)) ([9694b5b](https://github.com/elastic/elastic-charts/commit/9694b5b)), closes [#140](https://github.com/elastic/elastic-charts/issues/140)


### Features

* **specs:** add name to series specs ([#142](https://github.com/elastic/elastic-charts/issues/142)) ([a6e6f49](https://github.com/elastic/elastic-charts/commit/a6e6f49)), closes [#136](https://github.com/elastic/elastic-charts/issues/136)

## [3.4.5](https://github.com/elastic/elastic-charts/compare/v3.4.4...v3.4.5) (2019-03-29)


### Bug Fixes

* **animation:** re-enabled animateData prop to disable animation ([#129](https://github.com/elastic/elastic-charts/issues/129)) ([32b4263](https://github.com/elastic/elastic-charts/commit/32b4263))
* **specs:** limit xScaleType to linear, time and ordinal ([#127](https://github.com/elastic/elastic-charts/issues/127)) ([59c3b70](https://github.com/elastic/elastic-charts/commit/59c3b70)), closes [#122](https://github.com/elastic/elastic-charts/issues/122)

## [3.4.4](https://github.com/elastic/elastic-charts/compare/v3.4.3...v3.4.4) (2019-03-28)


### Bug Fixes

* **crosshair:** use offsetX/Y instead of clientX/Y ([#128](https://github.com/elastic/elastic-charts/issues/128)) ([7c1155f](https://github.com/elastic/elastic-charts/commit/7c1155f)), closes [#123](https://github.com/elastic/elastic-charts/issues/123)

## [3.4.3](https://github.com/elastic/elastic-charts/compare/v3.4.2...v3.4.3) (2019-03-26)


### Bug Fixes

* **chart_state:** maintain series visibility state on props update ([#118](https://github.com/elastic/elastic-charts/issues/118)) ([18e7784](https://github.com/elastic/elastic-charts/commit/18e7784))

## [3.4.2](https://github.com/elastic/elastic-charts/compare/v3.4.1...v3.4.2) (2019-03-26)


### Bug Fixes

* **rendering:** fix rendering values <= 0 on log scale ([#114](https://github.com/elastic/elastic-charts/issues/114)) ([9d7b159](https://github.com/elastic/elastic-charts/commit/9d7b159)), closes [#112](https://github.com/elastic/elastic-charts/issues/112) [#63](https://github.com/elastic/elastic-charts/issues/63)

## [3.4.1](https://github.com/elastic/elastic-charts/compare/v3.4.0...v3.4.1) (2019-03-26)


### Bug Fixes

* **brushing:** enable mouseup event outside chart element ([#120](https://github.com/elastic/elastic-charts/issues/120)) ([77d62f6](https://github.com/elastic/elastic-charts/commit/77d62f6)), closes [#119](https://github.com/elastic/elastic-charts/issues/119)

# [3.4.0](https://github.com/elastic/elastic-charts/compare/v3.3.1...v3.4.0) (2019-03-25)


### Features

* allow partial custom domain ([#116](https://github.com/elastic/elastic-charts/issues/116)) ([d0b6b19](https://github.com/elastic/elastic-charts/commit/d0b6b19))

## [3.3.1](https://github.com/elastic/elastic-charts/compare/v3.3.0...v3.3.1) (2019-03-25)


### Bug Fixes

* **chart:** fix duplicated keys for chart elements ([#115](https://github.com/elastic/elastic-charts/issues/115)) ([6f12067](https://github.com/elastic/elastic-charts/commit/6f12067))

# [3.3.0](https://github.com/elastic/elastic-charts/compare/v3.2.0...v3.3.0) (2019-03-22)


### Features

* **interactions:** crosshair ([5ddd1a8](https://github.com/elastic/elastic-charts/commit/5ddd1a8)), closes [#80](https://github.com/elastic/elastic-charts/issues/80) [#58](https://github.com/elastic/elastic-charts/issues/58) [#88](https://github.com/elastic/elastic-charts/issues/88)

# [3.2.0](https://github.com/elastic/elastic-charts/compare/v3.1.1...v3.2.0) (2019-03-19)


### Features

* **domain:** scale data to a specific domain via axis spec ([#98](https://github.com/elastic/elastic-charts/issues/98)) ([b039ebf](https://github.com/elastic/elastic-charts/commit/b039ebf))

## [3.1.1](https://github.com/elastic/elastic-charts/compare/v3.1.0...v3.1.1) (2019-03-19)


### Bug Fixes

* **npm:** add missing generated file to npm package ([6dd9140](https://github.com/elastic/elastic-charts/commit/6dd9140))

# [3.1.0](https://github.com/elastic/elastic-charts/compare/v3.0.1...v3.1.0) (2019-03-11)


### Features

* **series:** set custom series colors through spec prop ([#95](https://github.com/elastic/elastic-charts/issues/95)) ([fb09dc9](https://github.com/elastic/elastic-charts/commit/fb09dc9))

## [3.0.1](https://github.com/elastic/elastic-charts/compare/v3.0.0...v3.0.1) (2019-03-08)


### Bug Fixes

* **canvas_text_bbox_calculator:** increase font scaling factor ([#93](https://github.com/elastic/elastic-charts/issues/93)) ([f6a1f1d](https://github.com/elastic/elastic-charts/commit/f6a1f1d))

# [3.0.0](https://github.com/elastic/elastic-charts/compare/v2.1.0...v3.0.0) (2019-03-06)


### Bug Fixes

* **scale:** return ticks in millis for time scales for line/area charts ([8b46283](https://github.com/elastic/elastic-charts/commit/8b46283))


### BREAKING CHANGES

* **scale:** The  props callback is called with millis instead of Date for axis on line or area only charts.

# [2.1.0](https://github.com/elastic/elastic-charts/compare/v2.0.0...v2.1.0) (2019-03-06)


### Features

* **legend/click:** add click interations on legend titles ([#51](https://github.com/elastic/elastic-charts/issues/51)) ([7d6139d](https://github.com/elastic/elastic-charts/commit/7d6139d))

# [2.0.0](https://github.com/elastic/elastic-charts/compare/v1.1.1...v2.0.0) (2019-02-19)


### Features

* add dark theme ([#44](https://github.com/elastic/elastic-charts/issues/44)) ([766f1ad](https://github.com/elastic/elastic-charts/commit/766f1ad)), closes [#35](https://github.com/elastic/elastic-charts/issues/35)


### BREAKING CHANGES

* The `Theme.AxisConfig` type has a different signature.
It now contains `axisTitleStyle`, `axisLineStyle`, `tickLabelStyle` and
`tickLineStyle` defined as `TextStyle` or `StrokeStyle` elements.
The `Theme` interface is changed in a more flat structure.
`darkMode` prop from `Setting` is removed.
`theme` prop in `Setting` is now a `Theme` type object, not a `PartialTheme`.
You can use `mergeWithDefaultTheme` function to merge an existing theme
with a partial one.

## [1.1.1](https://github.com/elastic/elastic-charts/compare/v1.1.0...v1.1.1) (2019-02-15)


### Bug Fixes

* limit log scale domain ([f7679a8](https://github.com/elastic/elastic-charts/commit/f7679a8)), closes [#21](https://github.com/elastic/elastic-charts/issues/21)

# [1.1.0](https://github.com/elastic/elastic-charts/compare/v1.0.2...v1.1.0) (2019-02-14)


### Features

* **legend/series:** add hover interaction on legend items ([#31](https://github.com/elastic/elastic-charts/issues/31)) ([c56a252](https://github.com/elastic/elastic-charts/commit/c56a252)), closes [#24](https://github.com/elastic/elastic-charts/issues/24)

## [1.0.2](https://github.com/elastic/elastic-charts/compare/v1.0.1...v1.0.2) (2019-02-08)


### Bug Fixes

* **offscreen canvas:** set negative position to move offscreen ([#50](https://github.com/elastic/elastic-charts/issues/50)) ([0f61ac8](https://github.com/elastic/elastic-charts/commit/0f61ac8)), closes [#43](https://github.com/elastic/elastic-charts/issues/43)

## [1.0.1](https://github.com/elastic/elastic-charts/compare/v1.0.0...v1.0.1) (2019-02-07)


### Bug Fixes

* **axis labels:** offset previous space correctly ([#45](https://github.com/elastic/elastic-charts/issues/45)) ([ff2a47a](https://github.com/elastic/elastic-charts/commit/ff2a47a)), closes [#42](https://github.com/elastic/elastic-charts/issues/42)

# 1.0.0 (2019-02-07)


### Bug Fixes

* reflect specs ids on legend items when using single series ([8b39f15](https://github.com/elastic/elastic-charts/commit/8b39f15))
* **axis:** add axisTitleHeight to axis increments ([#29](https://github.com/elastic/elastic-charts/issues/29)) ([e34f0ae](https://github.com/elastic/elastic-charts/commit/e34f0ae)), closes [#26](https://github.com/elastic/elastic-charts/issues/26)
* **axis:** fix horizontal title positioning to account for title padding ([08d1f83](https://github.com/elastic/elastic-charts/commit/08d1f83))
* **axis:** scale tick labels to fix text truncation on chrome ([#38](https://github.com/elastic/elastic-charts/issues/38)) ([99c2332](https://github.com/elastic/elastic-charts/commit/99c2332)), closes [#18](https://github.com/elastic/elastic-charts/issues/18)
* **axis:** use titleFontSize for debug rect for horizontal axis title ([#17](https://github.com/elastic/elastic-charts/issues/17)) ([af4aa58](https://github.com/elastic/elastic-charts/commit/af4aa58)), closes [#11](https://github.com/elastic/elastic-charts/issues/11)
* **dimensions:** use chart top padding in computation of chart height ([42585f7](https://github.com/elastic/elastic-charts/commit/42585f7)), closes [#13](https://github.com/elastic/elastic-charts/issues/13)
* **x_domain:** fix x value asc sorting using numbers ([26b33ff](https://github.com/elastic/elastic-charts/commit/26b33ff))


### Features

* add tickLabelRotation and showGridLines features ([#7](https://github.com/elastic/elastic-charts/issues/7)) ([47f118b](https://github.com/elastic/elastic-charts/commit/47f118b))
* **axis:** draw grid lines separately from axis tick and customize style with config ([#8](https://github.com/elastic/elastic-charts/issues/8)) ([ab7e974](https://github.com/elastic/elastic-charts/commit/ab7e974))
