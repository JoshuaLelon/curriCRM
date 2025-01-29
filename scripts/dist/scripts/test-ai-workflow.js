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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a test request
        const { data: request, error: requestError } = yield supabase
            .from('requests')
            .insert([
            {
                tag: 'software',
                content_type: 'tutorial',
            }
        ])
            .select()
            .single();
        if (requestError) {
            console.error('Error creating request:', requestError);
            process.exit(1);
        }
        console.log('Created test request:', request);
        // Call the AI workflow API
        const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ai/requests/${request.id}`;
        console.log('Calling API:', url);
        try {
            const response = yield fetch(url, {
                method: 'POST',
            });
            console.log('Response status:', response.status);
            const text = yield response.text();
            console.log('Response text:', text);
            try {
                const result = JSON.parse(text);
                console.log('API response:', result);
            }
            catch (e) {
                console.error('Failed to parse JSON response:', e);
            }
        }
        catch (e) {
            console.error('Network error:', e);
            process.exit(1);
        }
        // Wait for a bit to see if the request gets processed
        console.log('Waiting 5 seconds...');
        yield new Promise(resolve => setTimeout(resolve, 5000));
        // Check if request was processed
        const { data: updatedRequest, error: checkError } = yield supabase
            .from('requests')
            .select('*')
            .eq('id', request.id)
            .single();
        if (checkError) {
            console.error('Error checking request:', checkError);
            process.exit(1);
        }
        console.log('Final request state:', updatedRequest);
    });
}
main().catch(console.error);
