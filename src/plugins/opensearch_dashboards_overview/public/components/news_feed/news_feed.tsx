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

import React, { FC } from 'react';
import { EuiLink, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { FetchResult } from 'src/plugins/newsfeed/public';

interface Props {
  newsFetchResult: FetchResult;
}

export const NewsFeed: FC<Props> = ({ newsFetchResult }) => (
  <section aria-labelledby="osdOverviewNews__title" className="osdOverviewNews">
    <EuiTitle size="s">
      <h2 id="osdOverviewNews__title">
        <FormattedMessage
          id="opensearchDashboardsOverview.news.title"
          defaultMessage="What's new"
        />
      </h2>
    </EuiTitle>

    <EuiSpacer size="m" />

    <div className="osdOverviewNews__content">
      {newsFetchResult.feedItems
        .slice(0, 3)
        .map(({ title, description, linkUrl, publishOn }, index) => (
          <article key={title} aria-labelledby={`osdOverviewNews__title${index}`}>
            <header>
              <EuiTitle size="xxs">
                <h3 id={`osdOverviewNews__title${index}`}>
                  <EuiLink href={linkUrl} target="_blank">
                    {title}
                  </EuiLink>
                </h3>
              </EuiTitle>

              <EuiText size="xs" color="subdued">
                <p>
                  <time dateTime={publishOn.format('YYYY-MM-DD')}>
                    {publishOn.format('DD MMMM YYYY')}
                  </time>
                </p>
              </EuiText>
            </header>

            <EuiText size="xs">
              <p>{description}</p>
            </EuiText>
          </article>
        ))}
    </div>
  </section>
);
