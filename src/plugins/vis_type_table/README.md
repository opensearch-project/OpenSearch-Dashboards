# Data Table

This is an OpenSearch Dashboards plugin that is used to visualize data and aggregations in tabular format.

## Create Data Table
To create a data table in OpenSearch Dashboards, first select `Visualize` from the navigation menu. Then click `Create Visualization` and choose `Data Table` as the visualization type.

## Select Metrics

### Metrics Aggregation
At the `Metrics`, select the metric aggregation type from the menu and config it accordinly.

### Buckets Aggregation
At the `Buckets`, config the columns to be displayed in the table visualization.
- `Split Rows` is used when you want to divide one row into more categories. It splits one row into multiple and add columns based on the categories you choose to split. For example, if you split the data based on gender then you want to know more on each gender's clothing preference. You could click `Split Rows` and input `clothing.category` in terms. Each genger's data is now splitted to multiple rows based on a new added column `clothing.category`.
- `Split Table` splits the table into seperate tables for the aggregation you choose. It is similar to `Split Rows`, but this time you will see multiple tables.

## Select Options
In the `Options` tab, you could config more options.
- `Max rows per page` is the maximum number of rows displayed per page.
- `Show metrics for every bucket/level` adds metrics aggregation to every columns.
- `Show partial rows` will include data with missing columns.
- `Show total` calculates the selected metrics per column and displays the result at the bottom.
- `Percentage column` adds one percentage column based on the chosen metrics aggregation.

## Example

Below is an example of creating a table visualization using sample ecommerce data.

- Create a new data table visualization and set a relative time 15 weeks ago.
- Compute the count of ecommerce: Choose `Count` in Metrics Aggregation.
- Split the rows on the top 5 of `manufacturer.keyword` ordered by `Metric:Count` in descending and add a label "manufacturer".
- Split the table in rows on the top 5 of `geoip.city_name` ordered by `Metric:Count` in ascending order.
- Click the `Save` button on the top left and save the visualization as "Top manufacturers by count per city".
- Choose a table and click the download icon to download the table.
