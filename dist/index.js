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
// @ts-nocheck
module.exports = (function (namespace = "stolen_sb", options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        globalThis[namespace] = {};
        const files = [
            "objects/date",
            "objects/error",
            "singletons/query",
            "singletons/utils"
        ];
        const { blacklist, whitelist } = options;
        console.groupCollapsed("module load performance");
        for (const file of files) {
            if (blacklist && blacklist.includes(file)) {
                continue;
            }
            else if (whitelist && !whitelist.includes(file)) {
                continue;
            }
            const [type] = file.split("/");
            console.time("Module load: " + file);
            let component = require("./" + file);
            if (type === "objects") {
                globalThis[namespace][component.name] = component;
            }
            else if (type === "singletons") {
                globalThis[namespace][component.name] = yield component.singleton();
            }
            console.timeEnd("Module load: " + file);
        }
        console.groupEnd();
        /** @type {sbQuery} */
        return globalThis[namespace].Query;
    });
});
