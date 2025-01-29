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
const supabase_1 = require("@/lib/supabase");
const langsmith_1 = require("@/lib/langsmith");
const ai_runner_1 = require("@/lib/workflows/ai-runner");
function evaluateRequest(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const startTime = Date.now();
        try {
            // Run the workflow
            yield (0, ai_runner_1.runAIWorkflow)(requestId);
            // Get the run from LangSmith
            const runsIterator = langsmith_1.client.listRuns({
                filter: `name LIKE workflow_${requestId}%`,
                limit: 1
            });
            // Get first run
            const firstRun = yield runsIterator[Symbol.asyncIterator]().next();
            if (!firstRun.value) {
                throw new Error('No LangSmith run found');
            }
            const run = firstRun.value;
            const endTime = Date.now();
            // Calculate metrics
            const speedMs = endTime - startTime;
            // For now, we'll use a simple accuracy score based on whether all nodes completed
            // In a production system, this would be replaced with human evaluation
            const accuracyScore = ((_a = run.outputs) === null || _a === void 0 ? void 0 : _a.success) ? 1 : 0;
            return {
                requestId,
                speedMs,
                accuracyScore
            };
        }
        catch (error) {
            return {
                requestId,
                speedMs: Date.now() - startTime,
                accuracyScore: 0,
                error: String(error)
            };
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Get our test cases from the database
        const { data: testRequests, error } = yield supabase_1.supabase
            .from('requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (error || !testRequests) {
            console.error('Failed to load test requests:', error);
            process.exit(1);
        }
        console.log(`Running evaluation on ${testRequests.length} test cases...`);
        const results = [];
        for (const request of testRequests) {
            console.log(`\nEvaluating request ${request.id}...`);
            const result = yield evaluateRequest(request.id);
            results.push(result);
            console.log(`Speed: ${result.speedMs}ms`);
            console.log(`Accuracy: ${result.accuracyScore * 100}%`);
            if (result.error) {
                console.log(`Error: ${result.error}`);
            }
        }
        // Calculate aggregate metrics
        const avgSpeed = results.reduce((sum, r) => sum + r.speedMs, 0) / results.length;
        const avgAccuracy = results.reduce((sum, r) => sum + r.accuracyScore, 0) / results.length;
        const errorRate = results.filter(r => r.error).length / results.length;
        console.log('\n=== Final Results ===');
        console.log(`Average Speed: ${avgSpeed.toFixed(2)}ms`);
        console.log(`Average Accuracy: ${(avgAccuracy * 100).toFixed(2)}%`);
        console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    });
}
main().catch(console.error);
