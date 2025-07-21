# Visualization Rules Reference

## Table of Contents

- [Overview](#rule-overview)
- [Rules Summary](#rules-summary)
- [Detailed Rules](#current-rules)
  - [Time Series Rules](#time-series-rules)
  - [Metric and Category Combined Rules](#metric-and-category-combined-rules)
  - [Metric Rules](#metric-rules)
- [Rule Evaluation Process](#rule-evaluation-process)

## Rule Overview

Rules are evaluated based on the number and types of columns in the query resulted data:

- **Numerical columns**: Columns containing numeric values
- **Categorical columns**: Columns containing text or categorical values
- **Date columns**: Columns containing date/timestamp values

Each rule has a unique ID, a matching function, and a list of chart types with priorities. The rule with the highest priority chart type is selected for visualization by default.

## Rules Summary

| Rule ID                                  | Numerical | Categorical | Date | Default Chart | Other Charts    |
| ---------------------------------------- | --------- | ----------- | ---- | ------------- | --------------- |
| one-metric-one-date                      | 1         | 0           | 1    | Line          | Area, Bar       |
| two-metric-one-date                      | 2         | 0           | 1    | Line          | Area, Bar       |
| one-metric-one-category-one-date         | 1         | 1           | 1    | Line          | Area, Bar       |
| one-metric-two-category-one-date         | 1         | 2           | 1    | Line          | Area, Bar       |
| three-metric                             | 3         | 0           | 0    | Heatmap       | -               |
| one-metric-two-category-high-cardinality | 1         | 2           | 0    | Heatmap       | Bar, Area       |
| one-metric-two-category-low-cardinality  | 1         | 2           | 0    | Bar           | Heatmap, Area   |
| one-metric-one-category                  | 1         | 1           | 0    | Bar           | Pie, Line, Area |
| one-metric                               | 1         | 0           | 0    | Metric        | -               |
| two-metric                               | 2         | 0           | 0    | Scatter       | -               |
| two-metric-one-category                  | 2         | 1           | 0    | Scatter       | -               |
| three-metric-one-category                | 3         | 1           | 0    | Scatter       | -               |

## Current Rules

### Time Series Rules

These rules apply to data with date columns and are typically used for time series visualizations.

#### 1. One Metric & One Date Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric-one-date</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Time series visualization for single metric</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>1 Date column</li>
          <li>0 Categorical columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Line Chart (priority: 100) - Default</li>
          <li>Area Chart (priority: 80)</li>
          <li>Bar Chart (priority: 60)</li>
        </ul>
      </td>
  </tr>
</table>

#### 2. Two Metric & One Date Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>two-metric-one-date</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Time series visualization for double metrics</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>2 Numerical columns</li>
          <li>1 Date column</li>
          <li>0 Categorical columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Line Chart (priority: 100) - Default</li>
          <li>Area Chart (priority: 80)</li>
          <li>Bar Chart (priority: 60)</li>
        </ul>
      </td>
  </tr>
</table>

#### 3. One Metric, One Category & One Date Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric-one-category-one-date</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Time series visualization with one metric and one category</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>1 Categorical column</li>
          <li>1 Date column</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Line Chart (priority: 100) - Default</li>
          <li>Area Chart (priority: 80)</li>
          <li>Bar Chart (priority: 60)</li>
        </ul>
      </td>
  </tr>
</table>

#### 4. One Metric, Two Category & One Date Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric-two-category-one-date</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Multiple time series visualizations</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>2 Categorical columns</li>
          <li>1 Date column</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Line Chart (priority: 100) - Default</li>
          <li>Area Chart (priority: 80)</li>
          <li>Bar Chart (priority: 60)</li>
        </ul>
      </td>
  </tr>
</table>

---

### Metric and Category Combined Rules

These rules apply to data with categorical columns and/or multiple numerical columns but no date columns.

#### 5. One Metric, Two Category (High Cardinality) Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric-two-category-high-cardinality</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Heatmap for one metric and two category with high cardinality</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>2 Categorical columns</li>
          <li>0 Date columns</li>
          <li>At least one column has 7 or more unique values</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Heatmap (priority: 100) - Default</li>
          <li>Bar Chart (priority: 80)</li>
          <li>Area Chart (priority: 60)</li>
        </ul>
      </td>
  </tr>
</table>

#### 6. One Metric, Two Category (Low Cardinality) Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric-two-category-low-cardinality</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Bar chart for one metric and two category with low cardinality</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>2 Categorical columns</li>
          <li>0 Date columns</li>
          <li>All columns have fewer than 7 unique values</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Bar Chart (priority: 100) - Default</li>
          <li>Heatmap (priority: 80)</li>
          <li>Area Chart (priority: 60)</li>
        </ul>
      </td>
  </tr>
</table>

#### 7. One Metric, One Category Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric-one-category</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Multiple visualizations for one metric and one category</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>1 Categorical column</li>
          <li>0 Date columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Bar Chart (priority: 100) - Default</li>
          <li>Pie Chart (priority: 80)</li>
          <li>Line Chart (priority: 60)</li>
          <li>Area Chart (priority: 40)</li>
        </ul>
      </td>
  </tr>
</table>

#### 8. Two Metric, One Category Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>two-metric-one-category</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Scatter plot for two metrics and one category</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>2 Numerical columns</li>
          <li>1 Categorical column</li>
          <li>0 Date columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Scatter (priority: 100) - Default</li>
        </ul>
      </td>
  </tr>
</table>

#### 9. Three Metric, One Category Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>three-metric-one-category</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Scatter plot for three metrics and one category</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>3 Numerical columns</li>
          <li>1 Categorical column</li>
          <li>0 Date columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Scatter (priority: 100) - Default</li>
        </ul>
      </td>
  </tr>
</table>

---

### Metric Rules

These rules apply to data with only numerical columns and no categorical or date columns.

#### 10. Two Metric Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>two-metric</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Scatter plot for two metrics</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>2 Numerical columns</li>
          <li>0 Categorical columns</li>
          <li>0 Date columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Scatter (priority: 100) - Default</li>
        </ul>
      </td>
  </tr>
</table>

#### 11. Three Metrics Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>three-metric</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Heatmap with bin for three metric</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>3 Numerical columns</li>
          <li>0 Categorical columns</li>
          <li>0 Date columns</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Heatmap (priority: 100) - Default</li>
        </ul>
      </td>
  </tr>
</table>

#### 12. One Metric Rule

<table>
  <tr><td><strong>ID</strong></td><td><code>one-metric</code></td></tr>
  <tr><td><strong>Description</strong></td><td>Metric visualization for one metric</td></tr>
  <tr><td><strong>Matching Criteria</strong></td>
      <td>
        <ul>
          <li>1 Numerical column</li>
          <li>0 Categorical columns</li>
          <li>0 Date columns</li>
          <li>Exactly 1 valid value in the numerical column</li>
        </ul>
      </td>
  </tr>
  <tr><td><strong>Chart Types</strong></td>
      <td>
        <ul>
          <li>Metric (priority: 100) - Default</li>
        </ul>
      </td>
  </tr>
</table>

## Rule Evaluation Process

When visualizing data, the system:

1. Analyzes the dataset to identify numerical, categorical, and date columns
2. Evaluates all registered rules against the dataset
3. For each matching rule, selects the chart type with the highest priority
4. Among all matching rules, selects the one with the highest priority chart type
5. Renders the visualization using the selected chart type
