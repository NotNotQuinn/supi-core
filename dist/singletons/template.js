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
/** @interface */
class TemplateSingletonModule {
    /**
     * Cleans up the module.
     * All sub-classes must implement this method.
     * @abstract
     */
    destroy() {
        throw new Error("Module.destroy is not implemented");
    }
    /**
     * Constructs the singleton instance.
     * @returns {Promise<void>}
     */
    static singleton() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Module.singleton is not implemented");
        });
    }
    /**
     * File name of the module.
     * All sub-classes must implement this getter.
     * @abstract
     */
    get modulePath() {
        throw new Error("get Module.modulePath is not implemented");
    }
}
exports.default = TemplateSingletonModule;
;
