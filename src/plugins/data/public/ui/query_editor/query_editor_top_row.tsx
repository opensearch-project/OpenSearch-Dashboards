/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import dateMath from '@elastic/datemath';
import {
  EuiButton,
  EuiCompressedFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSuperDatePicker,
  OnRefreshProps,
  prettyDuration,
} from '@elastic/eui';
import classNames from 'classnames';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DatasetSelector,
  DatasetSelectorAppearance,
  IDataPluginServices,
  IIndexPattern,
  Query,
  TimeHistoryContract,
  TimeRange,
} from '../..';
import {
  useOpenSearchDashboards,
  withOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { UI_SETTINGS } from '../../../common';
import { getQueryLog, PersistedLog, QueryStatus } from '../../query';
import { NoDataPopover } from './no_data_popover';
import QueryEditorUI from './query_editor';

const QueryEditor = withOpenSearchDashboards(QueryEditorUI);

// @internal
export interface QueryEditorTopRowProps {
  query?: Query;
  onSubmit: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onChange: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onRefresh?: (payload: { dateRange: TimeRange }) => void;
  dataTestSubj?: string;
  disableAutoFocus?: boolean;
  screenTitle?: string;
  indexPatterns?: Array<IIndexPattern | string>;
  isLoading?: boolean;
  prepend?: React.ComponentProps<typeof EuiCompressedFieldText>['prepend'];
  showQueryEditor?: boolean;
  showDatePicker?: boolean;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  isRefreshPaused?: boolean;
  refreshInterval?: number;
  showAutoRefreshOnly?: boolean;
  onRefreshChange?: (options: { isPaused: boolean; refreshInterval: number }) => void;
  customSubmitButton?: any;
  filterBar?: any;
  isDirty: boolean;
  timeHistory?: TimeHistoryContract;
  indicateNoData?: boolean;
  datasetSelectorRef?: React.RefObject<HTMLDivElement>;
  datePickerRef?: React.RefObject<HTMLDivElement>;
  savedQueryManagement?: any;
  queryStatus?: QueryStatus;
}

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default function QueryEditorTopRow(props: QueryEditorTopRowProps) {
  const [isDateRangeInvalid, setIsDateRangeInvalid] = useState(false);
  const [isQueryEditorFocused, setIsQueryEditorFocused] = useState(false);
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const { uiSettings, storage, appName, data } = opensearchDashboards.services;

  const queryLanguage = props.query && props.query.language;
  const persistedLog: PersistedLog | undefined = React.useMemo(
    () =>
      queryLanguage && uiSettings && storage && appName
        ? getQueryLog(uiSettings!, storage, appName, queryLanguage)
        : undefined,
    [queryLanguage, uiSettings, storage, appName]
  );

  function onClickSubmitButton(event: React.MouseEvent<HTMLButtonElement>) {
    if (persistedLog && props.query) {
      persistedLog.add(props.query.query);
    }
    event.preventDefault();
    onSubmit({ query: props.query, dateRange: getDateRange() });
  }

  function getDateRange() {
    const defaultTimeSetting = uiSettings!.get(UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS);
    return {
      from: props.dateRangeFrom || defaultTimeSetting.from,
      to: props.dateRangeTo || defaultTimeSetting.to,
    };
  }

  function onQueryChange(query: Query, dateRange?: TimeRange) {
    props.onChange({
      query,
      dateRange: dateRange ?? getDateRange(),
    });
  }

  function onChangeQueryEditorFocus(isFocused: boolean) {
    setIsQueryEditorFocused(isFocused);
  }

  function onTimeChange({
    start,
    end,
    isInvalid,
    isQuickSelection,
  }: {
    start: string;
    end: string;
    isInvalid: boolean;
    isQuickSelection: boolean;
  }) {
    setIsDateRangeInvalid(isInvalid);
    const retVal = {
      query: props.query,
      dateRange: {
        from: start,
        to: end,
      },
    };

    if (isQuickSelection) {
      props.onSubmit(retVal);
    } else {
      props.onChange(retVal);
    }
  }

  function onRefresh({ start, end }: OnRefreshProps) {
    const retVal = {
      dateRange: {
        from: start,
        to: end,
      },
    };
    if (props.onRefresh) {
      props.onRefresh(retVal);
    }
  }

  function onSubmit({ query, dateRange }: { query?: Query; dateRange: TimeRange }) {
    if (props.timeHistory) {
      props.timeHistory.add(dateRange);
    }

    props.onSubmit({ query, dateRange });
  }

  function onInputSubmit(query: Query, dateRange?: TimeRange) {
    onSubmit({
      query,
      dateRange: dateRange ?? getDateRange(),
    });
  }

  function toAbsoluteString(value: string, roundUp = false) {
    const valueAsMoment = dateMath.parse(value, { roundUp });
    if (!valueAsMoment) {
      return value;
    }
    return valueAsMoment.toISOString();
  }

  function renderDatasetSelector() {
    return (
      <DatasetSelector
        onSubmit={onInputSubmit}
        appearance={DatasetSelectorAppearance.Button}
        buttonProps={{
          color: 'text',
          fullWidth: true,
        }}
      />
    );
  }

  function renderQueryEditor() {
    if (!shouldRenderQueryEditor()) return;
    return (
      <EuiFlexItem>
        <QueryEditor
          disableAutoFocus={props.disableAutoFocus}
          prepend={props.prepend}
          query={props.query!}
          screenTitle={props.screenTitle}
          onChange={onQueryChange}
          onChangeQueryEditorFocus={onChangeQueryEditorFocus}
          onSubmit={onInputSubmit}
          persistedLog={persistedLog}
          className="osdQueryEditor"
          dataTestSubj={props.dataTestSubj}
          filterBar={props.filterBar}
          savedQueryManagement={props.savedQueryManagement}
          queryStatus={props.queryStatus}
        />
      </EuiFlexItem>
    );
  }

  function renderSharingMetaFields() {
    const { from, to } = getDateRange();
    const dateRangePretty = prettyDuration(
      toAbsoluteString(from),
      toAbsoluteString(to),
      [],
      uiSettings.get('dateFormat')
    );
    return (
      <div
        data-shared-timefilter-duration={dateRangePretty}
        data-test-subj="dataSharedTimefilterDuration"
      />
    );
  }

  /**
   * Determines if the date picker should be rendered based on UI settings, dataset configuration, and language settings.
   *
   * @returns {boolean} Whether the date picker should be rendered
   *
   * UI Settings permutations (isDatePickerEnabled):
   * - showDatePicker=true || showAutoRefreshOnly=true => true
   * - showDatePicker=false && showAutoRefreshOnly=false => false
   * - both undefined => true (default)
   * If isDatePickerEnabled is false, returns false immediately
   *
   * Dataset Type permutations (datasetType?.meta?.supportsTimeFilter):
   * - supportsTimeFilter=false => false
   *
   * Language permutations (when dataset.meta.supportsTimeFilter is undefined or true):
   * - queryLanguage=undefined => true (shows date picker)
   * - queryLanguage exists:
   *   - languageOverrides[queryLanguage].hideDatePicker=true => false
   *   - languageOverrides[queryLanguage].hideDatePicker=false => true
   *   - hideDatePicker=true => false
   *   - hideDatePicker=false => true
   *   - hideDatePicker=undefined => true
   */
  function shouldRenderDatePicker(): boolean {
    const { queryString } = data.query;
    const datasetService = queryString.getDatasetService();
    const languageService = queryString.getLanguageService();
    const isDatePickerEnabled = Boolean(
      (props.showDatePicker || props.showAutoRefreshOnly) ?? true
    );
    if (!isDatePickerEnabled) return false;

    // Get dataset type configuration
    const datasetType = props.query?.dataset
      ? datasetService.getType(props.query?.dataset.type)
      : undefined;
    // Check if dataset type explicitly configures the `supportsTimeFilter` option
    if (datasetType?.meta?.supportsTimeFilter === false) return false;

    if (
      queryLanguage &&
      datasetType?.languageOverrides?.[queryLanguage]?.hideDatePicker !== undefined
    ) {
      return Boolean(!datasetType.languageOverrides[queryLanguage].hideDatePicker);
    }

    return Boolean(!(queryLanguage && languageService.getLanguage(queryLanguage)?.hideDatePicker));
  }

  function shouldRenderQueryEditor(): boolean {
    return Boolean(props.showQueryEditor && props.query && storage);
  }

  function renderUpdateButton() {
    const button = props.customSubmitButton ? (
      React.cloneElement(props.customSubmitButton, { onClick: onClickSubmitButton })
    ) : (
      <EuiButton
        isDisabled={isDateRangeInvalid}
        isLoading={props.isLoading}
        onClick={onClickSubmitButton}
        data-test-subj="querySubmitButton"
        className="euiSuperUpdateButton"
        iconType="play"
        fill
        size={'s'}
      >
        Run
      </EuiButton>
    );

    if (!shouldRenderDatePicker()) {
      return button;
    }

    return (
      <NoDataPopover storage={storage} showNoDataPopover={props.indicateNoData}>
        <EuiFlexGroup responsive={false} gutterSize="s" alignItems="flexStart">
          {renderDatePicker()}
          <EuiFlexItem grow={false}>{button}</EuiFlexItem>
        </EuiFlexGroup>
      </NoDataPopover>
    );
  }

  function renderDatePicker() {
    if (!shouldRenderDatePicker()) {
      return null;
    }

    let recentlyUsedRanges;
    if (props.timeHistory) {
      recentlyUsedRanges = props.timeHistory
        .get()
        .map(({ from, to }: { from: string; to: string }) => {
          return {
            start: from,
            end: to,
          };
        });
    }

    const commonlyUsedRanges = uiSettings!
      .get(UI_SETTINGS.TIMEPICKER_QUICK_RANGES)
      .map(({ from, to, display }: { from: string; to: string; display: string }) => {
        return {
          start: from,
          end: to,
          label: display,
        };
      });

    const wrapperClasses = classNames('osdQueryEditor__datePickerWrapper', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'osdQueryEditor__datePickerWrapper-isHidden': isQueryEditorFocused,
    });

    return (
      <EuiFlexItem className={wrapperClasses}>
        <EuiSuperDatePicker
          start={props.dateRangeFrom}
          end={props.dateRangeTo}
          isPaused={props.isRefreshPaused}
          refreshInterval={props.refreshInterval}
          onTimeChange={onTimeChange}
          onRefresh={onRefresh}
          onRefreshChange={props.onRefreshChange}
          showUpdateButton={false}
          recentlyUsedRanges={recentlyUsedRanges}
          commonlyUsedRanges={commonlyUsedRanges}
          dateFormat={uiSettings!.get('dateFormat')}
          isAutoRefreshOnly={props.showAutoRefreshOnly}
          className="osdQueryEditor__datePicker"
          data-test-subj="osdQueryEditorDatePicker"
          compressed={true}
        />
      </EuiFlexItem>
    );
  }

  const classes = classNames('osdQueryEditor', {
    'osdQueryEditor--withDatePicker': props.showDatePicker,
  });

  const datePicker = (
    <EuiFlexGroup justifyContent="flexEnd" gutterSize="none" responsive={false}>
      <EuiFlexItem
        grow={false}
        className="osdQueryEditor--updateButtonWrapper"
        data-test-subj="osdQueryEditorUpdateButton"
      >
        {renderUpdateButton()}
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const datasetSelector = <>{renderDatasetSelector()}</>;

  return (
    <EuiFlexGroup
      className={classes}
      responsive={!!props.showDatePicker}
      gutterSize="xs"
      direction="column"
      justifyContent="flexEnd"
    >
      {props?.datasetSelectorRef?.current &&
        createPortal(datasetSelector, props.datasetSelectorRef.current)}
      {props?.datePickerRef?.current && uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)
        ? createPortal(datePicker, props.datePickerRef.current)
        : datePicker}
      {renderQueryEditor()}
      <EuiFlexItem>
        <EuiFlexGroup responsive={false} gutterSize="s" direction="column">
          <EuiFlexItem>{renderSharingMetaFields()}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

QueryEditorTopRow.defaultProps = {
  showQueryEditor: true,
  showDatePicker: true,
  showAutoRefreshOnly: false,
};
