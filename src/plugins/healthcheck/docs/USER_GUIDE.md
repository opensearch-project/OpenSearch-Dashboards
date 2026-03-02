# User Guide - Health Check Plugin

## Overview

The Wazuh dashboard Health Check plugin provides a visual interface to monitor the health status of various Wazuh system components. It allows system administrators to quickly identify issues and verify that all services are functioning correctly.

## Key Features

- **Status overview**: Immediate visualization of the overall system status (Green/Yellow/Red)
- **Checks table**: Detailed list of all health checks performed
- **Data export**: Ability to export check results
- **Integrated documentation**: Direct links to troubleshooting documentation
- **Automatic updates**: Data automatically refreshes to show current status

## Accessing Health Check

1. Log in to Wazuh dashboard
2. In the side navigation menu, look for the "Dashboard Management" section
3. Click on "Health check"

## User Interface

### Main Panel

The main panel displays:

- **Overall status indicator**: A status icon representing the general system health:

  - 🟢 **Green**: Everything is functioning correctly
  - 🟡 **Yellow**: There are warnings that require attention
  - 🔴 **Red**: Critical errors exist that need immediate attention
  - ⚫ **Gray**: Unknown status or verification in progress

- **Checks summary**: Total number of checks performed and their status

### Checks Table

The table shows detailed information about each check:

- **Name**: Check identifier
- **Status**: Current status ('not_started', 'running', 'finished')
- **Result**: Current status response ('gray', 'green', 'yellow', 'red')
- **Description**: Brief description of what is being checked

### Available Actions

#### Export Results

- Click the "Export" button to download results in JSON format
- The file contains all status and check information
- Useful for later analysis or sharing with support team

#### View Check Details

- Click any table row to view additional details
- A side panel will open with specific information about that check
- Includes recommendations and troubleshooting steps

#### Access Documentation

- Click the "Documentation" button to access official documentation
- Directs you to the Wazuh troubleshooting section

## Status Interpretation

### Green Status (Success)

- All components are functioning correctly
- No action required
- System is operational

### Yellow Status (Warning)

- There are components that require attention
- System continues to function but with limitations
- It's recommended to review specific warnings

### Red Status (Danger)

- Critical errors exist
- Functionality is compromised
- Requires immediate attention

### Gray Status (Unknown)

- Could not determine status
- Checks in progress
- Possible connectivity issues

## Common Use Cases

### Routine Monitoring

1. Access Health Check daily
2. Verify that the overall status is green
3. Review any new warnings

### Troubleshooting

1. When experiencing issues, access Health Check
2. Identify checks in red or yellow status
3. Click on the problematic check to view details
4. Follow troubleshooting recommendations
5. Use the documentation link for additional help

### Reports and Documentation

1. Export results regularly to maintain records
2. Use exported data for trend analysis
3. Include screenshots in status reports

## Common Troubleshooting

### Health Check won't load

- Verify network connectivity
- Ensure you have sufficient permissions
- Contact system administrator

### Data doesn't update

- Refresh the page
- Verify that Wazuh services are running
- Check system logs

### Export errors

- Verify that your browser allows downloads
- Ensure you have sufficient disk space
- Try with a different browser

## Best Practices

1. **Regular monitoring**: Check Health Check at least once daily
2. **Problem documentation**: Export results when you find issues
3. **Proactive tracking**: Don't wait for users to report problems
4. **Collaboration**: Share results with the operations team
5. **Escalation**: Use documentation to resolve complex issues

## Contact and Support

For additional help:

- Consult official Wazuh documentation
- Contact technical support team
- Review Wazuh community forums
