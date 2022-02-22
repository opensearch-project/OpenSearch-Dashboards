/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import angular from 'angular';
import React from 'react';
import { Plugin, CoreSetup } from 'opensearch-dashboards/public';
import { DiscoverSetup } from '../../../../../src/plugins/discover/public';

angular.module('myDocViewLink', []).directive('myHit', () => ({
  restrict: 'E',
  scope: {
    hit: '=hit',
  },
  template: '<h1 data-test-subj="href-docviewlink">{{hit._index}}</h1>',
}));

function MyHit(props: { index: string }) {
  return <h1 data-test-subj="generateurlfn-docviewlink">{props.index}</h1>;
}

export class DocViewsLinksPlugin implements Plugin<void, void> {
  public setup(core: CoreSetup, { discover }: { discover: DiscoverSetup }) {
    discover.docViewsLinks.addDocViewLink({
      href: 'http://some-url/',
      order: 1,
      label: 'href doc view link',
    });

    discover.docViewsLinks.addDocViewLink({
      generateurlfn: () => 'http://some-url/',
      order: 2,
      label: 'generateurlfn doc view link',
    });
  }

  public start() {}
}
