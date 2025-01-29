# Workflow Metrics Tracking

This directory contains tools for tracking and analyzing AI workflow performance metrics.

[ChatGPT Analysis](https://chatgpt.com/c/679aad72-54f8-8005-b5c6-5a32760430ae)

## Files

- `workflow-metrics.csv`: CSV file containing performance metrics for each workflow run
- `track-metrics.ts`: TypeScript module for appending metrics to the CSV file

## CSV Format

The CSV file tracks the following metrics for each workflow run:

| Column | Description |
|--------|-------------|
| timestamp | ISO timestamp of when metrics were recorded |
| request_id | Unique identifier for the request |
| tag | Topic/tag of the request |
| level | Difficulty level of the request |
| total_duration_ms | Total workflow duration in milliseconds |
| gather_context_ms | Time spent gathering context |
| plan_ms | Time spent planning curriculum |
| resource_search_ms | Time spent searching resources |
| build_ms | Time spent building curriculum |
| num_plan_items | Number of curriculum items generated |
| success | Whether the workflow completed successfully |

## Usage

Metrics are automatically tracked whenever a workflow completes. The data can be analyzed using any spreadsheet software or data analysis tools.

Example analysis queries:
- Average duration by topic
- Success rate by difficulty level
- Performance trends over time
- Bottleneck identification 