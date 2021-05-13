"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = __importDefault(require("./date"));
class sbError extends global.Error {
    /**
     * Custom error object - has arguments provided
     * @param {Object} obj
     * @param {Error} [error]
     */
    constructor(obj, error) {
        if (!obj || obj.constructor !== Object) {
            throw new global.Error("sbError must receive an object as params");
        }
        const { message, args } = obj;
        super(message);
        this.parentError = error !== null && error !== void 0 ? error : null;
        this.name = obj.name || "sbError";
        this.date = new date_1.default();
        if (args) {
            this.message += "; args = " + JSON.stringify(args, null, 2);
        }
        const stackDescriptor = Object.getOwnPropertyDescriptor(this, "stack");
        Object.defineProperty(this, "stack", {
            get: () => {
                var _a;
                const currentStack = (typeof stackDescriptor.get === "function")
                    ? stackDescriptor.get()
                    : stackDescriptor.value;
                const extraStack = ((_a = this === null || this === void 0 ? void 0 : this.parentError) === null || _a === void 0 ? void 0 : _a.stack)
                    ? `\n=====\nCaused by:\n${this.parentError.stack}`
                    : "";
                return currentStack + extraStack;
            }
        });
    }
    toString() {
        // @ts-ignore
        let description = super.description;
        // @ts-ignore
        if (this.error) {
            // @ts-ignore
            description += `\n${this.error.description}`;
        }
        return description;
    }
}
exports.default = sbError;
;
