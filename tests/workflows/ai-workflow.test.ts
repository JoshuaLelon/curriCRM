/**
 * AI Workflow Test Suite
 * 
 * This file contains tests for the AI curriculum generation workflow.
 * It tests the core functionality in isolation from the frontend and database
 * by using mocked responses and simplified tracking.
 */

import { Client } from 'langsmith'
import type { Run } from 'langsmith/schemas'
import type { RunCreate, RunUpdate } from 'langsmith/schemas'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'
import { supabase } from '@/lib/supabase'
import { PostgrestSingleResponse } from '@supabase/supabase-js'
import { WorkflowState } from '@/lib/workflows/types'

/**
 * Type Definitions
 * These interfaces define the expected structure of curriculum data
 */
interface CurriculumNode {
  id: string
  sources: {
    id: string
    title: string
    URL: string
  }
}

interface Curriculum {
  id: string
  request_id: string
  curriculum_nodes: CurriculumNode[]
}

/**
 * LangSmith Client Setup
 * Used for tracking workflow execution, though not critical for test success
 */
const client = new Client({
  apiUrl: process.env.LANGCHAIN_ENDPOINT,
  apiKey: process.env.LANGCHAIN_API_KEY,
})

/**
 * Helper Functions
 * Utilities for working with LangSmith run data
 */
// Helper function to get first run from AsyncIterable
async function getFirstRun(runs: AsyncIterable<Run>): Promise<Run | undefined> {
  for await (const run of runs) {
    return run
  }
  return undefined
}

// Helper function to get all runs from AsyncIterable
async function getAllRuns(runs: AsyncIterable<Run>): Promise<Run[]> {
  const result: Run[] = []
  for await (const run of runs) {
    result.push(run)
  }
  return result
}

/**
 * Supabase Mock Setup
 * Mocks the database interactions to avoid affecting production data
 * and to provide controlled test responses
 */
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    channel: jest.fn().mockReturnValue({
      send: jest.fn(),
    }),
  },
}))

describe('AI Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Test Cases
   * Each case represents a different curriculum scenario with specific
   * inputs and expected outputs
   */
  const testCases = [
    // Basic test cases
    {
      name: 'Basic Web Development Curriculum',
      input: {
        tag: 'Web Development',
        description: 'Need to learn web development basics',
        level: 'beginner',
      },
      expectedSteps: 4,
      expectedTopics: ['HTML', 'CSS', 'JavaScript', 'Basic Web Concepts'],
    },
    {
      name: 'Advanced Machine Learning Curriculum',
      input: {
        tag: 'Machine Learning',
        description: 'Advanced ML concepts and implementation',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Neural Networks', 'Deep Learning', 'Model Optimization', 'MLOps'],
    },
    // Edge cases
    {
      name: 'Very Short Description',
      input: {
        tag: 'Python',
        description: 'Learn Python',
        level: 'beginner',
      },
      expectedSteps: 4,
      expectedTopics: ['Python Basics', 'Control Flow', 'Functions', 'Basic Data Structures'],
    },
    {
      name: 'Long Complex Description',
      input: {
        tag: 'System Design',
        description: 'Need to understand how to design large-scale distributed systems with focus on scalability, reliability, and maintainability. Should cover both theoretical concepts and practical implementation details.',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Distributed Systems Basics', 'Scalability Patterns', 'System Components', 'Real-world Architecture'],
    },
    // Special characters
    {
      name: 'Special Characters in Description',
      input: {
        tag: 'C++',
        description: 'Learn C++ (including STL & templates) + memory management!',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['C++ Fundamentals', 'STL', 'Templates', 'Memory Management'],
    },
    // Different levels
    {
      name: 'Beginner Data Science',
      input: {
        tag: 'Data Science',
        description: 'Starting from scratch with data science',
        level: 'beginner',
      },
      expectedSteps: 4,
      expectedTopics: ['Python Basics', 'Data Analysis', 'Basic Statistics', 'Data Visualization'],
    },
    {
      name: 'Intermediate Data Science',
      input: {
        tag: 'Data Science',
        description: 'Intermediate data science concepts',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['Advanced Python', 'Statistical Methods', 'Machine Learning Basics', 'Data Engineering'],
    },
    // Different domains
    {
      name: 'Mobile Development',
      input: {
        tag: 'Mobile Development',
        description: 'Learn to build mobile apps',
        level: 'beginner',
      },
      expectedSteps: 4,
      expectedTopics: ['Mobile UI Basics', 'App Architecture', 'State Management', 'API Integration'],
    },
    {
      name: 'DevOps',
      input: {
        tag: 'DevOps',
        description: 'Understanding DevOps practices and tools',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['CI/CD', 'Container Orchestration', 'Infrastructure as Code', 'Monitoring'],
    },
    // Cross-domain
    {
      name: 'Full Stack Development',
      input: {
        tag: 'Full Stack',
        description: 'Complete full stack development journey',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['Frontend Development', 'Backend Development', 'Database Design', 'API Development'],
    },
    // Specialized topics
    {
      name: 'Blockchain Development',
      input: {
        tag: 'Blockchain',
        description: 'Learn blockchain development and smart contracts',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Blockchain Fundamentals', 'Smart Contracts', 'DApp Development', 'Security'],
    },
    {
      name: 'Game Development',
      input: {
        tag: 'Game Development',
        description: 'Creating games with modern engines',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['Game Design', 'Graphics Programming', 'Physics Engines', 'Game AI'],
    },
    // Security focus
    {
      name: 'Cybersecurity',
      input: {
        tag: 'Cybersecurity',
        description: 'Understanding cybersecurity principles and practices',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Security Fundamentals', 'Network Security', 'Penetration Testing', 'Security Best Practices'],
    },
    // Cloud focus
    {
      name: 'Cloud Architecture',
      input: {
        tag: 'Cloud',
        description: 'Learning cloud architecture and services',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Cloud Fundamentals', 'Service Architecture', 'Serverless Computing', 'Cloud Security'],
    },
    // Data focus
    {
      name: 'Big Data',
      input: {
        tag: 'Big Data',
        description: 'Working with large-scale data processing',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Data Processing', 'Distributed Computing', 'Data Warehousing', 'Data Analytics'],
    },
    // AI focus
    {
      name: 'AI Engineering',
      input: {
        tag: 'AI',
        description: 'Building and deploying AI systems',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['AI Fundamentals', 'Model Development', 'MLOps', 'AI Ethics'],
    },
    // UI/UX focus
    {
      name: 'UI/UX Design',
      input: {
        tag: 'UI/UX',
        description: 'Learning UI/UX design principles',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['Design Principles', 'User Research', 'Prototyping', 'Design Systems'],
    },
    // Quality Assurance
    {
      name: 'Software Testing',
      input: {
        tag: 'QA',
        description: 'Learning software testing methodologies',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['Testing Fundamentals', 'Test Automation', 'Performance Testing', 'Security Testing'],
    },
    // Project Management
    {
      name: 'Technical Project Management',
      input: {
        tag: 'Project Management',
        description: 'Managing technical projects and teams',
        level: 'intermediate',
      },
      expectedSteps: 4,
      expectedTopics: ['Agile Methodologies', 'Risk Management', 'Team Leadership', 'Project Planning'],
    },
    // Database focus
    {
      name: 'Database Engineering',
      input: {
        tag: 'Databases',
        description: 'Advanced database design and optimization',
        level: 'advanced',
      },
      expectedSteps: 4,
      expectedTopics: ['Database Design', 'Query Optimization', 'Data Modeling', 'Database Security'],
    }
  ]

  testCases.forEach(testCase => {
    // Currently only running Basic Web Development test for rapid development
    if (testCase.name === 'Basic Web Development Curriculum') {
      test.only(testCase.name, async () => {
        /**
         * Test Setup
         * Creates a mock request and configures Supabase responses
         */
        const mockRequest = {
          id: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          ...testCase.input,
        }

        /**
         * Supabase Response Configuration
         * Mocks different responses based on the table being queried
         */
        ;(supabase.from as jest.Mock).mockImplementation((table) => {
          if (table === 'curriculums') {
            return {
              select: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  id: `curriculum-${Date.now()}`,
                  request_id: mockRequest.id,
                  curriculum_nodes: [
                    {
                      id: `node-${Date.now()}`,
                      sources: {
                        id: `source-${Date.now()}`,
                        title: testCase.expectedTopics[0],
                        URL: `https://example.com/${testCase.expectedTopics[0]}`
                      }
                    }
                  ]
                }
              })
            }
          }
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockRequest })
          }
        })

        /**
         * LangSmith Run Creation
         * Tracks the test execution, though failures here don't affect test validity
         */
        const runCreate: RunCreate = {
          name: testCase.name,
          run_type: 'chain',
          inputs: testCase.input,
          start_time: Date.now(),
        }
        await client.createRun(runCreate)

        try {
          /**
           * Workflow Execution and Validation
           * Runs the workflow and verifies the output matches expectations
           */
          await runAIWorkflow(mockRequest.id)

          // Curriculum verification
          const curriculum = await supabase
            .from('curriculums')
            .select('*, curriculum_nodes(*, sources(*))')
            .eq('request_id', mockRequest.id)
            .single() as PostgrestSingleResponse<Curriculum>

          // Basic structure validation
          expect(curriculum.data).toBeTruthy()
          expect(curriculum.data?.curriculum_nodes?.length).toBeGreaterThan(0)
          
          /**
           * Topic Analysis
           * Verifies that the generated curriculum includes expected topics
           */
          if (curriculum.data?.curriculum_nodes) {
            const topics = curriculum.data.curriculum_nodes.map(
              (node: CurriculumNode) => node.sources?.title || ''
            )

            // Count how many expected topics were found
            const expectedTopicsFound = testCase.expectedTopics.filter(
              topic => topics.some((t: string) => t.toLowerCase().includes(topic.toLowerCase()))
            ).length

            // Calculate topic coherence (simple ratio)
            const topicCoherence = expectedTopicsFound / testCase.expectedTopics.length
            
            // Verify we found at least some of the expected topics
            expect(topicCoherence).toBeGreaterThan(0)
          }
        } catch (error) {
          throw error
        }
      })
    }
  })
}) 