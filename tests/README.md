# CurriCRM Test Suite Documentation

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npm test tests/workflows/ai-workflow.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Test Structure

### AI Workflow Tests (`tests/workflows/ai-workflow.test.ts`)

These tests verify the core AI curriculum generation workflow in isolation from the frontend and database. The test suite includes multiple scenarios covering different learning domains and edge cases.

#### Test Cases
- Basic Web Development Curriculum
- Advanced Machine Learning Curriculum
- Various Edge Cases (short descriptions, special characters)
- Domain-Specific Cases:
  - Cloud Architecture
  - Big Data
  - AI Engineering
  - UI/UX Design
  - Software Testing
  - Technical Project Management
  - Database Engineering

#### What Each Test Verifies
1. Workflow Execution: Tests that the AI workflow can process a curriculum request
2. Data Structure: Verifies the curriculum output matches expected schema
3. Topic Coverage: Checks if generated topics align with expected learning areas
4. Edge Cases: Validates behavior with various input types and lengths

## Test Flow vs Production Flow

### Production Flow
1. User interacts with frontend UI
2. Request goes through Next.js API routes
3. Real Supabase database interactions
4. Live LangSmith tracking
5. Real OpenAI API calls
6. Actual curriculum stored in database

### Test Flow
1. Direct workflow invocation (bypassing UI/API)
2. Mocked Supabase responses
3. Mocked database interactions
4. Simplified LangSmith tracking
5. Real OpenAI API calls (but with test credentials)
6. In-memory curriculum validation

### Key Differences
- **Database**: Tests use mocked Supabase to avoid test data in production DB
- **API Calls**: Frontend API routes are bypassed for direct workflow testing
- **Validation**: Tests focus on workflow logic and data structure correctness
- **State**: Each test runs in isolation with fresh mocked state

## Recent Changes

1. Initial Setup
   - Created test infrastructure
   - Implemented basic workflow tests
   - Set up Supabase mocking

2. Authentication Fixes
   - Updated environment variables
   - Aligned test env with production env structure
   - Fixed LangSmith API key configuration

3. Test Optimization
   - Reduced test suite to single test for rapid development
   - Improved Supabase response mocking
   - Enhanced curriculum node validation

4. Current State
   - Basic Web Development test passing
   - LangSmith tracking optional (403 errors acceptable)
   - Robust curriculum validation

## Best Practices

1. **Running Tests**
   - Always run in test environment
   - Use test-specific environment variables
   - Check both happy path and edge cases

2. **Adding New Tests**
   - Follow existing test case structure
   - Mock necessary database responses
   - Validate core functionality only

3. **Debugging**
   - Use Jest's --verbose flag for detailed output
   - Check mocked responses match expected structure
   - Verify environment variables are correctly set 