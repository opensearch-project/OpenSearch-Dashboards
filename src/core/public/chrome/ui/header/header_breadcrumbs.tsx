/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiHeaderBreadcrumbs, EuiSimplifiedBreadcrumbs } from '@elastic/eui';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { ChromeBreadcrumb, ChromeBreadcrumbEnricher } from '../../chrome_service';

interface Props {
  appTitle$: Observable<string>;
  breadcrumbs$: Observable<ChromeBreadcrumb[]>;
  breadcrumbsEnricher$: Observable<ChromeBreadcrumbEnricher | undefined>;
  useUpdatedHeader?: boolean;
  renderFullLength?: boolean;
  hideTrailingSeparator?: boolean;
}

export function HeaderBreadcrumbs({
  appTitle$,
  breadcrumbs$,
  breadcrumbsEnricher$,
  useUpdatedHeader,
  renderFullLength,
  hideTrailingSeparator,
}: Props) {
  const appTitle = useObservable(appTitle$, 'OpenSearch Dashboards');
  const breadcrumbs = useObservable(breadcrumbs$, []);
  const [breadcrumbEnricher, setBreadcrumbEnricher] = useState<
    ChromeBreadcrumbEnricher | undefined
  >(undefined);

  useEffect(() => {
    const sub = breadcrumbsEnricher$.subscribe((enricher) => {
      setBreadcrumbEnricher(() => enricher);
    });
    return () => sub.unsubscribe();
  });

  let crumbs = breadcrumbs;

  if (breadcrumbs.length === 0 && appTitle) {
    crumbs = [{ text: appTitle }];
  }

  if (breadcrumbEnricher) {
    crumbs = breadcrumbEnricher(crumbs);
  }

  crumbs = crumbs.map((breadcrumb, i) => ({
    ...breadcrumb,
    'data-test-subj': classNames(
      'breadcrumb',
      breadcrumb['data-test-subj'],
      i === 0 && 'first',
      i === crumbs.length - 1 && 'last'
    ),
  }));

  const remainingCrumbs = useUpdatedHeader ? crumbs.slice(0, -1) : crumbs;

  if (hideTrailingSeparator) {
    return (
      <EuiSimplifiedBreadcrumbs
        breadcrumbs={crumbs}
        hideLastBreadCrumb={!renderFullLength}
        max={10}
        data-test-subj="breadcrumbs"
        hideTrailingSeparator
        disableTrailingLink
      />
    );
  } else {
    return (
      <EuiHeaderBreadcrumbs
        breadcrumbs={renderFullLength ? crumbs : remainingCrumbs}
        max={10}
        data-test-subj="breadcrumbs"
        simplify={!!useUpdatedHeader}
      />
    );
  }
}
