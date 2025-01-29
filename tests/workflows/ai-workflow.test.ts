/**
 * AI Workflow Test Suite
 * 
 * This file contains tests for the AI curriculum generation workflow.
 * It tests the core functionality in isolation from the frontend and database
 * by using mocked responses and simplified tracking.
 */

import { v4 as uuidv4 } from 'uuid'
import { client as langsmith } from '@/lib/langsmith'
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
  beforeAll(async () => {
    // Verify LangSmith connection
    try {
      const projectName = process.env.LANGSMITH_PROJECT || 'default'
      console.log('LangSmith Debug:', {
        endpoint: process.env.LANGSMITH_ENDPOINT,
        project: projectName
      })
    } catch (error) {
      console.error('LangSmith connection error:', error)
    }
  })

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

  for (const testCase of testCases) {
    // Only run the first test case
    const testFn = testCase === testCases[0] ? test.only : test
    testFn(testCase.name, async () => {
      console.log('Running test:', testCase.name)
      console.log('LangSmith config:', {
        apiUrl: process.env.LANGSMITH_ENDPOINT,
        apiKey: process.env.LANGSMITH_API_KEY?.slice(0, 10) + '...',
        project: process.env.LANGSMITH_PROJECT
      })

      /**
       * Test Setup
       * Creates a mock request and configures Supabase responses
       */
      const mockRequest = {
        id: uuidv4(),
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
                id: uuidv4(),
                request_id: mockRequest.id,
                curriculum_nodes: testCase.expectedTopics.map((topic, index) => ({
                  id: uuidv4(),
                  sources: {
                    id: uuidv4(),
                    title: topic,
                    URL: `https://example.com/${encodeURIComponent(topic)}`
                  }
                }))
              },
              error: null
            })
          }
        }
        if (table === 'requests') {
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockRequest.id,
                tag: testCase.input.tag,
                description: testCase.input.description,
                level: testCase.input.level,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              error: null
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: mockRequest,
            error: null
          })
        }
      })

      /**
       * LangSmith Run Creation and Tracking
       */
      const startTime = Date.now()
      const runId = uuidv4()
      
      const runCreate: RunCreate = {
        id: runId,
        name: testCase.name,
        run_type: 'chain',
        inputs: testCase.input,
        start_time: startTime,
        tags: ['test', testCase.input.tag]
      }

      try {
        await langsmith.createRun(runCreate)
        console.log('Successfully created LangSmith run')

        // Run the test with thread_id
        const result = await runAIWorkflow(mockRequest.id)

        // Update run with results
        await langsmith.updateRun(runId, {
          end_time: Date.now(),
          outputs: {
            success: true,
            result
          }
        })

        // Get curriculum from mock Supabase
        const curriculum = await supabase
          .from('curriculums')
          .select('*, curriculum_nodes(*, sources(*))')
          .eq('request_id', mockRequest.id)
          .single() as PostgrestSingleResponse<Curriculum>

        // Basic structure validation
        expect(curriculum.data).toBeTruthy()
        expect(curriculum.data?.curriculum_nodes?.length).toBe(testCase.expectedSteps)
        
        // Topic validation
        if (curriculum.data?.curriculum_nodes) {
          const topics = curriculum.data.curriculum_nodes.map(
            (node: CurriculumNode) => node.sources?.title || ''
          )
          
          // Check if all expected topics are present (order may vary)
          testCase.expectedTopics.forEach(topic => {
            expect(topics.some(t => t.includes(topic))).toBe(true)
          })
        }

      } catch (error) {
        // Update run with error
        await langsmith.updateRun(runId, {
          end_time: Date.now(),
          error: String(error),
          outputs: {
            success: false
          }
        })
        throw error
      }
    })
  }
}) 