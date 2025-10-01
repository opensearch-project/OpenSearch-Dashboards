1. Field Statistics Tab
   User wants to see more information about the fields in their index. They click on the field statistics tab

- In Logs and Metrics flavors, there is a tab in Discover labeled "Field Stats"
- It is always available
- It opens up to a page with this feature

2. Field Statistics Table
   User sees a table with statistics on the fields in their selected dataset

- Contains all field sorted in lexical order
- Row contains type
- Row contains field name
- Row contains num+percentage document count
- Row contains num distinct values

3. Field Statistics Extended Row
   User can extend the row to see further information about the given field

- Specific information depends on the type of the field
- All extended rows contain document information as exists in the un-extended row
- _Timestamp_ type shows an earliest and latest time
- _Keyword, geolocation_ type shows top X values of the field
- _IP, Text_ shows example values
- _Number_ shows min, max, mean + any other stats meaninful for numbers

4. Searching in progress
   While information about fields is being queried, the user sees "searching in progress", indicating that they need to wait a little longer until they can see data.

- The tab opens immediately, showing searching in progress as soon as its open
- Until the results are returned and the table is loaded, this searching in progress bar will remain in the tab
