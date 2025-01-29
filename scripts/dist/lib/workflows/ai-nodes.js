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
exports.buildCurriculumNode = exports.resourceSearchNode = exports.planNode = exports.gatherContextNode = void 0;
const supabase_1 = require("@/lib/supabase");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const langsmith_1 = require("@/lib/langsmith");
// 1) gatherContextNode
exports.gatherContextNode = (0, langsmith_1.traceNode)('gatherContext')((state) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase_1.supabase
        .from('requests')
        .select('*')
        .eq('id', state.requestId)
        .single();
    if (error || !data)
        throw new Error('Unable to load request context');
    return {
        context: data,
    };
}));
// 2) planNode
exports.planNode = (0, langsmith_1.traceNode)('plan')((state) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const tag = ((_a = state.context) === null || _a === void 0 ? void 0 : _a.tag) || 'GeneralTopic';
    const model = new openai_1.ChatOpenAI({ temperature: 0 });
    const response = yield model.call([
        new messages_1.HumanMessage(`Outline sub-topics needed to learn about "${tag}". One per line.`),
    ]);
    const planText = response.text;
    const planItems = planText
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
    return {
        planItems,
    };
}));
// 3) resourceSearchNode
exports.resourceSearchNode = (0, langsmith_1.traceNode)('resourceSearch')((state) => __awaiter(void 0, void 0, void 0, function* () {
    const { planItems = [] } = state;
    const resources = {};
    for (const item of planItems) {
        resources[item] = [
            {
                title: `Mock resource for ${item}`,
                url: `https://example.com/${encodeURIComponent(item)}`
            }
        ];
    }
    return {
        resources,
    };
}));
// 4) buildCurriculumNode
exports.buildCurriculumNode = (0, langsmith_1.traceNode)('build')((state) => __awaiter(void 0, void 0, void 0, function* () {
    const { planItems = [], resources = {}, requestId } = state;
    // Create a new row in 'curriculums'
    const { data: newCurriculum, error: curriculumError } = yield supabase_1.supabase
        .from('curriculums')
        .insert([{ request_id: requestId }])
        .select()
        .single();
    if (curriculumError)
        throw curriculumError;
    // For each plan item, create a source and a curriculum_node
    for (let i = 0; i < planItems.length; i++) {
        const item = planItems[i];
        const [firstResource] = resources[item] || [];
        if (!firstResource)
            continue;
        const { data: newSource, error: sourceError } = yield supabase_1.supabase
            .from('sources')
            .insert([{ title: firstResource.title, URL: firstResource.url }])
            .select()
            .single();
        if (sourceError)
            throw sourceError;
        const { error: nodeError } = yield supabase_1.supabase
            .from('curriculum_nodes')
            .insert([{
                curriculum_id: newCurriculum.id,
                source_id: newSource.id,
                level: i,
                index_in_curriculum: i,
            }]);
        if (nodeError)
            throw nodeError;
    }
    return {};
}));
