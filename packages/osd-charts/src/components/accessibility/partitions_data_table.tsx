/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { createRef, memo, useState } from 'react';
import { connect } from 'react-redux';

import {
  getScreenReaderDataSelector,
  PartitionData,
} from '../../chart_types/partition_chart/state/selectors/get_screen_reader_data';
import { SettingsSpec } from '../../specs/settings';
import { GlobalChartState } from '../../state/chart_state';
import {
  A11ySettings,
  DEFAULT_A11Y_SETTINGS,
  getA11ySettingsSelector,
} from '../../state/selectors/get_accessibility_config';
import { getInternalIsInitializedSelector, InitStatus } from '../../state/selectors/get_internal_is_intialized';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { isNil } from '../../utils/common';

interface ScreenReaderPartitionTableProps {
  a11ySettings: A11ySettings;
  partitionData: PartitionData;
  debug: SettingsSpec['debug'];
}

// this currently limit the number of pages shown to the user
const TABLE_PAGINATION = 20;

const ScreenReaderPartitionTableComponent = ({
  a11ySettings,
  partitionData,
  debug,
}: ScreenReaderPartitionTableProps) => {
  const [count, setCount] = useState(1);
  const tableRowRef = createRef<HTMLTableRowElement>();
  const { tableCaption } = a11ySettings;

  const rowLimit = TABLE_PAGINATION * count;
  const handleMoreData = () => {
    setCount(count + 1);
    // generate the next group of data
    if (tableRowRef.current) {
      tableRowRef.current.focus();
    }
  };

  const { isSmallMultiple, data, hasMultipleLayers } = partitionData;
  const tableLength = data.length;
  const showMoreRows = rowLimit < tableLength;
  let countOfCol: number = 3;
  const totalColumns: number =
    hasMultipleLayers && isSmallMultiple
      ? (countOfCol += 3)
      : hasMultipleLayers || isSmallMultiple
      ? (countOfCol += 2)
      : countOfCol;

  return (
    <div className={`echScreenReaderOnly ${debug ? 'echScreenReaderOnlyDebug' : ''} echScreenReaderTable`}>
      <table>
        <caption>
          {isNil(tableCaption)
            ? `The table ${
                showMoreRows
                  ? `represents only ${rowLimit} of the ${tableLength} data points`
                  : `fully represents the dataset of ${tableLength} data point${tableLength > 1 ? 's' : ''}`
              }`
            : tableCaption}
        </caption>
        <thead>
          <tr>
            {isSmallMultiple && <th scope="col">Small multiple title</th>}
            {hasMultipleLayers && <th scope="col">Depth</th>}
            <th scope="col">Label</th>
            {hasMultipleLayers && <th scope="col">Parent</th>}
            <th scope="col">Value</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>

        <tbody>
          {partitionData.data
            .slice(0, rowLimit)
            .map(({ panelTitle, depth, label, parentName, valueText, percentage }, index) => {
              return (
                <tr key={`row--${index}`} ref={rowLimit === index ? tableRowRef : undefined} tabIndex={-1}>
                  {isSmallMultiple && <td>{panelTitle}</td>}
                  {hasMultipleLayers && <td>{depth}</td>}
                  <th>{label}</th>
                  {hasMultipleLayers && <td>{parentName}</td>}
                  <td>{valueText}</td>
                  <td>{percentage}</td>
                </tr>
              );
            })}
        </tbody>
        {showMoreRows && (
          <tfoot>
            <tr>
              <td colSpan={totalColumns}>
                <button type="submit" onClick={() => handleMoreData()} tabIndex={-1}>
                  Click to show more data
                </button>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

const DEFAULT_SCREEN_READER_SUMMARY = {
  a11ySettings: DEFAULT_A11Y_SETTINGS,
  partitionData: {
    isSmallMultiple: false,
    hasMultipleLayers: false,
    data: [],
  },
  debug: false,
};

const mapStateToProps = (state: GlobalChartState): ScreenReaderPartitionTableProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return DEFAULT_SCREEN_READER_SUMMARY;
  }
  return {
    a11ySettings: getA11ySettingsSelector(state),
    partitionData: getScreenReaderDataSelector(state),
    debug: getSettingsSpecSelector(state).debug,
  };
};
/** @internal */
export const ScreenReaderPartitionTable = memo(connect(mapStateToProps)(ScreenReaderPartitionTableComponent));
