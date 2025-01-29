# AI Workflow Tests

This directory contains automated tests for the AI-powered curriculum generation workflow.

## Test Coverage

The test suite includes 20 diverse test cases covering:

1. Basic scenarios
   - Web Development (beginner)
   - Machine Learning (advanced)

2. Edge cases
   - Very short descriptions
   - Long complex descriptions
   - Special characters in input

3. Different expertise levels
   - Beginner Data Science
   - Intermediate Data Science
   - Advanced topics

4. Various domains
   - Mobile Development
   - DevOps
   - Full Stack
   - Blockchain
   - Game Development
   - Cybersecurity
   - Cloud Architecture
   - Big Data
   - AI Engineering
   - UI/UX Design
   - Software Testing
   - Project Management
   - Database Engineering

## Metrics Tracked

Each test case tracks the following metrics using LangSmith:

1. Completion Time
   - How long it takes to generate a curriculum

2. Steps Completed
   - Number of workflow steps successfully executed
   - Expected: 4 steps (gatherContext, plan, resourceSearch, build)

3. Topic Coherence
   - Ratio of expected topics found in the generated curriculum
   - Score range: 0.0 to 1.0

4. Success Rate
   - Binary score (0 or 1) indicating overall test success

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Each test case follows this structure:

1. Setup
   - Mock request data
   - Configure Supabase responses
   - Initialize LangSmith trace

2. Execution
   - Run AI workflow
   - Track progress through steps

3. Verification
   - Check steps completed
   - Verify curriculum content
   - Analyze topic coherence
   - Record metrics

4. Cleanup
   - Record test results in LangSmith
   - Handle any errors

## Adding New Test Cases

To add a new test case:

1. Add to the `testCases` array in `ai-workflow.test.ts`
2. Include:
   - Unique name
   - Input data (tag, description, level)
   - Expected number of steps
   - Expected topics
3. Follow existing test case structure

Example:
```typescript
{
  name: 'New Test Case',
  input: {
    tag: 'Topic',
    description: 'Description',
    level: 'beginner|intermediate|advanced',
  },
  expectedSteps: 4,
  expectedTopics: ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4'],
}
``` 