# Core Concepts of the Expressions Plugin

## Expression Language

The Expressions plugin uses a custom expression language to define data transformations and visualizations. An expression is a string of function calls chained together using the pipe operator (`|`).

Example:

```
myFunction arg1=value1 | anotherFunction arg2=value2
```

## Functions

Functions are the building blocks of expressions. They take input, process it, and produce output. Functions can accept arguments to customize their behavior.

## Arguments

Arguments are key-value pairs passed to functions. They can be of various types, including strings, numbers, booleans, and even nested expressions.

## Execution

When an expression is executed, each function in the chain is called in order. The output of one function becomes the input of the next function in the chain.

## Renderers

Renderers are special functions that take the final output of an expression chain and convert it into a visual representation, typically a React component.

## Types

The Expressions plugin includes a type system that helps ensure function inputs and outputs are compatible. Common types include `string`, `number`, `boolean`, and custom types like `datatable`.

## Context

Expressions can access a shared context object, which can include things like the current time range, filters, or other global state.

## Execution Contract

The `ExecutionContract` provides a way to interact with a running expression, including cancelling execution and accessing intermediate results.

## Nested Expressions

Expressions can be nested within other expressions, allowing for complex compositions of functions. Nested expressions are enclosed in curly braces `{}`.

Example:

```
parentFunction arg1={nestedFunction nestedArg1=value1 | anotherNestedFunction}
```

Understanding these core concepts will help you effectively use and extend the OpenSearch Dashboards Expressions plugin in your development.
