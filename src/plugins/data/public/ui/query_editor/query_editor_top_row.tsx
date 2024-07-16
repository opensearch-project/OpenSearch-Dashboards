/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import dateMath from '@elastic/datemath';
import {
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSuperDatePicker,
  EuiSuperUpdateButton,
  OnRefreshProps,
  prettyDuration,
} from '@elastic/eui';
import classNames from 'classnames';
import { compact, isEqual } from 'lodash';
import React, { useState } from 'react';
import {
  DataSource,
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
import { fromUser, getQueryLog, PersistedLog } from '../../query';
import { Settings } from '../types';
import { NoDataPopover } from './no_data_popover';
import QueryEditorUI from './query_editor';

const QueryEditor = withOpenSearchDashboards(QueryEditorUI);

// @internal
export interface QueryEditorTopRowProps {
  query?: Query;
  dataSourceContainerRef?: React.RefCallback<HTMLDivElement>;
  containerRef?: React.RefCallback<HTMLDivElement>;
  languageSelectorContainerRef?: React.RefCallback<HTMLDivElement>;
  settings?: Settings;
  onSubmit: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onChange: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onRefresh?: (payload: { dateRange: TimeRange }) => void;
  dataTestSubj?: string;
  disableAutoFocus?: boolean;
  screenTitle?: string;
  indexPatterns?: Array<IIndexPattern | string>;
  dataSource?: DataSource;
  isLoading?: boolean;
  prepend?: React.ComponentProps<typeof EuiFieldText>['prepend'];
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
}

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default function QueryEditorTopRow(props: QueryEditorTopRowProps) {
  const [isDateRangeInvalid, setIsDateRangeInvalid] = useState(false);
  const [isQueryEditorFocused, setIsQueryEditorFocused] = useState(false);

  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const { uiSettings, storage, appName } = opensearchDashboards.services;

  const isDataSourceReadOnly = uiSettings.get(UI_SETTINGS.QUERY_DATA_SOURCE_READONLY);

  const queryLanguage = props.query && props.query.language;
  const queryUiEnhancement =
    (queryLanguage &&
      props.settings &&
      props.settings.getQueryEnhancements(queryLanguage)?.searchBar) ||
    null;
  const parsedQuery =
    !queryUiEnhancement || isValidQuery(props.query)
      ? props.query!
      : { query: getQueryStringInitialValue(queryLanguage!), language: queryLanguage! };
  if (!isEqual(parsedQuery?.query, props.query?.query)) {
    onQueryChange(parsedQuery);
    onSubmit({ query: parsedQuery, dateRange: getDateRange() });
  }
  const persistedLog: PersistedLog | undefined = React.useMemo(
    () =>
      queryLanguage && uiSettings && storage && appName
        ? getQueryLog(uiSettings!, storage, appName, queryLanguage)
        : undefined,
    [appName, queryLanguage, uiSettings, storage]
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
      from:
        props.dateRangeFrom ||
        queryUiEnhancement?.dateRange?.initialFrom ||
        defaultTimeSetting.from,
      to: props.dateRangeTo || queryUiEnhancement?.dateRange?.initialTo || defaultTimeSetting.to,
    };
  }

  function onQueryChange(query: Query, dateRange?: TimeRange) {
    if (queryUiEnhancement && !isValidQuery(query)) return;
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

  function isValidQuery(query: Query | undefined) {
    if (!query || !query.query) return false;
    return (
      !Array.isArray(props.indexPatterns!) ||
      compact(props.indexPatterns!).length === 0 ||
      !isDataSourceReadOnly ||
      fromUser(query!.query).includes(
        typeof props.indexPatterns[0] === 'string'
          ? props.indexPatterns[0]
          : props.indexPatterns[0].title
      )
    );
  }

  function getQueryStringInitialValue(language: string) {
    const { indexPatterns, settings } = props;
    const input = settings?.getQueryEnhancements(language)?.searchBar?.queryStringInput
      ?.initialValue;

    if (
      !indexPatterns ||
      (!Array.isArray(indexPatterns) && compact(indexPatterns).length > 0) ||
      !input
    )
      return '';

    const defaultDataSource = indexPatterns[0];
    const dataSource =
      typeof defaultDataSource === 'string' ? defaultDataSource : defaultDataSource.title;

    return input.replace('<data_source>', dataSource);
  }

  function renderQueryEditor() {
    if (!shouldRenderQueryEditor()) return;
    return (
      <EuiFlexItem>
        <QueryEditor
          disableAutoFocus={props.disableAutoFocus}
          indexPatterns={props.indexPatterns!}
          dataSource={props.dataSource}
          prepend={props.prepend}
          query={parsedQuery}
          dataSourceContainerRef={props.dataSourceContainerRef}
          containerRef={props.containerRef}
          languageSelectorContainerRef={props.languageSelectorContainerRef}
          settings={props.settings!}
          screenTitle={props.screenTitle}
          onChange={onQueryChange}
          onChangeQueryEditorFocus={onChangeQueryEditorFocus}
          onSubmit={onInputSubmit}
          getQueryStringInitialValue={getQueryStringInitialValue}
          persistedLog={persistedLog}
          className="osdQueryEditor"
          dataTestSubj={props.dataTestSubj}
          queryLanguage={queryLanguage}
          filterBar={props.filterBar}
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

  function shouldRenderDatePicker(): boolean {
    return Boolean(
      (props.showDatePicker && (queryUiEnhancement?.showDatePicker ?? true)) ??
        (props.showAutoRefreshOnly && (queryUiEnhancement?.showAutoRefreshOnly ?? true))
    );
  }

  function shouldRenderQueryEditor(): boolean {
    // TODO: MQL probably can modify to not care about index patterns
    // TODO: call queryUiEnhancement?.showQueryEditor
    return Boolean(
      props.showQueryEditor && props.settings && props.indexPatterns && props.query && storage
    );
  }

  function renderUpdateButton() {
    const button = props.customSubmitButton ? (
      React.cloneElement(props.customSubmitButton, { onClick: onClickSubmitButton })
    ) : (
      <EuiSuperUpdateButton
        needsUpdate={props.isDirty}
        isDisabled={isDateRangeInvalid}
        isLoading={props.isLoading}
        onClick={onClickSubmitButton}
        data-test-subj="querySubmitButton"
      />
    );

    if (!shouldRenderDatePicker()) {
      return button;
    }

    return (
      <NoDataPopover storage={storage} showNoDataPopover={props.indicateNoData}>
        <EuiFlexGroup responsive={false} gutterSize="s">
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
        />
      </EuiFlexItem>
    );
  }

  const classes = classNames('osdQueryEditor', {
    'osdQueryEditor--withDatePicker': props.showDatePicker,
  });

  return (
    <EuiFlexGroup
      className={classes}
      responsive={!!props.showDatePicker}
      gutterSize="xs"
      direction="column"
      justifyContent="flexEnd"
    >
      <EuiFlexItem grow={false}>{renderUpdateButton()}</EuiFlexItem>
      {renderQueryEditor()}
      <EuiFlexItem>
        <EuiFlexGroup responsive={false} gutterSize="none" direction="column">
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
