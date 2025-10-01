# Discover Histogram Breakdowns Design

## Background

OpenSearch Dashboards provides users with powerful data visualization capabilities through its suite of chart types and aggregation functions. Currently, users visualize data distribution over time using histograms that present data in aggregate form. This limits users' ability to understand how different categorical values contribute to overall patterns.

When analyzing complex datasets, users need to segment data by specific field values to identify trends, outliers, or patterns obscured in aggregated views. For example, a user monitoring application performance requires visibility into response time distributions across different service endpoints, user types, or geographic regions, not just overall response times.

This design document outlines the implementation of histogram breakdowns, enabling users to subdivide histograms by categorical field values, visualizing the top N values as stacked bars with an "other" category for remaining values.

## Requirements Summary

1. **Breakdown Field Selector**: UI component for selecting the field to break down the histogram
2. **Histogram Subdivision**: Visual representation of histogram broken down by top 4 values using stacked bars
3. **Color-Coded Legend**: Legend showing color-to-value mappings for the breakdown
4. **Interactive Labels**: Tooltip/context menu on hover showing value and document count

## Architecture Overview

The histogram breakdown feature integrates seamlessly with the existing histogram query infrastructure by modifying the PPL query generation within the `PPLSearchInterceptor`. When a breakdown field is selected, the Redux state change triggers a modification in the histogram aggregation query, changing it from a simple `stats count() by span()` to a `timechart` query with breakdown support. This approach leverages the existing query processing pipeline without requiring separate query mechanisms.

## Breakdown Field Selector Implementation

### Component Design

The field selector will be implemented as a Single Selection Combo Box using OUI components:

```typescript
interface BreakdownFieldSelectorProps {
  selectedField: string | null;
  availableFields: DataViewField[];
  onFieldChange: (field: string | null) => void;
  isLoading: boolean;
  error?: Error;
}

const BreakdownFieldSelector: React.FC<BreakdownFieldSelectorProps> = ({
  selectedField,
  availableFields,
  onFieldChange,
  isLoading,
  error,
}) => {
  // Filter for string-type fields only
  const stringFields = availableFields.filter(
    (field) => field.type === 'string' && field.aggregatable && !field.scripted
  );

  const options = stringFields.map((field) => ({
    label: field.displayName || field.name,
    value: field.name,
  }));

  return (
    <EuiFlexItem grow={false}>
      <EuiFormRow label="Break down by" error={error?.message} isInvalid={!!error}>
        <EuiComboBox
          placeholder="Select a field"
          singleSelection={{ asPlainText: true }}
          options={options}
          selectedOptions={selectedField ? [{ label: selectedField, value: selectedField }] : []}
          onChange={(selected) => {
            onFieldChange(selected.length > 0 ? selected[0].value : null);
          }}
          isLoading={isLoading}
          isClearable={true}
          compressed
          data-test-subj="histogramBreakdownFieldSelector"
        />
      </EuiFormRow>
    </EuiFlexItem>
  );
};
```

### Positioning and Layout

The selector will be positioned in the histogram header, to the right of the interval selector:

```typescript
// In TimechartHeader component
<EuiFlexGroup gutterSize="s" alignItems="center">
  <EuiFlexItem grow={false}>
    <IntervalSelector ... />
  </EuiFlexItem>
  <EuiFlexItem grow={false}>
    <BreakdownFieldSelector ... />
  </EuiFlexItem>
</EuiFlexGroup>
```

### State Management

The breakdown field selection will be managed through Redux state:

```typescript
// State interface addition
interface ExploreState {
  // ... existing state
  histogram: {
    interval: string;
    breakdownField: string | null;
  };
}

// Action types
const SET_HISTOGRAM_BREAKDOWN_FIELD = 'explore/SET_HISTOGRAM_BREAKDOWN_FIELD';

// Action creator
export const setHistogramBreakdownField = (field: string | null) => ({
  type: SET_HISTOGRAM_BREAKDOWN_FIELD,
  payload: field
});

// Reducer modification
case SET_HISTOGRAM_BREAKDOWN_FIELD:
  return {
    ...state,
    histogram: {
      ...state.histogram,
      breakdownField: action.payload
    }
  };
```

## Chart Rendering with Stacked Bars

### Data Structure Modification

The chart data structure must support multiple series:

```typescript
interface HistogramDataPoint {
  x: number; // timestamp
  y: number; // count
  breakdown?: string; // breakdown value
}

interface HistogramSeries {
  id: string;
  name: string;
  data: HistogramDataPoint[];
  color?: string;
}

interface HistogramChartData {
  series: HistogramSeries[];
  yAxisLabel: string;
  ordered: {
    interval: moment.Duration;
  };
}
```

### Elastic Charts Implementation

Multiple `HistogramBarSeries` components will be rendered for each breakdown value:

```typescript
const renderHistogramSeries = (chartData: HistogramChartData) => {
  const colorPalette = euiPaletteColorBlind();

  return chartData.series.map((series, index) => (
    <HistogramBarSeries
      key={series.id}
      id={series.id}
      name={series.name}
      minBarHeight={2}
      xScaleType={ScaleType.Time}
      yScaleType={ScaleType.Linear}
      xAccessor="x"
      yAccessors={['y']}
      data={series.data}
      timeZone={timeZone}
      color={series.color || colorPalette[index % colorPalette.length]}
      stackAccessors={['x']} // Enable stacking
    />
  ));
};

// In the Chart component
<Chart size="100%">
  <Settings
    showLegend={!!breakdownField}
    legendPosition={Position.Right}
    theme={chartTheme}
    baseTheme={chartBaseTheme}
    onElementClick={onElementClick}
    locale={i18n.getLocale()}
  />
  <Axis id="bottom" position={Position.Bottom} title={xAxisTitle} />
  <Axis id="left" position={Position.Left} title={yAxisTitle} />

  {breakdownField ? (
    renderHistogramSeries(chartData)
  ) : (
    <HistogramBarSeries
      id="discover-histogram"
      name={chartData.yAxisLabel}
      // ... existing props
    />
  )}
</Chart>;
```

## Legend Implementation

The legend will be automatically rendered by Elastic Charts when multiple series are present:

```typescript
// Legend configuration in Settings component
<Settings
  showLegend={!!breakdownField}
  legendPosition={Position.Right}
  legendSize={200}
  theme={{
    ...chartTheme,
    legend: {
      labelOptions: {
        maxLines: 1,
      },
    },
  }}
  legendAction={(series) => [
    {
      id: 'toggleVisibility',
      label: 'Toggle series visibility',
      iconType: series.isVisible ? 'eye' : 'eyeClosed',
      onClick: () => toggleSeriesVisibility(series.id),
    },
  ]}
/>
```

### Legend Item Structure

Each legend item will display:

- Color indicator matching the series
- Field value name (or "Other" for aggregated values)
- Optional document count

## Query Generation Integration

### PPLSearchInterceptor Modification

The breakdown functionality integrates directly into the existing `PPLSearchInterceptor.getAggConfig` method. When a breakdown field is selected in Redux state, it modifies the histogram query generation:

```typescript
// Modified getAggConfig method in PPLSearchInterceptor
private getAggConfig(request: IOpenSearchDashboardsSearchRequest, query: Query) {
  const { aggs } = request.params.body;

  if (!aggs || !query.dataset || !query.dataset.timeFieldName) return;

  const aggsConfig: QueryAggConfig = {};
  const { fromDate, toDate } = formatTimePickerDate(
    this.queryService.timefilter.timefilter.getTime(),
    'YYYY-MM-DD HH:mm:ss.SSS'
  );

  Object.entries(aggs as Record<number, any>).forEach(([key, value]) => {
    const aggTypeKeys = Object.keys(value);
    if (aggTypeKeys.length === 0) {
      return aggsConfig;
    }

    const aggTypeKey = aggTypeKeys[0];
    if (aggTypeKey === 'date_histogram') {
      const dateHistogramAgg = value[aggTypeKey];
      const breakdownField = dateHistogramAgg.breakdownField; // Breakdown field within date_histogram

      aggsConfig[aggTypeKey] = {
        ...dateHistogramAgg,
      };

      const interval = dateHistogramAgg.fixed_interval ??
        dateHistogramAgg.calendar_interval ??
        this.aggsService.calculateAutoTimeExpression({
          from: fromDate,
          to: toDate,
          mode: 'absolute',
        });

      // Generate different query based on breakdown field
      if (breakdownField) {
        // Use timechart for breakdown queries
        aggsConfig.qs = {
          [key]: `${query.query} | timechart span=${interval} limit=4 count() by ${breakdownField}`,
        };
      } else {
        // Use existing stats query for regular histogram
        aggsConfig.qs = {
          [key]: `${query.query} | stats count() by span(${query.dataset!.timeFieldName}, ${interval})`,
        };
      }
    }
  });

  return aggsConfig;
}
```

### Passing Breakdown Field to Search Request

The breakdown field from Redux state needs to be passed within the date_histogram aggregation:

```typescript
// In the histogram search request builder
const searchRequest = {
  params: {
    index: dataView.title,
    body: {
      aggs: {
        2: {
          date_histogram: {
            field: dataView.timeFieldName,
            interval: chartInterval,
            breakdownField: state.histogram.breakdownField, // From Redux state
          },
        },
      },
      query: currentQuery,
      // ... other params
    },
  },
};
```

### Data Processing Pipeline

The timechart results will be processed through the existing histogram data processing pipeline. The key difference is handling multiple series instead of a single series:

```typescript
// In create_histogram_configs.ts or similar
interface TimechartResult {
  timestamp: string;
  [breakdownValue: string]: number | string;
}

export const processHistogramData = (
  response: any,
  breakdownField?: string
): HistogramChartData => {
  if (!breakdownField) {
    // Existing single-series processing
    return processSingleSeriesHistogram(response);
  }

  // Process timechart results with multiple series
  const results = response.rawResponse?.aggregations?.[2]?.buckets || [];
  const seriesMap = new Map<string, HistogramDataPoint[]>();

  results.forEach((bucket: any) => {
    const timestamp = bucket.key;

    // Timechart returns columns for each breakdown value
    Object.entries(bucket).forEach(([key, value]) => {
      if (key === 'key' || key === 'key_as_string') return;

      if (!seriesMap.has(key)) {
        seriesMap.set(key, []);
      }

      seriesMap.get(key)!.push({
        x: timestamp,
        y: typeof value === 'object' ? value.value : value,
        breakdown: key,
      });
    });
  });

  const colorPalette = euiPaletteColorBlind();
  const series: HistogramSeries[] = Array.from(seriesMap.entries()).map(([name, data], index) => ({
    id: `histogram-${name}`,
    name,
    data,
    color: colorPalette[index % colorPalette.length],
  }));

  return {
    series,
    yAxisLabel: 'Document count',
    ordered: {
      interval: moment.duration(results[1]?.key - results[0]?.key),
    },
  };
};
```

### Integration with Histogram Container

The histogram container component will pass the breakdown field within the date_histogram aggregation:

```typescript
// In discover_chart_container.tsx or similar
const buildHistogramRequest = () => {
  const breakdownField = useSelector((state) => state.histogram.breakdownField);

  return {
    params: {
      index: dataView.title,
      body: {
        aggs: {
          2: {
            date_histogram: {
              field: dataView.timeFieldName,
              interval: chartInterval,
              breakdownField, // Pass breakdown field within date_histogram
            },
          },
        },
        query: searchQuery,
      },
    },
  };
};
```

## Error Handling

### Query Error Management

Since the breakdown functionality is integrated into the existing histogram query pipeline, error handling leverages the existing mechanisms in `PPLSearchInterceptor`:

```typescript
// In PPLSearchInterceptor.getAggConfig
private getAggConfig(request: IOpenSearchDashboardsSearchRequest, query: Query) {
  const { aggs } = request.params.body;
  const breakdownField = request.params.body?.breakdownField;

  if (!aggs || !query.dataset || !query.dataset.timeFieldName) return;

  const aggsConfig: QueryAggConfig = {};

  try {
    // ... existing aggregation config code ...

    if (breakdownField) {
      aggsConfig.qs = {
        [key]: `${query.query} | timechart span=${interval} limit=4 count() by ${breakdownField}`,
      };
    }
  } catch (error) {
    aggsConfig.qs = {
      [key]: `${query.query} | stats count() by span(${query.dataset!.timeFieldName}, ${interval})`,
    };
  }

  return aggsConfig;
}
```

### UI Error Handling

The histogram component will handle errors by displaying them next to the breakdown selector:

```typescript
// In histogram container component
const [breakdownError, setBreakdownError] = useState<Error | null>(null);

useEffect(() => {
  const subscription = histogramData$.subscribe({
    next: (data) => {
      if (data.error && state.histogram.breakdownField) {
        // Only show error if it's related to breakdown
        if (data.error.message.includes('timechart')) {
          setBreakdownError(new Error('Unable to load breakdown. Showing standard histogram.'));
          // Clear breakdown field to fall back
          dispatch(setHistogramBreakdownField(null));
        }
      } else {
        setBreakdownError(null);
      }
    },
  });

  return () => subscription.unsubscribe();
}, [histogramData$, state.histogram.breakdownField]);
```

## Feature Toggle Conditions

### Hiding the Selector

The breakdown selector should be hidden when `@timestamp` is not the default time field for the dataset. This information can be obtained from the DataView:

```typescript
const shouldShowBreakdownSelector = (dataView: DataView): boolean => {
  // Only show breakdown selector if @timestamp is the time field
  return dataView.timeFieldName === '@timestamp';
};

// Usage in component
const showBreakdownSelector = shouldShowBreakdownSelector(dataView);

// Conditionally render the selector in TimechartHeader
<EuiFlexGroup gutterSize="s" alignItems="center">
  <EuiFlexItem grow={false}>
    <IntervalSelector ... />
  </EuiFlexItem>
  {showBreakdownSelector && (
    <EuiFlexItem grow={false}>
      <BreakdownFieldSelector ... />
    </EuiFlexItem>
  )}
</EuiFlexGroup>
```

The DataView object provides access to the time field through `dataView.timeFieldName`. When this field is not `@timestamp`, the breakdown functionality should be hidden as it relies on the PPL timechart command which expects the standard timestamp field.

## Performance Considerations

1. **Query Optimization**: Limit breakdown to top 4 values plus "other" to maintain performance
2. **Caching**: Cache breakdown results when time range hasn't changed
