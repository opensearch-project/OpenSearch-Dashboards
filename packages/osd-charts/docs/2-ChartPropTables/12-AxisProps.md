### Axis component props table 

The bar chart with axis example in the `Types of charts` section includes only some of the following props. 

| Prop | Type | Default | Note |
|:------|:------:|:---------:|:------|
| chartType | `typeof ChartTypes.XYAxis` | ChartTypes.XYAxis  |  |
| specType  | `typeof SpecTypes.Axis` | SpecTypes.Axis  |  |
| groupId | GroupId | `__global__`  | The ID of the axis group |
| hide  | boolean  | false  | Hide this axis |
| showOverlappingTicks | boolean | false  | Shows all ticks, also the one from the overlapping labels   |
| showOverlappingLabels | boolean  | false  | Shows all labels, also the overlapping ones |
| position |  | Position.Left | Where the axis appear on the chart |
| tickSize | number | 10 | The length of the tick line |
| tickPadding | number | 10 | The padding between the label and the tick |
| tickFormat | `function` | `(tick: any) => ${tick}`| A function called to format each single tick label|
| tickLabelRotation | number | `0`| The degrees of rotation of the tick labels|

***