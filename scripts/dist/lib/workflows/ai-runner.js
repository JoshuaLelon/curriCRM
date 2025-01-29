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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAIWorkflow = runAIWorkflow;
const langgraph_1 = require("@langchain/langgraph");
const supabase_1 = require("@/lib/supabase");
const ai_nodes_1 = require("./ai-nodes");
const types_1 = require("./types");
function announceProgress(requestId, step, current, total) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[AI Runner] Broadcasting progress for request ${requestId}: Step ${current}/${total} (${step})`);
        // Add your progress broadcast logic here
    });
}
function runAIWorkflow(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[AI Runner] Starting workflow for request ${requestId}`);
        try {
            // Set started_at when workflow begins
            console.log(`[AI Runner] Setting started_at for request ${requestId}`);
            const { error: startError } = yield supabase_1.supabase
                .from('requests')
                .update({ started_at: new Date().toISOString() })
                .eq('id', requestId);
            if (startError) {
                console.error(`[AI Runner] Error setting started_at for request ${requestId}:`, startError);
                throw startError;
            }
            // 1) Assemble the state graph
            console.log(`[AI Runner] Assembling state graph for request ${requestId}`);
            const workflow = new langgraph_1.StateGraph({
                channels: types_1.graphState
            })
                // Add nodes with progress tracking wrappers
                .addNode('gatherContext', (state, config) => __awaiter(this, void 0, void 0, function* () {
                console.log(`[AI Runner] Executing gatherContext node for request ${requestId}, input state:`, state);
                yield announceProgress(requestId, 'gatherContext', 1, 4);
                const result = yield (0, ai_nodes_1.gatherContextNode)(state, config);
                console.log(`[AI Runner] Completed gatherContext node for request ${requestId}, result:`, result);
                return result;
            }))
                .addNode('plan', (state, config) => __awaiter(this, void 0, void 0, function* () {
                console.log(`[AI Runner] Executing plan node for request ${requestId}, input state:`, state);
                yield announceProgress(requestId, 'plan', 2, 4);
                const result = yield (0, ai_nodes_1.planNode)(state, config);
                console.log(`[AI Runner] Completed plan node for request ${requestId}, result:`, result);
                return result;
            }))
                .addNode('resourceSearch', (state, config) => __awaiter(this, void 0, void 0, function* () {
                console.log(`[AI Runner] Executing resourceSearch node for request ${requestId}, input state:`, state);
                yield announceProgress(requestId, 'resourceSearch', 3, 4);
                const result = yield (0, ai_nodes_1.resourceSearchNode)(state, config);
                console.log(`[AI Runner] Completed resourceSearch node for request ${requestId}, result:`, result);
                return result;
            }))
                .addNode('build', (state, config) => __awaiter(this, void 0, void 0, function* () {
                console.log(`[AI Runner] Executing build node for request ${requestId}, input state:`, state);
                yield announceProgress(requestId, 'build', 4, 4);
                const result = yield (0, ai_nodes_1.buildCurriculumNode)(state, config);
                console.log(`[AI Runner] Completed build node for request ${requestId}, result:`, result);
                return result;
            }))
                // Edges define the order of steps
                .addEdge('__start__', 'gatherContext')
                .addEdge('gatherContext', 'plan')
                .addEdge('plan', 'resourceSearch')
                .addEdge('resourceSearch', 'build')
                .addEdge('build', '__end__');
            console.log(`[AI Runner] Compiling graph for request ${requestId}`);
            const graphApp = workflow.compile();
            // Run the graph from the start
            console.log(`[AI Runner] Invoking workflow for request ${requestId}`);
            const initialState = {
                requestId,
                context: null,
                planItems: [],
                resources: {}
            };
            try {
                const finalState = yield graphApp.invoke(initialState);
                console.log(`[AI Runner] Workflow execution completed with final state:`, finalState);
                // Mark request as finished in the DB
                console.log(`[AI Runner] Marking request ${requestId} as finished`);
                const { error: finishError } = yield supabase_1.supabase
                    .from('requests')
                    .update({ finished_at: new Date().toISOString() })
                    .eq('id', requestId);
                if (finishError) {
                    console.error(`[AI Runner] Error setting finished_at for request ${requestId}:`, finishError);
                    throw finishError;
                }
                console.log(`[AI Runner] Workflow completed successfully for request ${requestId}`);
            }
            catch (error) {
                throw error;
            }
        }
        catch (error) {
            console.error(`[AI Runner] Error in workflow for request ${requestId}:`, error);
            if (error instanceof Error) {
                console.error(`[AI Runner] Error details for request ${requestId}:`, {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            throw error;
        }
    });
}
