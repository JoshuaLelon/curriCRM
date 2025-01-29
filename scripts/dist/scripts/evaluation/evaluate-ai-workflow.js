"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const langsmith_1 = require("@/lib/langsmith");
const ai_runner_1 = require("@/lib/workflows/ai-runner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize Supabase client
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Test case IDs from our seed data
const TEST_CASE_IDS = [
    '00000000-0000-0000-0000-000000000601', // software tutorial
    '00000000-0000-0000-0000-000000000602', // software tutorial
    '00000000-0000-0000-0000-000000000603', // ai explanation
    '00000000-0000-0000-0000-000000000604', // math how_to_guide
    '00000000-0000-0000-0000-000000000605', // software reference
    '00000000-0000-0000-0000-000000000606', // software tutorial
    '00000000-0000-0000-0000-000000000607', // ai explanation
    '00000000-0000-0000-0000-000000000608', // math how_to_guide
    '00000000-0000-0000-0000-000000000609', // software reference
    '00000000-0000-0000-0000-000000000610', // software tutorial
    '00000000-0000-0000-0000-000000000611', // ai explanation
    '00000000-0000-0000-0000-000000000612', // math how_to_guide
    '00000000-0000-0000-0000-000000000613', // software reference
    '00000000-0000-0000-0000-000000000614', // software tutorial
    '00000000-0000-0000-0000-000000000615', // ai explanation
    '00000000-0000-0000-0000-000000000616', // math how_to_guide
    '00000000-0000-0000-0000-000000000617', // software reference
    '00000000-0000-0000-0000-000000000618', // software tutorial
    '00000000-0000-0000-0000-000000000619', // ai explanation
    '00000000-0000-0000-0000-000000000620' // math how_to_guide
];
function evaluateRequest(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        try {
            // Run the workflow
            yield (0, ai_runner_1.runAIWorkflow)(requestId);
            // Get the resulting curriculum
            const { data: curriculum } = yield supabase
                .from('curriculums')
                .select(`
        id,
        curriculum_nodes (
          id,
          level,
          source:sources (
            title
          )
        )
      `)
                .eq('request_id', requestId)
                .single();
            // Get the original request
            const { data: request } = yield supabase
                .from('requests')
                .select('tag, content_type')
                .eq('id', requestId)
                .single();
            if (!curriculum || !request) {
                throw new Error('Failed to fetch curriculum or request data');
            }
            // Calculate metrics
            const nodes = curriculum.curriculum_nodes || [];
            const maxDepth = Math.max(...nodes.map(n => n.level));
            const topics = nodes.map(n => { var _a; return ((_a = n.source) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown'; }).filter(Boolean);
            return {
                requestId,
                tag: request.tag,
                contentType: request.content_type,
                timing: {
                    totalDuration: Date.now() - startTime,
                    nodeTimings: {} // This will be populated by LangSmith
                },
                curriculum: {
                    nodeCount: nodes.length,
                    maxDepth,
                    topics
                }
            };
        }
        catch (error) {
            return {
                requestId,
                tag: 'unknown',
                contentType: 'unknown',
                timing: {
                    totalDuration: Date.now() - startTime,
                    nodeTimings: {}
                },
                curriculum: {
                    nodeCount: 0,
                    maxDepth: 0,
                    topics: []
                },
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting AI workflow evaluation...');
        const results = [];
        for (const requestId of TEST_CASE_IDS) {
            console.log(`\nEvaluating request ${requestId}...`);
            const result = yield evaluateRequest(requestId);
            results.push(result);
            // Log results to LangSmith
            yield langsmith_1.client.createRun({
                name: `evaluation_${requestId}`,
                run_type: "eval",
                inputs: {
                    requestId,
                    tag: result.tag,
                    contentType: result.contentType
                },
                outputs: {
                    timing: result.timing,
                    curriculum: result.curriculum,
                    error: result.error
                }
            });
            // Print results
            console.log('Result:', {
                requestId,
                tag: result.tag,
                contentType: result.contentType,
                duration: `${result.timing.totalDuration}ms`,
                nodeCount: result.curriculum.nodeCount,
                maxDepth: result.curriculum.maxDepth,
                error: result.error
            });
        }
        // Calculate and print summary statistics
        const successful = results.filter(r => !r.error);
        const failed = results.filter(r => r.error);
        const avgDuration = successful.reduce((sum, r) => sum + r.timing.totalDuration, 0) / successful.length;
        const avgNodes = successful.reduce((sum, r) => sum + r.curriculum.nodeCount, 0) / successful.length;
        const avgDepth = successful.reduce((sum, r) => sum + r.curriculum.maxDepth, 0) / successful.length;
        console.log('\nSummary:');
        console.log(`Total test cases: ${results.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);
        console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);
        console.log(`Average nodes per curriculum: ${avgNodes.toFixed(2)}`);
        console.log(`Average tree depth: ${avgDepth.toFixed(2)}`);
        // Log summary to LangSmith
        yield langsmith_1.client.createRun({
            name: "evaluation_summary",
            run_type: "eval",
            inputs: {
                totalCases: results.length
            },
            outputs: {
                successRate: successful.length / results.length,
                avgDuration,
                avgNodes,
                avgDepth,
                failedCases: failed.map(r => ({
                    requestId: r.requestId,
                    error: r.error
                }))
            }
        });
    });
}
main().catch(console.error);
