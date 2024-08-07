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

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { memoize } from 'lodash';
import moment from 'moment';
import {
  keys,
  EuiSpacer,
  EuiIcon,
  EuiTitle,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSmallButtonEmpty,
  EuiSmallButton,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
} from '@elastic/eui';
import { Settings } from '../types';

interface Props {
  settings: Settings;
}

const CHILD_ELEMENT_PREFIX = 'historyReq';

export function RecentQuery({ settings }: Props) {
  const [recentQueries, setRecentQueries] = useState<any[]>(settings?.getQueryHistory());
  const [isPopoverOpen, setPopover] = useState(false);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const clearHistory = useCallback(() => {
    settings?.clearQueryHistory();
    setRecentQueries(settings?.getQueryHistory());
  }, [settings]);

  const listRef = useRef<HTMLUListElement | null>(null);

  const [viewingReq, setViewingReq] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedReq = useRef<any>(null);

  //   const scrollIntoView = useCallback((idx: number) => {
  //     const activeDescendant = listRef.current!.querySelector(`#${CHILD_ELEMENT_PREFIX}${idx}`);
  //     if (activeDescendant) {
  //       activeDescendant.scrollIntoView();
  //     }
  //   }, []);

  //   const initialize = useCallback(() => {
  //     const nextSelectedIndex = 0;
  //     (describeReq as any).cache = new WeakMap();
  //     setViewingReq(requests[nextSelectedIndex]);
  //     selectedReq.current = requests[nextSelectedIndex];
  //     setSelectedIndex(nextSelectedIndex);
  //     scrollIntoView(nextSelectedIndex);
  //   }, [describeReq, requests, scrollIntoView]);

  const clear = () => {
    clearHistory();
    //initialize();
  };

  //const restoreRequestFromHistory = useRestoreRequestFromHistory();

  //   useEffect(() => {
  //     initialize();
  //   }, [initialize]);

  useEffect(() => {
    const done = settings.changeQueryHistory(setRecentQueries);
    return () => done();
  }, [settings]);

  const recentQueryItems = recentQueries.map((query, idx) => {
    const date = moment(query.time);

    const formattedDate = date.format('MMM D, YYYY HH:mm:ss');

    let queryLanguage = query.query.language;
    if (queryLanguage === 'kuery') {
      queryLanguage = 'DQL';
    }

    return (
      <EuiContextMenuItem key={idx} onClick={() => setPopover(false)}>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}> {query.query.query} </EuiFlexItem>
          <EuiFlexItem grow={false}> {queryLanguage} </EuiFlexItem>
          <EuiFlexItem grow={false}> {formattedDate} </EuiFlexItem>
        </EuiFlexGroup>
      </EuiContextMenuItem>
    );
  });

  return (
    <EuiPopover
      className="recentQuery__popover"
      button={
        <EuiButtonEmpty
          iconSide="right"
          iconSize="s"
          onClick={onButtonClick}
          className="recentQuery__popover__button"
        >
          {'Recent queries'}
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      panelPaddingSize="none"
      anchorPosition={'downLeft'}
    >
      <EuiContextMenuPanel size="s" items={recentQueryItems} />
    </EuiPopover>
  );
}
