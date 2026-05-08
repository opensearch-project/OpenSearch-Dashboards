# Visualization Rules Reference

## Table of Contents

- [Overview](#overview)
- [Rules Summary by Chart Type](#rules-summary-by-chart-type)
- [Detailed Rules](#detailed-rules)
  - [Line](#line)
  - [Bar](#bar)
  - [Area](#area)
  - [Pie](#pie)
  - [Scatter](#scatter)
  - [Heatmap](#heatmap)
  - [Metric](#metric)
  - [Gauge](#gauge)
  - [Bar Gauge](#bar-gauge)
  - [Histogram](#histogram)
  - [State Timeline](#state-timeline)
  - [Table](#table)
- [Rule Evaluation Process](#rule-evaluation-process)

## Overview

Each chart type registers one or more `VisRule` objects. A rule declares:

- **priority** — higher values win when multiple rules match the same data shape
- **mappings** — one or more axis-role-to-field-type maps; a rule matches if any mapping is compatible with the input columns
- **render** — produces the chart React element

Axis roles: `x`, `y`, `y2`, `color`, `facet`, `size`, `value`, `time`
Field types: `numerical`, `categorical`, `date`

## Rules Summary by Chart Type

| Chart Type     | # Rules | Axis Patterns Supported                                                                                                                        |
| -------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Line           | 9       | Date×Num, Date×Num×Num, Date×Num×Cat, Date×Num×Num(color), Date×Num×Cat×Cat(facet), Date×Num×Num×Cat(facet), Cat×Num, Cat×Num×Cat, Cat×Num×Num |
| Bar            | 9       | Cat×Num, Date×Num, Date×Num×Cat, Date×Num×Num, Date×Num×Cat×Cat(facet), Date×Num×Num×Cat(facet), Cat×Num×Cat, Cat×Num×Num, Num×Num             |
| Area           | 8       | Date×Num, Date×Num×Cat, Date×Num×Num, Date×Num×Cat×Cat(facet), Date×Num×Num×Cat(facet), Cat×Num, Cat×Num×Cat, Cat×Num×Num                      |
| Pie            | 2       | Num×Cat (size×color), Num×Num (size×color)                                                                                                     |
| Scatter        | 3       | Num×Num, Num×Num×Cat, Num×Num×Cat×Num(size)                                                                                                    |
| Heatmap        | 1       | Cat×Cat×Num (x×y×color)                                                                                                                        |
| Metric         | 4       | Num(value), Num×Date(value×time), Num×Cat(value×facet), Num×Date×Cat(value×time×facet)                                                         |
| Gauge          | 1       | Num(value)                                                                                                                                     |
| Bar Gauge      | 1       | Num×Cat (y×x or x×y)                                                                                                                           |
| Histogram      | 2       | Num×Num, Num(single)                                                                                                                           |
| State Timeline | 4       | Date×Cat×Num, Date×Cat×Cat, Date×Cat(single), Date×Num(single)                                                                                 |
| Table          | 0       | No rules (always available as a fallback)                                                                                                      |

## Detailed Rules

### Line

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>100</td><td><code>x: date, y: numerical</code></td><td>Simple line chart</td></tr>
  <tr><td>100</td><td><code>x: date, y: numerical, y2: numerical</code></td><td>Line + bar combo chart</td></tr>
  <tr><td>100</td><td><code>x: date, y: numerical, color: categorical</code></td><td>Multi-line chart (grouped by category)</td></tr>
  <tr><td>80</td><td><code>x: date, y: numerical, color: numerical</code></td><td>Multi-line chart (grouped by numerical)</td></tr>
  <tr><td>100</td><td><code>x: date, y: numerical, color: categorical, facet: categorical</code></td><td>Faceted multi-line chart</td></tr>
  <tr><td>80</td><td><code>x: date, y: numerical, color: numerical, facet: categorical</code></td><td>Faceted multi-line chart (numerical color)</td></tr>
  <tr><td>40</td><td><code>x: categorical, y: numerical</code></td><td>Category line chart</td></tr>
  <tr><td>40</td><td><code>x: categorical, y: numerical, color: categorical</code></td><td>Category multi-line chart</td></tr>
  <tr><td>40</td><td><code>x: categorical, y: numerical, color: numerical</code></td><td>Category multi-line chart (numerical color)</td></tr>
</table>

### Bar

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>100</td><td><code>x: categorical, y: numerical</code> (or swapped)</td><td>Simple bar chart</td></tr>
  <tr><td>60</td><td><code>x: date, y: numerical</code> (or swapped)</td><td>Time bar chart</td></tr>
  <tr><td>60</td><td><code>x: date, y: numerical, color: categorical</code> (or swapped x/y)</td><td>Grouped time bar chart</td></tr>
  <tr><td>80</td><td><code>x: date, y: numerical, color: numerical</code> (or swapped x/y)</td><td>Grouped time bar chart (numerical color)</td></tr>
  <tr><td>60</td><td><code>x: date, y: numerical, color: categorical, facet: categorical</code> (or swapped x/y)</td><td>Faceted time bar chart</td></tr>
  <tr><td>100</td><td><code>x: date, y: numerical, color: numerical, facet: categorical</code> (or swapped x/y)</td><td>Faceted time bar chart (numerical color)</td></tr>
  <tr><td>100</td><td><code>x: categorical, y: numerical, color: categorical</code> (or swapped x/y)</td><td>Stacked bar chart</td></tr>
  <tr><td>80</td><td><code>x: categorical, y: numerical, color: numerical</code> (or swapped x/y)</td><td>Stacked bar chart (numerical color)</td></tr>
  <tr><td>60</td><td><code>x: numerical, y: numerical</code></td><td>Double numerical bar chart</td></tr>
</table>

Note: Many bar rules include a swapped mapping variant (x↔y) to support horizontal orientation.

### Area

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>80</td><td><code>x: date, y: numerical</code></td><td>Simple area chart</td></tr>
  <tr><td>80</td><td><code>x: date, y: numerical, color: categorical</code></td><td>Multi-area chart</td></tr>
  <tr><td>60</td><td><code>x: date, y: numerical, color: numerical</code></td><td>Multi-area chart (numerical color)</td></tr>
  <tr><td>80</td><td><code>x: date, y: numerical, color: categorical, facet: categorical</code></td><td>Faceted multi-area chart</td></tr>
  <tr><td>60</td><td><code>x: date, y: numerical, color: numerical, facet: categorical</code></td><td>Faceted multi-area chart (numerical color)</td></tr>
  <tr><td>20</td><td><code>x: categorical, y: numerical</code></td><td>Category area chart</td></tr>
  <tr><td>60</td><td><code>x: categorical, y: numerical, color: categorical</code></td><td>Stacked area chart</td></tr>
  <tr><td>60</td><td><code>x: categorical, y: numerical, color: numerical</code></td><td>Stacked area chart (numerical color)</td></tr>
</table>

### Pie

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>60</td><td><code>size: numerical, color: categorical</code></td><td>Pie/donut chart</td></tr>
  <tr><td>40</td><td><code>size: numerical, color: numerical</code></td><td>Pie/donut chart (numerical slices)</td></tr>
</table>

### Scatter

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>100</td><td><code>x: numerical, y: numerical</code></td><td>Two-metric scatter</td></tr>
  <tr><td>100</td><td><code>x: numerical, y: numerical, color: categorical</code></td><td>Two-metric scatter with category coloring</td></tr>
  <tr><td>100</td><td><code>x: numerical, y: numerical, color: categorical, size: numerical</code></td><td>Bubble chart (three metrics + category)</td></tr>
</table>

### Heatmap

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>90</td><td><code>x: categorical, y: categorical, color: numerical</code></td><td>Regular heatmap</td></tr>
</table>

### Metric

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>100</td><td><code>value: numerical</code></td><td>Single metric</td></tr>
  <tr><td>40</td><td><code>value: numerical, time: date</code></td><td>Single metric (with time context)</td></tr>
  <tr><td>50</td><td><code>value: numerical, facet: categorical</code></td><td>Multi-metric (faceted by category)</td></tr>
  <tr><td>50</td><td><code>value: numerical, time: date, facet: categorical</code></td><td>Multi-metric (faceted, with time context)</td></tr>
</table>

### Gauge

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>80</td><td><code>value: numerical</code></td><td>Gauge</td></tr>
</table>

### Bar Gauge

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>80</td><td><code>y: numerical, x: categorical</code> (or swapped)</td><td>Bar gauge</td></tr>
</table>

### Histogram

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>80</td><td><code>x: numerical, y: numerical</code></td><td>Numerical histogram</td></tr>
  <tr><td>60</td><td><code>x: numerical</code></td><td>Single-column histogram</td></tr>
</table>

### State Timeline

<table>
  <tr><th>Priority</th><th>Axis Mapping</th><th>Renderer</th></tr>
  <tr><td>100</td><td><code>x: date, y: categorical, color: numerical</code></td><td>Numerical state timeline</td></tr>
  <tr><td>100</td><td><code>x: date, y: categorical, color: categorical</code></td><td>Categorical state timeline</td></tr>
  <tr><td>100</td><td><code>x: date, color: categorical</code></td><td>Single categorical state timeline</td></tr>
  <tr><td>40</td><td><code>x: date, color: numerical</code></td><td>Single numerical state timeline</td></tr>
</table>

### Table

Table has no rules. It is always available as a visualization type and renders data in a tabular format regardless of column types.

## Rule Evaluation Process

When visualizing data, the system:

1. Classifies all columns in the dataset as `numerical`, `categorical`, or `date`
2. For each registered `VisualizationType`, iterates over its rules and their mappings
3. Counts the required field types in each mapping and compares against available column counts
4. Collects **exact matches** (required counts === available counts) and **compatible matches** (required <= available)
5. Among exact matches, selects the rule with the highest priority — this determines the default chart type
6. The `VisualizationBuilder` uses the matched rule's `render()` function to produce the chart, passing transformed data, style options, and axis-column mappings
7. Users can switch to any other chart type that has at least one compatible rule for the current data
