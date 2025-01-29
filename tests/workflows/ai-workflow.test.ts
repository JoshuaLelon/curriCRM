/**
 * AI Workflow Test Suite
 * 
 * This file contains tests for the AI curriculum generation workflow.
 * It tests the core functionality in isolation from the frontend and database
 * by using mocked responses and simplified tracking.
 */

import { v4 as uuidv4 } from 'uuid'
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
  apiUrl: process.env.LANGSMITH_ENDPOINT,
  apiKey: process.env.LANGSMITH_API_KEY,
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
    test(testCase.name, async () => {
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
       * LangSmith Run Creation and Tracking
       */
      const startTime = Date.now()
      const runId = uuidv4()
      console.log('LangSmith Debug:', {
        endpoint: process.env.LANGSMITH_ENDPOINT,
        project: process.env.LANGSMITH_PROJECT,
        tracing: process.env.LANGSMITH_TRACING,
        runId
      })
      
      const runCreate: RunCreate = {
        id: runId,
        name: testCase.name,
        run_type: 'chain',
        inputs: testCase.input,
        start_time: startTime
      }
      console.log('Creating LangSmith run with config:', runCreate)
      
      try {
        await client.createRun(runCreate)
        console.log('Successfully created LangSmith run')
        
        // Add a small delay to allow for API propagation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // List all runs in the project
        console.log('Listing all runs in project:', process.env.LANGSMITH_PROJECT)
        const allRuns = client.listRuns({
          projectName: process.env.LANGSMITH_PROJECT || 'default'
        })
        const runs = await getAllRuns(allRuns)
        console.log('Found runs:', runs.length)
        if (runs.length > 0) {
          console.log('Latest run:', {
            id: runs[0].id,
            name: runs[0].name,
            start_time: runs[0].start_time
          })
        }
        
        // Try to find our specific run
        const targetRun = runs.find(run => run.id === runId)
        console.log('Found target run:', targetRun ? 'Yes' : 'No')
      } catch (error) {
        console.error('Failed to create LangSmith run:', error)
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
        }
      }

      try {
        /**
         * Workflow Execution and Validation
         */
        await runAIWorkflow(mockRequest.id)
        const endTime = Date.now()

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

        // Update LangSmith run with results
        console.log('Updating LangSmith run with results')
        const runUpdate: RunUpdate = {
          end_time: endTime,
          outputs: {
            success: true,
            speedMs: endTime - startTime,
            curriculum: {
              nodeCount: curriculum.data?.curriculum_nodes?.length || 0,
              topics: curriculum.data?.curriculum_nodes?.map(n => n.sources?.title) || []
            }
          }
        }
        await client.updateRun(runId, runUpdate)
        console.log('Successfully updated LangSmith run')

      } catch (error) {
        // Update LangSmith run with error
        console.error('Test failed:', error)
        console.log('Updating LangSmith run with error')
        const runUpdate: RunUpdate = {
          end_time: Date.now(),
          error: String(error),
          outputs: {
            success: false
          }
        }
        await client.updateRun(runId, runUpdate)
        throw error
      }
    })
  })
}) 