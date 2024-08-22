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
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, Fragment, useEffect } from 'react';
import * as Rx from 'rxjs';
import { EuiButtonIcon, EuiHeaderSectionItemButton, EuiIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { NewsfeedFlyout } from './flyout_list';
import { FetchResult } from '../types';
import { CoreStart } from '../../../../core/public';
import './newsfeed_header_nav_button.scss';

export interface INewsfeedContext {
  setFlyoutVisible: React.Dispatch<React.SetStateAction<boolean>>;
  newsFetchResult: FetchResult | void | null;
}
export const NewsfeedContext = React.createContext({} as INewsfeedContext);

export type NewsfeedApiFetchResult = Rx.Observable<void | FetchResult | null>;

export interface Props {
  coreStart: CoreStart;
  apiFetchResult: NewsfeedApiFetchResult;
}

export const NewsfeedNavButton = ({ coreStart, apiFetchResult }: Props) => {
  const [showBadge, setShowBadge] = useState<boolean>(false);
  const [flyoutVisible, setFlyoutVisible] = useState<boolean>(false);
  const [newsFetchResult, setNewsFetchResult] = useState<FetchResult | null | void>(null);

  useEffect(() => {
    function handleStatusChange(fetchResult: FetchResult | void | null) {
      if (fetchResult) {
        setShowBadge(fetchResult.hasNew);
      }
      setNewsFetchResult(fetchResult);
    }

    const subscription = apiFetchResult.subscribe((res) => handleStatusChange(res));
    return () => subscription.unsubscribe();
  }, [apiFetchResult]);

  function showFlyout() {
    setShowBadge(false);
    setFlyoutVisible(!flyoutVisible);
  }

  const useLegacyAppearance = !coreStart.uiSettings.get('home:useNewHomePage');
  const innerElement = useLegacyAppearance ? (
    <EuiHeaderSectionItemButton
      data-test-subj="newsfeed"
      aria-controls="keyPadMenu"
      aria-expanded={flyoutVisible}
      aria-haspopup="true"
      aria-label={
        showBadge
          ? i18n.translate('newsfeed.headerButton.unreadAriaLabel', {
              defaultMessage: 'Newsfeed menu - unread items available',
            })
          : i18n.translate('newsfeed.headerButton.readAriaLabel', {
              defaultMessage: 'Newsfeed menu - all items read',
            })
      }
      notification={showBadge ? true : null}
      onClick={showFlyout}
    >
      <EuiIcon type="cheer" size="m" />
    </EuiHeaderSectionItemButton>
  ) : (
    <EuiToolTip
      content={i18n.translate('newsfeed.headerButton.menuButtonTooltip', {
        defaultMessage: 'Newsfeed',
      })}
      delay="long"
      position="bottom"
    >
      <div className="osdNewsfeedButtonWrapper">
        <EuiButtonIcon
          iconType="cheer"
          color="primary"
          size="xs"
          aria-controls="keyPadMenu"
          aria-expanded={flyoutVisible}
          aria-haspopup="true"
          aria-label={
            showBadge
              ? i18n.translate('newsfeed.headerButton.unreadAriaLabel', {
                  defaultMessage: 'Newsfeed menu - unread items available',
                })
              : i18n.translate('newsfeed.headerButton.readAriaLabel', {
                  defaultMessage: 'Newsfeed menu - all items read',
                })
          }
          onClick={showFlyout}
        />
        <EuiIcon className="osdNewsfeedButtonWrapper--dot" color="accent" type="dot" size="s" />
      </div>
    </EuiToolTip>
  );

  return (
    <NewsfeedContext.Provider value={{ setFlyoutVisible, newsFetchResult }}>
      <Fragment>
        {innerElement}
        {flyoutVisible ? <NewsfeedFlyout /> : null}
      </Fragment>
    </NewsfeedContext.Provider>
  );
};
