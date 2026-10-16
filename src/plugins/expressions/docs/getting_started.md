# Getting Started with Expressions

## What are Expressions?

Expressions in OpenSearch Dashboards are a powerful way to process data and create visualizations. An expression is a series of functions chained together, where the output of one function becomes the input of the next. This creates a pipeline that can transform, aggregate, and visualize data.

## Basic Syntax

The basic syntax of an expression is:

```
function1 arg1=value1 arg2=value2 | function2 arg3=value3
```

- Functions are separated by the pipe character `|`
- Arguments are specified with `name=value` pairs
- Strings can be quoted: `arg="value"`
- Numbers and booleans don't need quotes: `arg=123` or `arg=true`

## Writing Your First Expression

Let's start with a simple expression that fetches data and calculates an average:

```
opensearchDashboards
| opensearchaggs
  index=my_index
  metricsAtAllLevels=true
  aggConfigs={
    "aggs": [
      {
        "id": "1",
        "enabled": true,
        "type": "avg",
        "schema": "metric",
        "params": {
          "field": "price"
        }
      }
    ]
  }
```

This expression does the following:

1. `opensearchDashboards`: Initializes the OpenSearch Dashboards context
2. `opensearchaggs`: Performs an aggregation on the specified index
3. The `aggConfigs` argument defines an average aggregation on the "price" field

## Executing an Expression

To execute an expression, you can use the `run` method provided by the Expressions plugin:

```typescript
import { ExpressionsPlugin } from './expressions_plugin';

const result = await expressionsPlugin.run('opensearchDashboards | opensearchaggs ...', context);
```

The `run` method returns a promise that resolves with the result of the expression.

## Adding Visualization

To visualize the result, you can pipe the output to a visualization function. Let's use a metric visualization:

```
opensearchDashboards
| opensearchaggs
  index=my_index
  metricsAtAllLevels=true
  aggConfigs={
    "aggs": [
      {
        "id": "1",
        "enabled": true,
        "type": "avg",
        "schema": "metric",
        "params": {
          "field": "price"
        }
      }
    ]
  }
| metricVis
```

The `metricVis` function at the end of the pipeline will render the average price as a metric visualization.

## Using Variables

You can use variables in your expressions to make them more dynamic:

```
var name="total_sales" value={opensearchaggs index=sales aggConfigs=(...)} |
metricVis
  title="Total Sales"
  metric={visdimension name="total_sales"}
```

This expression stores the result of an aggregation in a variable named "total_sales", then uses that variable in the metric visualization.

## Next Steps

Now that you've written and executed your first expressions, you can:

- Explore more complex aggregations and visualizations
- Learn about [advanced features](advanced-features.md) like sub-expressions and asynchronous functions
- Dive into the [API reference](api-reference.md) to see all available functions and options
- Learn how to [extend the Expressions plugin](extending.md) with your own custom functions

Remember, the power of expressions lies in their composability. You can chain together simple functions to create complex data processing and visualization pipelines!
