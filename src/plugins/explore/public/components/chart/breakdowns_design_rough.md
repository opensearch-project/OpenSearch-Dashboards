# Discover Histogram Breakdowns Design

## Background

OpenSearch Dashboards provides users with powerful data visualization capabilities through its suite of chart types and aggregation functions. Currently, users see histograms to visualize the distribution of data over time or other continuous dimensions. However, these visualizations present data in aggregate form, making it challenging to understand how different categorical values contribute to the overall patterns.
When analyzing complex datasets, users often need to segment their data by specific field values to identify trends, outliers, or patterns that may be obscured in aggregated views. For example, a user monitoring application performance might want to see not just the overall response time distribution, but how response times vary across different service endpoints, user types, or geographic regions.

## Requirements

- Breakdown field selector
- Histogram is broken down into sub-bars
- Legend/Key of values associated with what color
- Histogram labels
  - seen from hovering over the sub-bar

## Breakdown field Selector

_**Single Selection Combo Box**_ ([ref](https://oui.opensearch.org/1.21/#/forms/combo-box#single-selection))

Putting it to the right of the Interval selector, up on the top of the histogram
All of the options in this box would be populated by the fields available in the dataset.
Filter out all fields that do not match the type `string`

Selecting a field option in here should modify the redux state

- changing that breakdown selector box simply just changes the histogram breakdown
- that breakdown field sets redux state
- need to make sure that the redux state persists

## Chart

Although the team is moving towards creating new charts with vega visualization by scratch, this project will simply use the existing Elastic Chart (which seems to be a wrapper on vega visualization).

TODO: Put in the current Elastic Chart code and then put in code that describes what change I'm making

Current Elastic Chart is defined as so:

```
    <Chart size="100%">
      <Settings
        ...
      />
      <Axis
        ...
      />
      <Axis
        ...
      />
      <LineAnnotation
        ...
      />
      <RectAnnotation
        ...
      />
      {chartType === 'HistogramBar' && (
        <>
          <HistogramBarSeries
            id="discover-histogram"
            minBarHeight={2}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={data}
            timeZone={timeZone}
            name={chartData.yAxisLabel}
          />
        </>
      )}
      {chartType === 'Line' && (
        <LineSeries
            ...
        />
      )}
    </Chart>
```

To create the sub-bar divisions, its as easy as defining multiple `HistogramBarSeries`

TODO: Include how the code will look if i include multiple HistogramBarSeries

TODO: Explain how I change the chartData interface to pick up the results and then process the data to become available for the HistogramBarSeries.

## Algorithm/Method of gathering “Top N + Other” Series Aggregations

Use the new `timechart` command ([ref](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/timechart.rst)), which has a built in “limit series” option.

Pros:

- Relatively simple query. It would just be `timechart span=<time_interval> limit=4 count by <field>`, and would group everything past the limit in an “other” category automatically. Perfect for this use case

Cons:

- We need to include new section within the code that is able to assert the version that we are on

## Histogram query modifications to use breakdown query / field

For the design, all I have to do in order to stack the bars on top of each other:
Just add another `HistogramBarSeries`
For the color: just give it a new style

Change the histogram query sent out to optionally check for if a breakdown exists, then have it send out the query with the breakdown if thats triggered

Sending out the query with the breakdown will have to be changed within searchsource:
Meaning we change `legacyFetch`, `fetchExternalSearch`, and `fetchSearch`

Histogram query now:

Histogram query with breakdown:

Base all of the bars off of the histogram results we get.

## Hiding the breakdown field selector

Hiding the breakdown field selector requires us to be aware of if @timestamp is the default time field for the dataset

## Erroring the breakdown field selector

When the user selects a field within the selector, the `timechart` query gets sent and returned with an error, this error should be displayed next to the selector, and shouldn't update anything
