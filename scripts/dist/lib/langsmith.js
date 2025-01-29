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
exports.WorkflowMetrics = exports.client = void 0;
exports.traceNode = traceNode;
const langsmith_1 = require("langsmith");
// Create LangSmith client
exports.client = new langsmith_1.Client({
    apiUrl: process.env.LANGCHAIN_ENDPOINT,
    apiKey: process.env.LANGCHAIN_API_KEY
});
// Class to track metrics for a workflow run
class WorkflowMetrics {
    constructor(requestId) {
        this.nodeTimings = {};
        this.startTime = Date.now();
        this.requestId = requestId;
    }
    onNodeStart(nodeName) {
        this.nodeTimings[nodeName] = {
            startTime: Date.now()
        };
    }
    onNodeEnd(nodeName) {
        const timing = this.nodeTimings[nodeName];
        if (timing) {
            timing.endTime = Date.now();
            timing.duration = timing.endTime - timing.startTime;
        }
    }
    logMetrics(success) {
        return __awaiter(this, void 0, void 0, function* () {
            const endTime = Date.now();
            const totalDuration = endTime - this.startTime;
            yield exports.client.createRun({
                name: `workflow_${this.requestId}`,
                run_type: "chain",
                inputs: { requestId: this.requestId },
                outputs: {
                    success,
                    totalDuration,
                    nodeTimings: this.nodeTimings
                }
            });
        });
    }
}
exports.WorkflowMetrics = WorkflowMetrics;
// Higher-order function to trace node execution
function traceNode(nodeName) {
    return function (node) {
        return ((state, config) => __awaiter(this, void 0, void 0, function* () {
            const metrics = state.__metrics;
            if (metrics) {
                metrics.onNodeStart(nodeName);
                try {
                    const result = yield node(state, config);
                    metrics.onNodeEnd(nodeName);
                    return result;
                }
                catch (error) {
                    metrics.onNodeEnd(nodeName);
                    throw error;
                }
            }
            return node(state, config);
        }));
    };
}
