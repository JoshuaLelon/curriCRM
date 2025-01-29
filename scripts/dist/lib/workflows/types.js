"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphState = void 0;
exports.graphState = {
    requestId: {
        value: (x, y) => y !== null && y !== void 0 ? y : x,
        default: () => "",
    },
    context: {
        value: (x, y) => y !== null && y !== void 0 ? y : x,
        default: () => null,
    },
    planItems: {
        value: (x, y) => y,
        default: () => [],
    },
    resources: {
        value: (x, y) => y,
        default: () => ({}),
    },
};
