# [30.0.0](https://github.com/elastic/elastic-charts/compare/v29.2.0...v30.0.0) (2021-06-04)


### Bug Fixes

* **domain:** custom domain should not filter data ([#1181](https://github.com/elastic/elastic-charts/issues/1181)) ([76e8dca](https://github.com/elastic/elastic-charts/commit/76e8dcafd11452359ff54c8e05eeafa45c380c6a)), closes [#1129](https://github.com/elastic/elastic-charts/issues/1129)
* **value_labels:** zero as a valid value for textBorder and borderWidth ([#1182](https://github.com/elastic/elastic-charts/issues/1182)) ([a64f333](https://github.com/elastic/elastic-charts/commit/a64f33321d80ea70d3010da50e6c8f9f9bf23620))
* annotation tooltip display when remounting specs ([#1167](https://github.com/elastic/elastic-charts/issues/1167)) ([8408600](https://github.com/elastic/elastic-charts/commit/840860019a78896dbde91372b2445da9b6e8403e))
* render nodeLabel formatted text into the nodes ([#1173](https://github.com/elastic/elastic-charts/issues/1173)) ([b44bdff](https://github.com/elastic/elastic-charts/commit/b44bdff9049802968d095d440a874daa904d6f1e))


### Features

* **axis:** allow pixel domain padding for y axes  ([#1145](https://github.com/elastic/elastic-charts/issues/1145)) ([7c1fa8e](https://github.com/elastic/elastic-charts/commit/7c1fa8e817c997eaa0c232db3b15ce92baf35a59))
* apply value formatter to the default legend item label ([#1190](https://github.com/elastic/elastic-charts/issues/1190)) ([71474a5](https://github.com/elastic/elastic-charts/commit/71474a5b7a12d522196ea71d866a572caa2fbf1f))
* **tooltip:** stickTo vertical middle of the cursor ([#1163](https://github.com/elastic/elastic-charts/issues/1163)) ([380363b](https://github.com/elastic/elastic-charts/commit/380363bfb8fc02a3eb22d5832edddba76438314d)), closes [#1108](https://github.com/elastic/elastic-charts/issues/1108)
* **wordcloud:** click and over events on text ([#1180](https://github.com/elastic/elastic-charts/issues/1180)) ([196fb6a](https://github.com/elastic/elastic-charts/commit/196fb6a644333ff16ccf1729b1aaa7d0a92fe21d)), closes [#1156](https://github.com/elastic/elastic-charts/issues/1156)


### BREAKING CHANGES

* **value_labels:** the `textBorder` of `ValueFillDefinition` is now optional or a number only
* **axis:** `domain.padding` now only takes a `number` value. If you are using a percent-based padding such as `'10%'` please set `domain.padding` to `0.1` and `domain.paddingUnit` to `DomainPaddingUnit.DomainRatio`.
* **axis:** `yScaleToDataExtent` is removed in favor of `domain.fit`. The functionality is the
same.

# [29.2.0](https://github.com/elastic/elastic-charts/compare/v29.1.0...v29.2.0) (2021-05-25)


### Bug Fixes

* **legend:** disable handleLabelClick for one legend item ([#1134](https://github.com/elastic/elastic-charts/issues/1134)) ([a7242af](https://github.com/elastic/elastic-charts/commit/a7242af3fe22db0b5cd4d8776e150972a665f242)), closes [#1055](https://github.com/elastic/elastic-charts/issues/1055)


### Features

* **a11y:** add alt text for all chart types  ([#1118](https://github.com/elastic/elastic-charts/issues/1118)) ([9e42229](https://github.com/elastic/elastic-charts/commit/9e42229b9fba27ca4396d76f45f4bf5785e445b0)), closes [#1107](https://github.com/elastic/elastic-charts/issues/1107)
* **legend:** specify number of columns on floating legend ([#1159](https://github.com/elastic/elastic-charts/issues/1159)) ([c2e4652](https://github.com/elastic/elastic-charts/commit/c2e465224d3e56790f6c9d3c5e0f4083051c38e1)), closes [#1158](https://github.com/elastic/elastic-charts/issues/1158)
* simple screenspace constraint solver ([#1141](https://github.com/elastic/elastic-charts/issues/1141)) ([eb11480](https://github.com/elastic/elastic-charts/commit/eb11480e2c8a1651c6449decc46b3cdf7311f68f))

# [29.1.0](https://github.com/elastic/elastic-charts/compare/v29.0.0...v29.1.0) (2021-04-23)


### Bug Fixes

* **interaction:** remove unnecessary elements ([#1131](https://github.com/elastic/elastic-charts/issues/1131)) ([411042f](https://github.com/elastic/elastic-charts/commit/411042fdbc8252a217f2e655fc12c0723c39cad1)), closes [#1074](https://github.com/elastic/elastic-charts/issues/1074)
* **partition:**  fix safari highlight bug on single slice ([#1132](https://github.com/elastic/elastic-charts/issues/1132)) ([4a04063](https://github.com/elastic/elastic-charts/commit/4a04063d68a3db27990eb460c00d7007aad4f169)), closes [#1085](https://github.com/elastic/elastic-charts/issues/1085)


### Features

* **tooltip:** add stickTo option ([#1122](https://github.com/elastic/elastic-charts/issues/1122)) ([12417e2](https://github.com/elastic/elastic-charts/commit/12417e2c03588202da0567cd0056393f00d990e6)), closes [#921](https://github.com/elastic/elastic-charts/issues/921)

# [29.0.0](https://github.com/elastic/elastic-charts/compare/v28.2.0...v29.0.0) (2021-04-22)


### Features

* **a11y:** add label for screen readers ([#1121](https://github.com/elastic/elastic-charts/issues/1121)) ([920e585](https://github.com/elastic/elastic-charts/commit/920e5856d4c52416c0ea394e5605bb756266b178)), closes [#1096](https://github.com/elastic/elastic-charts/issues/1096)
* **annotations:** marker body with dynamic positioning ([#1116](https://github.com/elastic/elastic-charts/issues/1116)) ([601abac](https://github.com/elastic/elastic-charts/commit/601abacc4247755ad1203439e6e95c6fa8574ab2))


### BREAKING CHANGES

* **a11y:** `description` prop in `<Settings/>` is renamed to `ariaDescription`

Co-authored-by: Marco Vettorello <vettorello.marco@gmail.com>

# [28.2.0](https://github.com/elastic/elastic-charts/compare/v28.1.0...v28.2.0) (2021-04-15)


### Bug Fixes

* **xy:** consider `useDefaultGroupDomain` on scale config ([#1119](https://github.com/elastic/elastic-charts/issues/1119)) ([c1b59f2](https://github.com/elastic/elastic-charts/commit/c1b59f249a1fdfc5d6f714de8db99cbf7a16c6eb)), closes [#1087](https://github.com/elastic/elastic-charts/issues/1087)


### Features

* **a11y:** allow user to pass custom description for screen readers ([#1111](https://github.com/elastic/elastic-charts/issues/1111)) ([2ee1b91](https://github.com/elastic/elastic-charts/commit/2ee1b912f58cff4964786ce6586b07390bbed0b3)), closes [#1097](https://github.com/elastic/elastic-charts/issues/1097)
* **partition:** add debuggable state ([#1117](https://github.com/elastic/elastic-charts/issues/1117)) ([d7fc206](https://github.com/elastic/elastic-charts/commit/d7fc2068ca5febba06e25cf67b91cf9d203bc5d3)), closes [#917](https://github.com/elastic/elastic-charts/issues/917)

# [28.1.0](https://github.com/elastic/elastic-charts/compare/v28.0.1...v28.1.0) (2021-04-13)


### Bug Fixes

* **legend:** sizing for short labels with scrollbar ([#1115](https://github.com/elastic/elastic-charts/issues/1115)) ([6e1f223](https://github.com/elastic/elastic-charts/commit/6e1f223d5126c2707101d269ebaa5dc117ac61c4))
* **xy:** negative bar highlight and click ([#1109](https://github.com/elastic/elastic-charts/issues/1109)) ([ec17cb2](https://github.com/elastic/elastic-charts/commit/ec17cb2eb2f13e0be4370a2dc89d3872f9b6de5a)), closes [#1100](https://github.com/elastic/elastic-charts/issues/1100)


### Features

* **a11y:** improve chart figure ([#1104](https://github.com/elastic/elastic-charts/issues/1104)) ([815cf39](https://github.com/elastic/elastic-charts/commit/815cf39873e3e1f0a526dd88bb06c2b87f22f9e8))
* **partition:** order slices and sectors ([#1112](https://github.com/elastic/elastic-charts/issues/1112)) ([74df29b](https://github.com/elastic/elastic-charts/commit/74df29b5554eaa5b88c670c71321ce676683da6f))
* **partitions:** small multipies events pass on smAccessorValue ([#1106](https://github.com/elastic/elastic-charts/issues/1106)) ([a3234fe](https://github.com/elastic/elastic-charts/commit/a3234feee9e579cf7bdb21d487f80c8200a0fa73))
* **xy:** optionally rounds the domain to nice values ([#1087](https://github.com/elastic/elastic-charts/issues/1087)) ([f644cc4](https://github.com/elastic/elastic-charts/commit/f644cc4653bf4bea3180057b981f80bdcabee00f))
* **xy:** specify pixel and ratio width for bars ([#1114](https://github.com/elastic/elastic-charts/issues/1114)) ([58de413](https://github.com/elastic/elastic-charts/commit/58de413564a5f0b9a8bef9f5cb2119cdde18794f))
* mosaic ([#1113](https://github.com/elastic/elastic-charts/issues/1113)) ([64bdd88](https://github.com/elastic/elastic-charts/commit/64bdd88836210a4c4c997dc207859c3fbd773d80))

## [28.0.1](https://github.com/elastic/elastic-charts/compare/v28.0.0...v28.0.1) (2021-04-06)


### Bug Fixes

* filter out zero values on fitted log domains ([#1057](https://github.com/elastic/elastic-charts/issues/1057)) ([88d71ff](https://github.com/elastic/elastic-charts/commit/88d71ff810d33756d5c568b7f5c603a84837490d))

# [28.0.0](https://github.com/elastic/elastic-charts/compare/v27.0.0...v28.0.0) (2021-04-02)


### Bug Fixes

* **annotations:** provide fallback for line annotation markers ([#1091](https://github.com/elastic/elastic-charts/issues/1091)) ([0bd61f1](https://github.com/elastic/elastic-charts/commit/0bd61f198743461c267eed74706797b49508e250))
* **legend:** action sizing ui and focus states ([#1102](https://github.com/elastic/elastic-charts/issues/1102)) ([3a76a2c](https://github.com/elastic/elastic-charts/commit/3a76a2c3977983f8eec1c88d0b4cb73bc5d1e8ee))
* **legend:** stop legend color picker dot twitching ([#1101](https://github.com/elastic/elastic-charts/issues/1101)) ([c89b767](https://github.com/elastic/elastic-charts/commit/c89b767c698b677cef96da365901dc046d6e27a8))


### Code Refactoring

* rename enum types to singular ([#1064](https://github.com/elastic/elastic-charts/issues/1064)) ([396b3d1](https://github.com/elastic/elastic-charts/commit/396b3d1aefc995b89c6acb369c19a82f2a68d7b5)), closes [#767](https://github.com/elastic/elastic-charts/issues/767)


### BREAKING CHANGES

* `AnnotationDomainTypes`, `AnnotationTypes`, `SeriesTypes`, `ChartTypes`, and `SpecTypes` are renamed to `AnnotationDomainType`, `AnnotationType`, `SeriesType`, `ChartType`, and `SpecType`

# [27.0.0](https://github.com/elastic/elastic-charts/compare/v26.1.0...v27.0.0) (2021-03-31)


### Features

* **partitions:** Small multiples legends ([#1094](https://github.com/elastic/elastic-charts/issues/1094)) ([c39d113](https://github.com/elastic/elastic-charts/commit/c39d11388f74bbaef1dc2ed0b4febabd25b35241))


### BREAKING CHANGES

* **partitions:** the `flatLegend` (true) option yields alphabetical, formatted name based sorting for unique name/color occurrences, to make it easy for the user to look up names in the legend as it's alphabetically sorted

# [26.1.0](https://github.com/elastic/elastic-charts/compare/v26.0.0...v26.1.0) (2021-03-26)


### Features

* **a11y:** add basic aria-label to canvas element ([#1084](https://github.com/elastic/elastic-charts/issues/1084)) ([1a5aef7](https://github.com/elastic/elastic-charts/commit/1a5aef772315786eba8c623f728a72475d7f91d4))
* **xy_charts:** render legend inside the chart ([#1031](https://github.com/elastic/elastic-charts/issues/1031)) ([ba88122](https://github.com/elastic/elastic-charts/commit/ba8812213d6d6463f66f267cc095928d1a7a2abe)), closes [#861](https://github.com/elastic/elastic-charts/issues/861)

# [26.0.0](https://github.com/elastic/elastic-charts/compare/v25.4.0...v26.0.0) (2021-03-23)


### Features

* **partition:** small multiples ([#1076](https://github.com/elastic/elastic-charts/issues/1076)) ([282082b](https://github.com/elastic/elastic-charts/commit/282082b0316d8e2fe5229761112cd209d70802b8))


### BREAKING CHANGES

* **partition:** clarifies the inner/outer padding notation `<SmallMultiples style={{horizontalPanelPadding, verticalPanelPadding}}` from `[outer, inner]` to `{outer, inner}`—they still have the same effect

# [25.4.0](https://github.com/elastic/elastic-charts/compare/v25.3.0...v25.4.0) (2021-03-23)


### Bug Fixes

* chromium area path render bug ([#1067](https://github.com/elastic/elastic-charts/issues/1067)) ([e16d15d](https://github.com/elastic/elastic-charts/commit/e16d15d92add87f0bfe580a7301975915c10c381))


### Features

* **tooltip:** expose datum in the TooltipValue ([#1082](https://github.com/elastic/elastic-charts/issues/1082)) ([0246784](https://github.com/elastic/elastic-charts/commit/0246784bf4f88b374b7a28ffa4a60380f4c162b4)), closes [#1042](https://github.com/elastic/elastic-charts/issues/1042)
* **wordcloud:** wordcloud ([#1038](https://github.com/elastic/elastic-charts/issues/1038)) ([f08f4c9](https://github.com/elastic/elastic-charts/commit/f08f4c9b7472d8c81a0fa56cd7dc7018eed637ad))

# [25.3.0](https://github.com/elastic/elastic-charts/compare/v25.2.0...v25.3.0) (2021-03-11)


### Bug Fixes

* **brush:** force brush tool per panel ([#1071](https://github.com/elastic/elastic-charts/issues/1071)) ([8f866fc](https://github.com/elastic/elastic-charts/commit/8f866fca9c99ebf675fd31bf57b4b63d9f2eed09)), closes [#1070](https://github.com/elastic/elastic-charts/issues/1070)


### Features

* debug state for the heatmap chart  ([#976](https://github.com/elastic/elastic-charts/issues/976)) ([2ae2bbc](https://github.com/elastic/elastic-charts/commit/2ae2bbcb85e26c62a18cad2d4d6a4e4fc1ab29eb))

# [25.2.0](https://github.com/elastic/elastic-charts/compare/v25.1.1...v25.2.0) (2021-03-09)


### Bug Fixes

* **tooltip:** add boundary padding ([#1065](https://github.com/elastic/elastic-charts/issues/1065)) ([25a247e](https://github.com/elastic/elastic-charts/commit/25a247ef043d3ba2a5029f68ebcfebb6493df8ab))


### Features

* **partition:** flame and icicle performance and tweening ([#1041](https://github.com/elastic/elastic-charts/issues/1041)) ([a9648a4](https://github.com/elastic/elastic-charts/commit/a9648a40d4aa06f5c715f293121d278543aec94c))

## [25.1.1](https://github.com/elastic/elastic-charts/compare/v25.1.0...v25.1.1) (2021-03-05)


### Bug Fixes

* clippedRanges when complete dataset is null ([#1037](https://github.com/elastic/elastic-charts/issues/1037)) ([51418d2](https://github.com/elastic/elastic-charts/commit/51418d2b9feae8b48f568a39975f7152abdf67e5))
* **tooltip:** allow explicit boundary element ([#1049](https://github.com/elastic/elastic-charts/issues/1049)) ([5cf8461](https://github.com/elastic/elastic-charts/commit/5cf8461530e4cac1c1f9918db54e96bf91cdad39))

# [25.1.0](https://github.com/elastic/elastic-charts/compare/v25.0.1...v25.1.0) (2021-03-01)


### Bug Fixes

* rounding values on stacked w percentage charts ([#1039](https://github.com/elastic/elastic-charts/issues/1039)) ([ee63a70](https://github.com/elastic/elastic-charts/commit/ee63a7050f4230e85cd11f83df0d47bc6851cc83))


### Features

* **axis:** log scale limit and base options ([#1032](https://github.com/elastic/elastic-charts/issues/1032)) ([b38d110](https://github.com/elastic/elastic-charts/commit/b38d11083b921bb1e2759640cfa9498087c47b52))
* **partition:** clip text in partition chart fill label ([#1033](https://github.com/elastic/elastic-charts/issues/1033)) ([be9bea0](https://github.com/elastic/elastic-charts/commit/be9bea0f4c4f2a2020dfde7a98d4e9e1baaf8a9a))

## [25.0.1](https://github.com/elastic/elastic-charts/compare/v25.0.0...v25.0.1) (2021-02-17)


### Reverts

* log scale improvements and options ([#1014](https://github.com/elastic/elastic-charts/issues/1014)) ([2189f92](https://github.com/elastic/elastic-charts/commit/2189f927214f6511add0435b3cd1677134a50011))

# [25.0.0](https://github.com/elastic/elastic-charts/compare/v24.6.0...v25.0.0) (2021-02-16)


### Bug Fixes

* group legend items by label and color ([#999](https://github.com/elastic/elastic-charts/issues/999)) ([5d32f23](https://github.com/elastic/elastic-charts/commit/5d32f23487cd458f87b007b841e8bf41bbeccd56))


### Features

* **axis:** log scale improvements and options ([#1014](https://github.com/elastic/elastic-charts/issues/1014)) ([0f52688](https://github.com/elastic/elastic-charts/commit/0f52688ba0f187b25d8790d394550abb14179225))


### BREAKING CHANGES

* The `LegendActionProps` and the `LegendColorPickerProps`, used to add actions and color picker through the legend now receive an array of `SeriesIdentifiers`

# [24.6.0](https://github.com/elastic/elastic-charts/compare/v24.5.1...v24.6.0) (2021-02-15)


### Bug Fixes

* **legend:** width with scroll bar ([#1019](https://github.com/elastic/elastic-charts/issues/1019)) ([45bd0d5](https://github.com/elastic/elastic-charts/commit/45bd0d5322cd547d88d5a618e4ae6e2aa4ec989c))


### Features

* sort values in actions by closest to cursor ([#1023](https://github.com/elastic/elastic-charts/issues/1023)) ([e1da4e5](https://github.com/elastic/elastic-charts/commit/e1da4e578f619f19813c7c3172ca2c972fe188a2))
* **axis:** small multiples axis improvements ([#1004](https://github.com/elastic/elastic-charts/issues/1004)) ([514466f](https://github.com/elastic/elastic-charts/commit/514466f557a5ef9a06ea35f0f091bcf33bfd8ae6))
* **partition:** drilldown ([#995](https://github.com/elastic/elastic-charts/issues/995)) ([20bbdae](https://github.com/elastic/elastic-charts/commit/20bbdaeade4134fef0e0f486af3693bf348733d4))

## [24.5.1](https://github.com/elastic/elastic-charts/compare/v24.5.0...v24.5.1) (2021-02-05)


### Bug Fixes

* missing exported types ([#1005](https://github.com/elastic/elastic-charts/issues/1005)) ([f6806de](https://github.com/elastic/elastic-charts/commit/f6806de28198e2a288039e78d585e3c8383722e7))

# [24.5.0](https://github.com/elastic/elastic-charts/compare/v24.4.0...v24.5.0) (2021-01-30)


### Bug Fixes

* add theme min radius to point shape ([#996](https://github.com/elastic/elastic-charts/issues/996)) ([eb37175](https://github.com/elastic/elastic-charts/commit/eb3717584a5db5a0ea56fdcfea1839c23d92900b))
* align tooltip z-index to EUI tooltip z-index ([#931](https://github.com/elastic/elastic-charts/issues/931)) ([ffd626b](https://github.com/elastic/elastic-charts/commit/ffd626baa8bc7ba3c00b8f5257ce9bac7d72c660))
* chart state and series functions cleanup ([#989](https://github.com/elastic/elastic-charts/issues/989)) ([944ac6c](https://github.com/elastic/elastic-charts/commit/944ac6cf1ce12f9993411cf44bb3fa51f25b1241))
* create unique ids for dot icons ([#971](https://github.com/elastic/elastic-charts/issues/971)) ([e1ce768](https://github.com/elastic/elastic-charts/commit/e1ce76893fe7ccb0e59116d4a8d420aef4655fea))
* external tooltip legend extra value sync ([#993](https://github.com/elastic/elastic-charts/issues/993)) ([13ad05a](https://github.com/elastic/elastic-charts/commit/13ad05ab19b58a034f81d6b43b8925315b49de6d))
* **legend:** disable focus and keyboard navigation for legend in partition ch… ([#952](https://github.com/elastic/elastic-charts/issues/952)) ([03bd2f7](https://github.com/elastic/elastic-charts/commit/03bd2f755038117b19e3e5b6459bfc75a51656d4))
* **legend:** hierarchical legend order should follow the tree paths ([#947](https://github.com/elastic/elastic-charts/issues/947)) ([f9218ad](https://github.com/elastic/elastic-charts/commit/f9218ad842d07a67eef4cbfb1209937db9da6853)), closes [#944](https://github.com/elastic/elastic-charts/issues/944)
* **legend:** remove ids for circles ([#973](https://github.com/elastic/elastic-charts/issues/973)) ([b3f4f90](https://github.com/elastic/elastic-charts/commit/b3f4f90e006f5b4c9b476460a71685396486cc54))


### Features

* **cursor:** improve theme styling for crosshair ([#980](https://github.com/elastic/elastic-charts/issues/980)) ([6c4dafd](https://github.com/elastic/elastic-charts/commit/6c4dafd1cdeed5b61ca4c89790faa707b5c083b5))
* **legend:**  display pie chart legend extra ([#939](https://github.com/elastic/elastic-charts/issues/939)) ([d14de01](https://github.com/elastic/elastic-charts/commit/d14de010c1d7ced362da274153d7f3c464c3170b))
* **legend:** add keyboard navigation ([#880](https://github.com/elastic/elastic-charts/issues/880)) ([87c227d](https://github.com/elastic/elastic-charts/commit/87c227da41dc4a6860f7ae895e80586ce8211092))
* **partition:** Flame and icicle chart ([#965](https://github.com/elastic/elastic-charts/issues/965)) ([3df73d0](https://github.com/elastic/elastic-charts/commit/3df73d0e1f74b66e688a64e477c78d5ed3225f0a))
* **partition:** legend hover options ([#978](https://github.com/elastic/elastic-charts/issues/978)) ([f810d94](https://github.com/elastic/elastic-charts/commit/f810d94c03f91191e9d86d156b25db22be888a59))
* **xy:** support multiple point shapes on line, area and bubble charts ([#988](https://github.com/elastic/elastic-charts/issues/988)) ([1392b7d](https://github.com/elastic/elastic-charts/commit/1392b7d8f77087fcb8592a3697e3eadae8db1f33))

# [24.4.0](https://github.com/elastic/elastic-charts/compare/v24.3.0...v24.4.0) (2020-12-09)


### Bug Fixes

* empty labels on debug state ([#940](https://github.com/elastic/elastic-charts/issues/940)) ([3c823fd](https://github.com/elastic/elastic-charts/commit/3c823fdbc8437c907c02b58c1aa8e084bc7611d1))


### Features

* allow use of functions for y, y0, split and stack accessors ([#943](https://github.com/elastic/elastic-charts/issues/943)) ([22425d3](https://github.com/elastic/elastic-charts/commit/22425d3b9819afde208c651abb6b017839556645))

# [24.3.0](https://github.com/elastic/elastic-charts/compare/v24.2.0...v24.3.0) (2020-12-04)


### Bug Fixes

* **highlighter:** show default highlighted radius with hidden dots ([#926](https://github.com/elastic/elastic-charts/issues/926)) ([8b167a4](https://github.com/elastic/elastic-charts/commit/8b167a46bd5d5878a682448c269718dc1076ea14)), closes [#679](https://github.com/elastic/elastic-charts/issues/679)
* **xy_chart:** improve line joins rendering ([#920](https://github.com/elastic/elastic-charts/issues/920)) ([ec8041a](https://github.com/elastic/elastic-charts/commit/ec8041a2ef8c5f5d173efc5981b2f52830ceaf4f))
* point highlight based on geom position and transform ([#934](https://github.com/elastic/elastic-charts/issues/934)) ([7198b5d](https://github.com/elastic/elastic-charts/commit/7198b5d47230558e6858076083232f46fa02e0f9))


### Features

* allow no results component, don't require series ([#936](https://github.com/elastic/elastic-charts/issues/936)) ([4766c23](https://github.com/elastic/elastic-charts/commit/4766c235ee6d15b2523b9177242e90157f7af8df))
* improved domain error handling ([#933](https://github.com/elastic/elastic-charts/issues/933)) ([94534a5](https://github.com/elastic/elastic-charts/commit/94534a5d37fc0b71508facc64881f14866603d9c))

# [24.2.0](https://github.com/elastic/elastic-charts/compare/v24.1.0...v24.2.0) (2020-11-25)


### Bug Fixes

* near and far alignments for orthogonal rotations ([#911](https://github.com/elastic/elastic-charts/issues/911)) ([cb279f3](https://github.com/elastic/elastic-charts/commit/cb279f32b0b306e590dd2c9a64b44788ab1c20bc))


### Features

* add projection click listener ([#913](https://github.com/elastic/elastic-charts/issues/913)) ([0fa9072](https://github.com/elastic/elastic-charts/commit/0fa9072566b4c9774cf7953041559a9ea99696d6)), closes [#846](https://github.com/elastic/elastic-charts/issues/846)

# [24.1.0](https://github.com/elastic/elastic-charts/compare/v24.0.0...v24.1.0) (2020-11-24)


### Bug Fixes

* **area_charts:** correctly represent baseline with negative data points ([#896](https://github.com/elastic/elastic-charts/issues/896)) ([d1243f1](https://github.com/elastic/elastic-charts/commit/d1243f1612e43ca454db5ff48bc6689ca48bb80a))
* **legend:** legend sizes with ordinal data ([#867](https://github.com/elastic/elastic-charts/issues/867)) ([7559e0d](https://github.com/elastic/elastic-charts/commit/7559e0dd43c76f4217c136a902f724bc0e406672)), closes [#811](https://github.com/elastic/elastic-charts/issues/811)
* render orphan data points on lines and areas ([#900](https://github.com/elastic/elastic-charts/issues/900)) ([0be282b](https://github.com/elastic/elastic-charts/commit/0be282b2d46e867348708f74ff752ca7dbd493fd)), closes [#783](https://github.com/elastic/elastic-charts/issues/783)
* specs swaps correctly reflected in state ([#901](https://github.com/elastic/elastic-charts/issues/901)) ([7fba882](https://github.com/elastic/elastic-charts/commit/7fba88254ce3d8f874acec34307fe2d75ffff6a6))


### Features

* **legend:** allow legend text to be copyable ([#877](https://github.com/elastic/elastic-charts/issues/877)) ([9cd3459](https://github.com/elastic/elastic-charts/commit/9cd34591b6216b8aab208177e0e4a31e1c7268d7)), closes [#710](https://github.com/elastic/elastic-charts/issues/710)
* allow clearing series colors from memory ([#899](https://github.com/elastic/elastic-charts/issues/899)) ([ab1af38](https://github.com/elastic/elastic-charts/commit/ab1af382e6b351f4607b90024afa60a7d5f3968a))
* merge series domain with the domain of another group ([#912](https://github.com/elastic/elastic-charts/issues/912)) ([325b013](https://github.com/elastic/elastic-charts/commit/325b013199004e45bd59bc419431656bd8c3830f))
* small multiples for XY charts (alpha) ([#793](https://github.com/elastic/elastic-charts/issues/793)) ([d288208](https://github.com/elastic/elastic-charts/commit/d28820858d013326b3c660381e70696e9382166d)), closes [#500](https://github.com/elastic/elastic-charts/issues/500) [#500](https://github.com/elastic/elastic-charts/issues/500)

# [24.0.0](https://github.com/elastic/elastic-charts/compare/v23.2.1...v24.0.0) (2020-10-19)


### Bug Fixes

* **annotation:** annotation rendering with no yDomain or groupId ([#842](https://github.com/elastic/elastic-charts/issues/842)) ([f173b49](https://github.com/elastic/elastic-charts/commit/f173b497d13b0de4a7103ea2cffc09e96d98d713)), closes [#438](https://github.com/elastic/elastic-charts/issues/438) [#798](https://github.com/elastic/elastic-charts/issues/798)


### Features

* **bar_chart:** add Alignment offset to value labels ([#784](https://github.com/elastic/elastic-charts/issues/784)) ([363aeb4](https://github.com/elastic/elastic-charts/commit/363aeb48c43537ae6906188ec0dfe43efc725f68))
* **bar_chart:** add shadow prop for value labels ([#785](https://github.com/elastic/elastic-charts/issues/785)) ([9b29392](https://github.com/elastic/elastic-charts/commit/9b29392631e4ae92db24bb9077a9afacee051318))
* **bar_chart:** scaled font size for value labels ([#789](https://github.com/elastic/elastic-charts/issues/789)) ([3bdd1ee](https://github.com/elastic/elastic-charts/commit/3bdd1ee1194619db4b2af64037ae8eaeb2b2b186)), closes [#788](https://github.com/elastic/elastic-charts/issues/788)
* **heatmap:** allow fixed right margin ([#873](https://github.com/elastic/elastic-charts/issues/873)) ([16cf73c](https://github.com/elastic/elastic-charts/commit/16cf73c5c0a0fde1e10b4a89f347988d8f422bc3))


### BREAKING CHANGES

* **bar_chart:** The `DisplayValueStyle` `fontSize` property can now express an upper and lower bound as size, used for the automatic scaling.
* **bar_chart:** The `DisplayValueStyle` `fill` property can now express a border color and width, or let the library pick the best match based on contrast using the textInvertible parameter.

## [23.2.1](https://github.com/elastic/elastic-charts/compare/v23.2.0...v23.2.1) (2020-10-06)


### Bug Fixes

* detect dragging only by the delta changes ([#853](https://github.com/elastic/elastic-charts/issues/853)) ([219f9dd](https://github.com/elastic/elastic-charts/commit/219f9dd822b15750949ee3192fa573421eb8e534))
* filter highlighted y values ([#855](https://github.com/elastic/elastic-charts/issues/855)) ([d3ebe77](https://github.com/elastic/elastic-charts/commit/d3ebe776126af0257882d1fa3f94e8426a063fd3))

# [23.2.0](https://github.com/elastic/elastic-charts/compare/v23.1.1...v23.2.0) (2020-10-06)


### Bug Fixes

* **heatmap:** adjust pageSize based available chart height ([#849](https://github.com/elastic/elastic-charts/issues/849)) ([9aa396b](https://github.com/elastic/elastic-charts/commit/9aa396b59c1af4208663a78366a678ead54e6eca))
* **heatmap:** destroy canvas bbox calculator when done ([#844](https://github.com/elastic/elastic-charts/issues/844)) ([42460bd](https://github.com/elastic/elastic-charts/commit/42460bd649b6a8114a01fb63cd9bee01515f37b6))
* **heatmap:** x-axis labels overlapping for time series data ([#850](https://github.com/elastic/elastic-charts/issues/850)) ([9ebd879](https://github.com/elastic/elastic-charts/commit/9ebd8799881d6ee67a3a5a91cf0eb85f13f38ac8))
* **interactions:** recognise drag after 100ms and 4px ([#848](https://github.com/elastic/elastic-charts/issues/848)) ([70626fe](https://github.com/elastic/elastic-charts/commit/70626fe4ef34504c9c9d59b0abb1c6ec0d19b04d)), closes [#748](https://github.com/elastic/elastic-charts/issues/748)


### Features

* heatmap tooltip enhancements and fixes ([#847](https://github.com/elastic/elastic-charts/issues/847)) ([d879e05](https://github.com/elastic/elastic-charts/commit/d879e056f05c1651d04e2de8610cc2f194e6faa9))

## [23.1.1](https://github.com/elastic/elastic-charts/compare/v23.1.0...v23.1.1) (2020-10-05)


### Bug Fixes

* limit annotation to the current domain extent ([#841](https://github.com/elastic/elastic-charts/issues/841)) ([4186962](https://github.com/elastic/elastic-charts/commit/4186962a63ecb6fcee7d88abfcb98c6c3aa9666e)), closes [#832](https://github.com/elastic/elastic-charts/issues/832)

# [23.1.0](https://github.com/elastic/elastic-charts/compare/v23.0.1...v23.1.0) (2020-10-02)


### Features

* heatmap/swimlane chart type ([#831](https://github.com/elastic/elastic-charts/issues/831)) ([96f92b5](https://github.com/elastic/elastic-charts/commit/96f92b5684175c7d14b0c6f257c060cf60ab76fa)), closes [#752](https://github.com/elastic/elastic-charts/issues/752)

## [23.0.1](https://github.com/elastic/elastic-charts/compare/v23.0.0...v23.0.1) (2020-10-01)


### Bug Fixes

* legend item label for functional tests ([#843](https://github.com/elastic/elastic-charts/issues/843)) ([c2d3283](https://github.com/elastic/elastic-charts/commit/c2d3283bb4b577c4024d756562c0e3dc77c127ad))

# [23.0.0](https://github.com/elastic/elastic-charts/compare/v22.0.0...v23.0.0) (2020-09-30)


### Bug Fixes

* render continuous line/area between non-adjacent points ([#833](https://github.com/elastic/elastic-charts/issues/833)) ([9f9892b](https://github.com/elastic/elastic-charts/commit/9f9892b255e62f6d42f4119458a791a62d592986)), closes [#825](https://github.com/elastic/elastic-charts/issues/825)


### Features

* debug state flag added to chart status ([#834](https://github.com/elastic/elastic-charts/issues/834)) ([83919ff](https://github.com/elastic/elastic-charts/commit/83919ffe294257839d360b589ce10f405e04af5b))
* expose datum as part of GeometryValue ([#822](https://github.com/elastic/elastic-charts/issues/822)) ([dcd7077](https://github.com/elastic/elastic-charts/commit/dcd70777c2b6b8530b4518ebbac066e9f097594e))


### BREAKING CHANGES

* when rendering non-stacked line/area charts with a continuous x scale and no fit function,
the line/area between non-consecutive data points will be rendered as a continuous line/area without adding an uncertain dashed line/ semi-transparent area that connects the two, non-adjacent, points.

# [22.0.0](https://github.com/elastic/elastic-charts/compare/v21.3.2...v22.0.0) (2020-09-22)


### Bug Fixes

* breaking change in patch release of 21.1.1 ([d0ddc45](https://github.com/elastic/elastic-charts/commit/d0ddc45e2dbfb23bb1d8682b354b5de2b8476fce)), closes [#810](https://github.com/elastic/elastic-charts/issues/810)


### BREAKING CHANGES

* caused by changes in #810 see #830 for more info
* `TooltipValue.value` is now raw value and `TooltipValue.formattedValue` is now the
string formatted value.

## [21.3.2](https://github.com/elastic/elastic-charts/compare/v21.3.1...v21.3.2) (2020-09-21)


### Bug Fixes

* **axis:** style overrides not applied to axis dimensions ([#829](https://github.com/elastic/elastic-charts/issues/829)) ([62172c4](https://github.com/elastic/elastic-charts/commit/62172c4cd80cdcf06167a70ad8e875f5dd79bea4))

## [21.3.1](https://github.com/elastic/elastic-charts/compare/v21.3.0...v21.3.1) (2020-09-17)


### Bug Fixes

* line path with ordered xValues ([#824](https://github.com/elastic/elastic-charts/issues/824)) ([5a73a3a](https://github.com/elastic/elastic-charts/commit/5a73a3ad7049fc80a72f6b4a09c6404e8067bd9b))

# [21.3.0](https://github.com/elastic/elastic-charts/compare/v21.2.0...v21.3.0) (2020-09-16)


### Bug Fixes

* legend dark mode hover color ([#820](https://github.com/elastic/elastic-charts/issues/820)) ([5227b2e](https://github.com/elastic/elastic-charts/commit/5227b2e811379a941d0bc23bc3160867707177ce))


### Features

* cancel brush/click event with escape key ([#819](https://github.com/elastic/elastic-charts/issues/819)) ([b599d13](https://github.com/elastic/elastic-charts/commit/b599d133c64c05400715fc9368865fdd35969736))
* show crosshair for external pointer events ([#817](https://github.com/elastic/elastic-charts/issues/817)) ([f591a6a](https://github.com/elastic/elastic-charts/commit/f591a6a329c9297df9faf9bc7fde43eb13699500))

# [21.2.0](https://github.com/elastic/elastic-charts/compare/v21.1.2...v21.2.0) (2020-09-14)


### Features

* blind sorting option for vislib ([#813](https://github.com/elastic/elastic-charts/issues/813)) ([8afce43](https://github.com/elastic/elastic-charts/commit/8afce435c85eeff9ed7ee7b44a246f898f4050fb))
* order ordinal values by sum ([#814](https://github.com/elastic/elastic-charts/issues/814)) ([5b2758b](https://github.com/elastic/elastic-charts/commit/5b2758bb41fd3b89a51921b40373d5105eae4d4b))
* **series:** add simple mark formatter ([#775](https://github.com/elastic/elastic-charts/issues/775)) ([ab95284](https://github.com/elastic/elastic-charts/commit/ab95284dcaf20dae2c29653917e70fb3ce7960bc))

## [21.1.2](https://github.com/elastic/elastic-charts/compare/v21.1.1...v21.1.2) (2020-09-09)


### Bug Fixes

* remove unused redux dev middlewares ([#812](https://github.com/elastic/elastic-charts/issues/812)) ([b2679e7](https://github.com/elastic/elastic-charts/commit/b2679e7248ff0475b4267a3099c7afe1dfee67b6))

## [21.1.1](https://github.com/elastic/elastic-charts/compare/v21.1.0...v21.1.1) (2020-09-08)


### Bug Fixes

* build issues and tooltip formatting issues ([#810](https://github.com/elastic/elastic-charts/issues/810)) ([74d9ae0](https://github.com/elastic/elastic-charts/commit/74d9ae0d9425ce494cd15037f4d952eb2db167ab))

# [21.1.0](https://github.com/elastic/elastic-charts/compare/v21.0.1...v21.1.0) (2020-09-06)


### Bug Fixes

* **axis:** misaligned axis with rotated histogram bar charts ([#805](https://github.com/elastic/elastic-charts/issues/805)) ([6c454e1](https://github.com/elastic/elastic-charts/commit/6c454e10ece3f4cbaf1bacf06f5f2b832e9c32b0))


### Features

* **brush:** histogram brushing last values and rounding ([#801](https://github.com/elastic/elastic-charts/issues/801)) ([6d0319f](https://github.com/elastic/elastic-charts/commit/6d0319f1b0898360c004ec34844ac0b441d08b38))
* **tooltip:** series tick formatters ([#802](https://github.com/elastic/elastic-charts/issues/802)) ([fbcd92e](https://github.com/elastic/elastic-charts/commit/fbcd92e1ff4802c07561a9abf309cc88a26e8b5e))

## [21.0.1](https://github.com/elastic/elastic-charts/compare/v21.0.0...v21.0.1) (2020-08-18)


### Bug Fixes

* allow graceful error handling ([#779](https://github.com/elastic/elastic-charts/issues/779)) ([8183b32](https://github.com/elastic/elastic-charts/commit/8183b32f41bd9f5c0948393a4e5e05d1211cd74c)), closes [#776](https://github.com/elastic/elastic-charts/issues/776)

# [21.0.0](https://github.com/elastic/elastic-charts/compare/v20.0.2...v21.0.0) (2020-08-10)


### Bug Fixes

* update dep vulnerabilities, minimist and kind-of ([#763](https://github.com/elastic/elastic-charts/issues/763)) ([4455281](https://github.com/elastic/elastic-charts/commit/4455281bbc23bf13e8eccbdb4ab36168c1610c7f))
* **legend:** fix color anchor, add action context, fix action padding ([#774](https://github.com/elastic/elastic-charts/issues/774)) ([4590a22](https://github.com/elastic/elastic-charts/commit/4590a22c58359ffb13e977cb1dca854a01c3961b))
* **tooltip:** placement with left/top legends and single bars ([#771](https://github.com/elastic/elastic-charts/issues/771)) ([e576b26](https://github.com/elastic/elastic-charts/commit/e576b2610f882a490de645e1e702a33ccebb818d)), closes [#769](https://github.com/elastic/elastic-charts/issues/769) [#770](https://github.com/elastic/elastic-charts/issues/770)


### Features

* streamgraph and fit functions on stacked charts ([#751](https://github.com/elastic/elastic-charts/issues/751)) ([268fcc0](https://github.com/elastic/elastic-charts/commit/268fcc087578b17ae6575f08653ca3be01fb5801)), closes [#766](https://github.com/elastic/elastic-charts/issues/766) [#715](https://github.com/elastic/elastic-charts/issues/715) [#450](https://github.com/elastic/elastic-charts/issues/450)


### BREAKING CHANGES

* the first parameter of `PointStyleAccessor` and `BarStyleAccessor` callbacks is changed from `RawDataSeriesDatum` to `DataSeriesDatum`. `stackAsPercentage` prop is replaced by `stackMode` that accept one `StackMode`.

## [20.0.2](https://github.com/elastic/elastic-charts/compare/v20.0.1...v20.0.2) (2020-07-23)


### Bug Fixes

* **axis:** dual axis x positioning of bars ([#760](https://github.com/elastic/elastic-charts/issues/760)) ([71b49f8](https://github.com/elastic/elastic-charts/commit/71b49f87bc3ae5d09f0d2d45fdc6bdb67d61c5a4))
* **axis:** left axis sizing based on title padding ([#762](https://github.com/elastic/elastic-charts/issues/762)) ([3990589](https://github.com/elastic/elastic-charts/commit/399058939d164ca2c46652982c010a4dbfcd2628))

## [20.0.1](https://github.com/elastic/elastic-charts/compare/v20.0.0...v20.0.1) (2020-07-21)


### Bug Fixes

* custom domain error with fallback ordinal scale ([#757](https://github.com/elastic/elastic-charts/issues/757)) ([142c3df](https://github.com/elastic/elastic-charts/commit/142c3dfd15832d1dbbc923918c662b1a40d169a4)), closes [#756](https://github.com/elastic/elastic-charts/issues/756)

# [20.0.0](https://github.com/elastic/elastic-charts/compare/v19.9.1...v20.0.0) (2020-07-19)


### Features

* **axis:** improved axis styles ([#711](https://github.com/elastic/elastic-charts/issues/711)) ([3c46f9c](https://github.com/elastic/elastic-charts/commit/3c46f9c8c45a1375e4856fec7f53b85bbda4bae8)), closes [#714](https://github.com/elastic/elastic-charts/issues/714) [#312](https://github.com/elastic/elastic-charts/issues/312)


### BREAKING CHANGES

* **axis:** - `AxisSpec.gridLineStyle` => `AxisSpec.gridLine`
- `AxisSpec.gridLineStyle` => `AxisSpec.gridLine`
- `AxisSpec.tickLabelRotation` => `AxisStyle.tickLabel.rotation`
- `AxisSpec.tickPadding` => `AxisStyle.tickLine.padding`
- `AxisSpec.tickSize` => `AxisStyle.tickLine.size`
- `AxisStyle.tickLabelPadding` => `AxisStyle.tickLabel.padding`
- `GridLineConfig` => `GridLineStyle`
- `AxisSpec.style` => `RecursivePartial<AxisStyle>` (new `AxisStyle` type)
- `AxisConfig.axisLineStyle` => `AxisStyle.axisLine`
- `AxisConfig.axisTitleStyle` => `AxisStyle.axisTitle`
- `AxisConfig.tickLabelStyle` => `AxisStyle.tickLabel`
- `AxisConfig.tickLineStyle` => `AxisStyle.tickLine`
- `GridLineStyle` requires all properties
- deprecate `AxisSpec.showGridLines` in favor of `AxisSpec.gridLine.visible`

## [19.9.1](https://github.com/elastic/elastic-charts/compare/v19.9.0...v19.9.1) (2020-07-19)


### Bug Fixes

* correct bad breaking change merge ([3acc263](https://github.com/elastic/elastic-charts/commit/3acc263b1c1a7f6fed9f1820132abd656e3f153e))

# [19.9.0](https://github.com/elastic/elastic-charts/compare/v19.8.1...v19.9.0) (2020-07-17)


### Features

* **axis:** formatting different for label vs tooltip and legend ([#750](https://github.com/elastic/elastic-charts/issues/750)) ([daff503](https://github.com/elastic/elastic-charts/commit/daff5033cc979cb978227dcbf044f8ceb22568a9))
* **legend:** add legend item actions and margins ([#749](https://github.com/elastic/elastic-charts/issues/749)) ([8136dca](https://github.com/elastic/elastic-charts/commit/8136dcae91fc0f7e4ee0912d23713ff2bbe46fad)), closes [#717](https://github.com/elastic/elastic-charts/issues/717)

## [19.8.1](https://github.com/elastic/elastic-charts/compare/v19.8.0...v19.8.1) (2020-07-07)


### Bug Fixes

* **axes:** remove only consecutive duplicated ticks ([#742](https://github.com/elastic/elastic-charts/issues/742)) ([5038a63](https://github.com/elastic/elastic-charts/commit/5038a636f63ca7f649419e640d35b1b1c80f9b5a)), closes [#667](https://github.com/elastic/elastic-charts/issues/667)

# [19.8.0](https://github.com/elastic/elastic-charts/compare/v19.7.0...v19.8.0) (2020-07-06)


### Bug Fixes

* set uninitialized state when removeSpec action is called ([#739](https://github.com/elastic/elastic-charts/issues/739)) ([35b8caf](https://github.com/elastic/elastic-charts/commit/35b8caf52ea96979340102653f26aa7ffa069bc2)), closes [#723](https://github.com/elastic/elastic-charts/issues/723) [#738](https://github.com/elastic/elastic-charts/issues/738)


### Features

* **annotation:** enable marker positioning on LineAnnotation ([#737](https://github.com/elastic/elastic-charts/issues/737)) ([ab5e413](https://github.com/elastic/elastic-charts/commit/ab5e41378a7a26aca97565722439b618767609b6)), closes [#701](https://github.com/elastic/elastic-charts/issues/701)
* add custom annotation tooltip ([#727](https://github.com/elastic/elastic-charts/issues/727)) ([435c67c](https://github.com/elastic/elastic-charts/commit/435c67c2f873c15cd7509f81faed8adf0915208a))

# [19.7.0](https://github.com/elastic/elastic-charts/compare/v19.6.3...v19.7.0) (2020-06-30)


### Bug Fixes

* **partition:** linked label on a larger than 180 degree slice ([#726](https://github.com/elastic/elastic-charts/issues/726)) ([2504bbe](https://github.com/elastic/elastic-charts/commit/2504bbef966824b0d6aa30dae05d324cbd0208c9)), closes [#699](https://github.com/elastic/elastic-charts/issues/699)


### Features

* add domain padding ([#707](https://github.com/elastic/elastic-charts/issues/707)) ([15c78c1](https://github.com/elastic/elastic-charts/commit/15c78c145afbe2183a491908ebbcd91f490a141d)), closes [#706](https://github.com/elastic/elastic-charts/issues/706)

## [19.6.3](https://github.com/elastic/elastic-charts/compare/v19.6.2...v19.6.3) (2020-06-29)


### Bug Fixes

* move redux dev deps to optional deps ([#725](https://github.com/elastic/elastic-charts/issues/725)) ([df984cc](https://github.com/elastic/elastic-charts/commit/df984cccf0f087fe1dd14f38a867d8a2d95080b2))

## [19.6.2](https://github.com/elastic/elastic-charts/compare/v19.6.1...v19.6.2) (2020-06-29)


### Bug Fixes

* react/redux issue with specParser ([#723](https://github.com/elastic/elastic-charts/issues/723)) ([f9c29ec](https://github.com/elastic/elastic-charts/commit/f9c29ec7ec8b4d16c73e556f4ea6964548c78790)), closes [#720](https://github.com/elastic/elastic-charts/issues/720)

## [19.6.1](https://github.com/elastic/elastic-charts/compare/v19.6.0...v19.6.1) (2020-06-29)


### Bug Fixes

* background color dark mode issue ([#719](https://github.com/elastic/elastic-charts/issues/719)) ([40bb526](https://github.com/elastic/elastic-charts/commit/40bb5266b5acf1f80d147c30f6ebca52272f0bec))

# [19.6.0](https://github.com/elastic/elastic-charts/compare/v19.5.2...v19.6.0) (2020-06-24)


### Features

* show tooltip for external events ([#698](https://github.com/elastic/elastic-charts/issues/698)) ([cc31739](https://github.com/elastic/elastic-charts/commit/cc31739a2d2d5173ded3780f1d23890714fb61b3)), closes [#695](https://github.com/elastic/elastic-charts/issues/695)

## [19.5.2](https://github.com/elastic/elastic-charts/compare/v19.5.1...v19.5.2) (2020-06-16)


### Bug Fixes

* apply fixed positioning to hidden tooltip ([#716](https://github.com/elastic/elastic-charts/issues/716)) ([12b1135](https://github.com/elastic/elastic-charts/commit/12b1135fa6a965eda17a0235d2b639a19b19df54))

## [19.5.1](https://github.com/elastic/elastic-charts/compare/v19.5.0...v19.5.1) (2020-06-16)


### Bug Fixes

* graceful scale fallbacks and warnings ([#704](https://github.com/elastic/elastic-charts/issues/704)) ([ed49bbb](https://github.com/elastic/elastic-charts/commit/ed49bbbb5afd69a5d771fff29e9fc7742153d94e)), closes [#678](https://github.com/elastic/elastic-charts/issues/678)
* **axis:** rotated label positioning ([#709](https://github.com/elastic/elastic-charts/issues/709)) ([2e26430](https://github.com/elastic/elastic-charts/commit/2e264305b0427969e6ffd6bfd2a21a0200ddd004)), closes [#673](https://github.com/elastic/elastic-charts/issues/673)
* **tooltip:** popper scroll issue ([#712](https://github.com/elastic/elastic-charts/issues/712)) ([0c97c67](https://github.com/elastic/elastic-charts/commit/0c97c677af5133efa1017afa7141111667bf9d56))

# [19.5.0](https://github.com/elastic/elastic-charts/compare/v19.4.1...v19.5.0) (2020-06-15)


### Bug Fixes

* **tooltip:** show true opaque colors in tooltips ([#629](https://github.com/elastic/elastic-charts/issues/629)) ([23290be](https://github.com/elastic/elastic-charts/commit/23290be8d58a46cfe5b9144c54fc849fabcb6abc)), closes [#628](https://github.com/elastic/elastic-charts/issues/628)
* path of stacked area series with missing values ([#703](https://github.com/elastic/elastic-charts/issues/703)) ([2541180](https://github.com/elastic/elastic-charts/commit/2541180b1a477aa637120ce225c59e0f8cbd5aa4))
* remove double rendering ([#693](https://github.com/elastic/elastic-charts/issues/693)) ([ebf2748](https://github.com/elastic/elastic-charts/commit/ebf2748b47e098197b87fe43cc6ec452443207fb)), closes [#690](https://github.com/elastic/elastic-charts/issues/690)


### Features

* **partition:** add 4.5 contrast for text in partition slices ([#608](https://github.com/elastic/elastic-charts/issues/608)) ([eded2ac](https://github.com/elastic/elastic-charts/commit/eded2ac7da909a0bd279c7f38bb83d0b713a01be)), closes [#606](https://github.com/elastic/elastic-charts/issues/606)
* add screenshot functions to partition/goal ([#697](https://github.com/elastic/elastic-charts/issues/697)) ([5581c3c](https://github.com/elastic/elastic-charts/commit/5581c3c8fdc3730892402fa1c5cc2a068012eaf8))

## [19.4.1](https://github.com/elastic/elastic-charts/compare/v19.4.0...v19.4.1) (2020-06-01)


### Bug Fixes

* missing dash style in line annotation ([#692](https://github.com/elastic/elastic-charts/issues/692)) ([e2ba940](https://github.com/elastic/elastic-charts/commit/e2ba940f3e3483dd250879866d8d5c3e7e786e5b)), closes [#687](https://github.com/elastic/elastic-charts/issues/687)

# [19.4.0](https://github.com/elastic/elastic-charts/compare/v19.3.0...v19.4.0) (2020-05-28)


### Bug Fixes

* **partition:** consider legendMaxDepth on legend size ([#654](https://github.com/elastic/elastic-charts/issues/654)) ([9429dcf](https://github.com/elastic/elastic-charts/commit/9429dcff58678e82db142fcc6579dbea6d0f7450)), closes [#639](https://github.com/elastic/elastic-charts/issues/639)


### Features

* **partition:** enable grooves in all group layers ([#666](https://github.com/elastic/elastic-charts/issues/666)) ([f5b4767](https://github.com/elastic/elastic-charts/commit/f5b47675535949f0be8302106ab3842c49412e93))
* **partition:** linked text overflow avoidance ([#670](https://github.com/elastic/elastic-charts/issues/670)) ([b6e5911](https://github.com/elastic/elastic-charts/commit/b6e5911e55772aff0de3ccea947a794ec469abc6)), closes [#633](https://github.com/elastic/elastic-charts/issues/633)
* **partition:** monotonic font size scaling ([#681](https://github.com/elastic/elastic-charts/issues/681)) ([ea2489b](https://github.com/elastic/elastic-charts/commit/ea2489b23bd3f66222dab042ea5b5b7e377e2809)), closes [#661](https://github.com/elastic/elastic-charts/issues/661)
* **tooltip:** improve positioning with popperjs ([#651](https://github.com/elastic/elastic-charts/issues/651)) ([6512950](https://github.com/elastic/elastic-charts/commit/651295080b557409c95e1e4ab371bfdc94e86acc)), closes [#596](https://github.com/elastic/elastic-charts/issues/596)

# [19.3.0](https://github.com/elastic/elastic-charts/compare/v19.2.0...v19.3.0) (2020-05-08)


### Bug Fixes

* build/type issue with DataGenerator ([#671](https://github.com/elastic/elastic-charts/issues/671)) ([86dd2b1](https://github.com/elastic/elastic-charts/commit/86dd2b1a859d6cd122902a801fe419cbbeb852ec))


### Features

* **partition:** linked text maximum length config ([#665](https://github.com/elastic/elastic-charts/issues/665)) ([7166e42](https://github.com/elastic/elastic-charts/commit/7166e422d95a60fb4685116a71a6acb87d7961cf))

# [19.2.0](https://github.com/elastic/elastic-charts/compare/v19.1.2...v19.2.0) (2020-05-05)


### Features

* **partition:** treemap padding ([#660](https://github.com/elastic/elastic-charts/issues/660)) ([ed1e8be](https://github.com/elastic/elastic-charts/commit/ed1e8be1c870c748fee432a643039b4ba93b2c62))

## [19.1.2](https://github.com/elastic/elastic-charts/compare/v19.1.1...v19.1.2) (2020-05-04)


### Bug Fixes

* **partition:** elimination of zero values ([#658](https://github.com/elastic/elastic-charts/issues/658)) ([9ee67dc](https://github.com/elastic/elastic-charts/commit/9ee67dc89851e268edf79016915b973bcea6bd98)), closes [#642](https://github.com/elastic/elastic-charts/issues/642)

## [19.1.1](https://github.com/elastic/elastic-charts/compare/v19.1.0...v19.1.1) (2020-04-30)


### Bug Fixes

* render charts without series ([#657](https://github.com/elastic/elastic-charts/issues/657)) ([0c0af01](https://github.com/elastic/elastic-charts/commit/0c0af01413b00734bd3dfa13dbc3aa7571ee4240))

# [19.1.0](https://github.com/elastic/elastic-charts/compare/v19.0.0...v19.1.0) (2020-04-30)


### Features

* **partition:** treemap group text in grooves ([#652](https://github.com/elastic/elastic-charts/issues/652)) ([304dd48](https://github.com/elastic/elastic-charts/commit/304dd481b0c3195022d2a1b26887901ba56c07e0))

# [19.0.0](https://github.com/elastic/elastic-charts/compare/v18.4.2...v19.0.0) (2020-04-28)


### Bug Fixes

* tooltip container scroll issue ([#647](https://github.com/elastic/elastic-charts/issues/647)) ([f411771](https://github.com/elastic/elastic-charts/commit/f4117717690f4086805f002afb85c3a4b0d2fe22))
* **annotations:** fix alignment at the edges ([#641](https://github.com/elastic/elastic-charts/issues/641)) ([43c5a59](https://github.com/elastic/elastic-charts/commit/43c5a59e3862b6191537b73fc0ca604e79fbc992)), closes [#586](https://github.com/elastic/elastic-charts/issues/586)


### Features

* shift click legend items & partition legend hover ([#648](https://github.com/elastic/elastic-charts/issues/648)) ([ed91744](https://github.com/elastic/elastic-charts/commit/ed9174471e31df77234ea05f307b0dce79722bea))
* **brush:** add multi axis brushing ([#625](https://github.com/elastic/elastic-charts/issues/625)) ([9e49534](https://github.com/elastic/elastic-charts/commit/9e4953474db37d33f8a19dfb1ff1a5528b0f6d54)), closes [#587](https://github.com/elastic/elastic-charts/issues/587) [#620](https://github.com/elastic/elastic-charts/issues/620)


### BREAKING CHANGES

* **brush:** The type used by the `BrushEndListener` is now in the following form `{ x?: [number, number]; y?: Array<{ groupId: GroupId; values: [number,
number]; }> }` where `x` contains an array of `[min, max]` values, and the  `y` property is an optional array of objects, containing the `GroupId` and the values of the brush for that specific axis.
* **annotations:** In the rectangular annotation, the y0 parameter of the coordinates now refers to the minimum value and the y1 value refers to the maximum value of the y domain.

## [18.4.2](https://github.com/elastic/elastic-charts/compare/v18.4.1...v18.4.2) (2020-04-24)


### Bug Fixes

* tickFormat called on mark value ([#649](https://github.com/elastic/elastic-charts/issues/649)) ([daf6a82](https://github.com/elastic/elastic-charts/commit/daf6a82aee5c9ea4031daa1ab992d10955caedb0))

## [18.4.1](https://github.com/elastic/elastic-charts/compare/v18.4.0...v18.4.1) (2020-04-22)


### Bug Fixes

* type issue pulling from src/index ([#645](https://github.com/elastic/elastic-charts/issues/645)) ([3f3a996](https://github.com/elastic/elastic-charts/commit/3f3a996d4bfb5c1b1db9d7a4650b637f6afe996c))

# [18.4.0](https://github.com/elastic/elastic-charts/compare/v18.3.0...v18.4.0) (2020-04-22)


### Bug Fixes

* **partition:** single slice wrong text positioning ([#643](https://github.com/elastic/elastic-charts/issues/643)) ([6298d36](https://github.com/elastic/elastic-charts/commit/6298d36dda5349ccc91b6fb410064545e6c4becb)), closes [#637](https://github.com/elastic/elastic-charts/issues/637)
* **treemap:** align onElementClick parameters to sunburst ([#636](https://github.com/elastic/elastic-charts/issues/636)) ([2c1d224](https://github.com/elastic/elastic-charts/commit/2c1d22460b7152bd5fd9c035ee522e6fb4eedd53)), closes [#624](https://github.com/elastic/elastic-charts/issues/624)


### Features

* allow colorVariant option for series specific color styles ([#630](https://github.com/elastic/elastic-charts/issues/630)) ([e5a206d](https://github.com/elastic/elastic-charts/commit/e5a206d13c1b1bdfa2d42b6f9c11652040de5971))
* **series:** BubbleSeries (alpha) and markSizeAccessor ([#559](https://github.com/elastic/elastic-charts/issues/559)) ([3aa235e](https://github.com/elastic/elastic-charts/commit/3aa235e12cd843b0799282585de5795aa329296b))

# [18.3.0](https://github.com/elastic/elastic-charts/compare/v18.2.2...v18.3.0) (2020-04-15)


### Bug Fixes

* remove series with undefined splitSeriesAccessor values ([#627](https://github.com/elastic/elastic-charts/issues/627)) ([59f0f6e](https://github.com/elastic/elastic-charts/commit/59f0f6e718afad29abc9e761f169ca49ec2148b3))


### Features

* gauge, goal and bullet graph (alpha) ([#614](https://github.com/elastic/elastic-charts/issues/614)) ([5669178](https://github.com/elastic/elastic-charts/commit/5669178416859369d801a4360b542e3bd452dffa))
* **partition:** add legend and highlighters ([#616](https://github.com/elastic/elastic-charts/issues/616)) ([6a4247e](https://github.com/elastic/elastic-charts/commit/6a4247ebc77fd95ce34557eac128b0d57a659a9e)), closes [#486](https://github.com/elastic/elastic-charts/issues/486) [#532](https://github.com/elastic/elastic-charts/issues/532)

## [18.2.2](https://github.com/elastic/elastic-charts/compare/v18.2.1...v18.2.2) (2020-04-09)


### Bug Fixes

* stacked percentage with zero values ([#622](https://github.com/elastic/elastic-charts/issues/622)) ([77c3146](https://github.com/elastic/elastic-charts/commit/77c314652cf5d84da536a167d0b15eb0385b2107))

## [18.2.1](https://github.com/elastic/elastic-charts/compare/v18.2.0...v18.2.1) (2020-04-07)


### Bug Fixes

* stack as percentage with 0 or null values ([#618](https://github.com/elastic/elastic-charts/issues/618)) ([7be1f63](https://github.com/elastic/elastic-charts/commit/7be1f63af3449a2ba220f228ba21187e87ce2467)), closes [#617](https://github.com/elastic/elastic-charts/issues/617)

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

* align series names on split series configuration ([#421](https://github.com/elastic/elastic-charts/issues/421)) ([bbecbcc](https://github.com/elastic/elastic-charts/commit/bbecbcc)), closes [#420](https://github.com/elastic/elastic-charts/issues/420)

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

* handle split series with group value to 0 ([#289](https://github.com/elastic/elastic-charts/issues/289)) ([0f2217e](https://github.com/elastic/elastic-charts/commit/0f2217e)), closes [#288](https://github.com/elastic/elastic-charts/issues/288)

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
