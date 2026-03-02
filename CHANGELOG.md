# Change Log

All notable changes to the Wazuh app project will be documented in this file.

## Wazuh dashboard v5.0.0 - OpenSearch Dashboards 3.3.0 - Revision 00

### Added

- Support for Wazuh 5.0.0
- Health check service [#811](https://github.com/wazuh/wazuh-dashboard/pull/811) [#866](https://github.com/wazuh/wazuh-dashboard/pull/866) [#961](https://github.com/wazuh/wazuh-dashboard/pull/961) [#1031](https://github.com/wazuh/wazuh-dashboard/pull/1031)
- Added Health Check plugin [#870](https://github.com/wazuh/wazuh-dashboard/pull/870) [#946](https://github.com/wazuh/wazuh-dashboard/pull/946)
- Added manager host configuration for the default configuration file [#998](https://github.com/wazuh/wazuh-dashboard/pull/998)
- Set v9 theme as default [#1092](https://github.com/wazuh/wazuh-dashboard/pull/1092)

### Removed

- Removed creation of /usr/lib/.build-id/\* links to prevent conflicts when installing Wazuh Dashboard alongside OpenSearch Dashboards on the same system

### Changed

- Changed the location of the wazuh-dashboard service to match with the other Wazuh components [#805](https://github.com/wazuh/wazuh-dashboard/issues/805)
- Changed the default value of `metaFields` and `timepicker:timeDefaults` settings [#998](https://github.com/wazuh/wazuh-dashboard/pull/998)

## Wazuh dashboard v4.14.5 - OpenSearch Dashboards 2.19.4 - Revision 00

### Added

- Support for Wazuh 4.14.5

## Wazuh dashboard v4.14.4 - OpenSearch Dashboards 2.19.4 - Revision 00

### Added

- Support for Wazuh 4.14.4

## Wazuh dashboard v4.14.3 - OpenSearch Dashboards 2.19.4 - Revision 03

### Added

- Support for Wazuh 4.14.3

## Wazuh dashboard v4.14.2 - OpenSearch Dashboards 2.19.4 - Revision 04

### Added

- Support for Wazuh 4.14.2

## Wazuh dashboard v4.14.1 - OpenSearch Dashboards 2.19.3 - Revision 02

### Added

- Support for Wazuh 4.14.1

## Wazuh dashboard v4.14.0 - OpenSearch Dashboards 2.19.3 - Revision 03

### Added

- Support for Wazuh 4.14.0
- Added Anomaly Detection plugins to default installation [#843](https://github.com/wazuh/wazuh-dashboard/pull/843) [#905](https://github.com/wazuh/wazuh-dashboard/pull/905) [#909](https://github.com/wazuh/wazuh-dashboard/pull/909) [#913](https://github.com/wazuh/wazuh-dashboard/pull/913)
- Added directive to the dashboard service to automatically restart it on crash [#919](https://github.com/wazuh/wazuh-dashboard/pull/919)

## Wazuh dashboard v4.13.1 - OpenSearch Dashboards 2.19.2 - Revision 01

### Added

- Support for Wazuh 4.13.1

## Wazuh dashboard v4.13.0 - OpenSearch Dashboards 2.19.2 - Revision 08

### Added

- Support for Wazuh 4.13.0

### Fixed

- Fixed a problem that caused configuration files to be duplicated [#790](https://github.com/wazuh/wazuh-dashboard/issues/790)
- Fixed a problem with the service file that was marked world-inaccessible [#740](https://github.com/wazuh/wazuh-dashboard/pull/740)

### Changed

- Reduced default session and cookie expiration to 15 minutes for the Wazuh security plugin [#749](https://github.com/wazuh/wazuh-dashboard/issues/749) [#321](https://github.com/wazuh/wazuh-security-dashboards-plugin/pull/321)

## Wazuh dashboard v4.12.0 - OpenSearch Dashboards 2.19.1 - Revision 03

### Added

- Support for Wazuh 4.12.0

### Fixed

- Fixed a style issue with the empty button texts are cut off in v7 theme of OpenSearch Dashboards 2.19.0 upgrade [#423](https://github.com/wazuh/wazuh-dashboard/issues/423)
- Fixed horizontal scrolling in the v7 theme of the Discover plugin to improve accessibility when many columns exceed the viewport width, ensuring easier navigation [#7330](https://github.com/wazuh/wazuh-dashboard-plugins/issues/7330)
- Fixed tooltip text for no cached mapping field, because the change of the Management application to Dashboard management [#614](https://github.com/wazuh/wazuh-dashboard/pull/614)
- Fixed the menu items that appeared expanded [#611](https://github.com/wazuh/wazuh-dashboard/pull/611)

## Wazuh dashboard v4.11.2 - OpenSearch Dashboards 2.16.0 - Revision 02

### Added

- Support for Wazuh 4.11.2

### Fixed

- Fixed that `/etc/default/wazuh-dashboard` file was overwritten during an upgrade in RPM-based operating systems [#590](https://github.com/wazuh/wazuh-dashboard/pull/590)

## Wazuh dashboard v4.11.1 - OpenSearch Dashboards 2.16.0 - Revision 02

### Added

- Support for Wazuh 4.11.1

## Wazuh dashboard v4.11.0 - OpenSearch Dashboards 2.16.0 - Revision 03

### Added

- Support for Wazuh 4.11.0

### Fixed

- Fix redirection on IDP initiated SAML configurations [#171](https://github.com/wazuh/wazuh-security-dashboards-plugin/pull/171)

## Wazuh dashboard v4.10.1 - OpenSearch Dashboards 2.16.0 - Revision 01

### Added

- Support for Wazuh 4.10.1

### Fixed

- Fix red mask style for chromium browsers [#481](https://github.com/wazuh/wazuh-dashboard/pull/481)

## Wazuh dashboard v4.10.0 - OpenSearch Dashboards 2.16.0 - Revision 08

### Changed

- Reduced the size of the loading logo [#373](https://github.com/wazuh/wazuh-dashboard/pull/373)

### Fixed

- Apply the NodeJS options defined at node.options file to the node exec command [#471](https://github.com/wazuh/wazuh-dashboard/pull/471)

### Removed

- Removed the setting home:useNewHomePage from the advanced settings because the views are not finished [#282](https://github.com/wazuh/wazuh-dashboard/pull/282)

## Wazuh dashboard v4.9.2 - OpenSearch Dashboards 2.13.0 - Revision 01

### Added

- Support for Wazuh 4.9.2

## Wazuh dashboard v4.9.1 - OpenSearch Dashboards 2.13.0 - Revision 04

### Added

- Support for Wazuh 4.9.1

### Changed

- Changed link to sample data in the dashboards section and references to Opensearch Dashboards [#311](https://github.com/wazuh/wazuh-dashboard/pull/311)

### Fixed

- Fixed bug that caused the terminal to freeze on deb upgrades [#301](https://github.com/wazuh/wazuh-dashboard/pull/301)
- Fixed the name of the "Index management" category to "Indexer management" [#330](https://github.com/wazuh/wazuh-dashboard/pull/330)

## Wazuh dashboard v4.9.0 - OpenSearch Dashboards 2.13.0 - Revision 07

### Added

- Support for Wazuh 4.9.0

### Changed

- Changed default theme [#174](https://github.com/wazuh/wazuh-dashboard/pull/174)
- Changed default logos and main menu app categories [141](https://github.com/wazuh/wazuh-dashboard/pull/141)
- Changed default value of useExpandedHeader to false [#247](https://github.com/wazuh/wazuh-dashboard/pull/247)
- Changed build number to match the Wazuh standard [#284](https://github.com/wazuh/wazuh-dashboard/pull/284)
