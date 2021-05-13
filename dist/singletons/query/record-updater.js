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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _query, _update, _set, _where, _priority, _ignoreDuplicates;
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = __importDefault(require("../../objects/error"));
/**
 * Represents the UPDATE sql statement.
 */
class RecordUpdater {
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query) {
        _query.set(this, null);
        _update.set(this, { database: null, table: null });
        _set.set(this, []);
        _where.set(this, []);
        _priority.set(this, "normal");
        _ignoreDuplicates.set(this, false);
        /** @type {Query} */
        __classPrivateFieldGet(this, _query) = query;
    }
    priority(value) {
        if (!["normal", "low"].includes(value)) {
            throw new error_1.default({
                message: "Incorrect priority value",
                args: { value }
            });
        }
        __classPrivateFieldSet(this, _priority, value);
        return this;
    }
    ignoreDuplicates() {
        __classPrivateFieldSet(this, _ignoreDuplicates, true);
        return this;
    }
    /**
     * Sets the UPDATE database + table.
     * @param {string} database
     * @param {string} table
     * @returns {RecordUpdater}
     */
    update(database, table) {
        __classPrivateFieldGet(this, _update).database = database;
        __classPrivateFieldGet(this, _update).table = table;
        return this;
    }
    /**
     * Sets the SET statement for a specific column.
     * @param {string} column
     * @param {*} value
     * @returns {RecordUpdater}
     */
    set(column, value) {
        __classPrivateFieldSet(this, _set, __classPrivateFieldGet(this, _set).concat({ column, value }));
        return this;
    }
    /**
     * Sets a WHERE condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
     * @returns {RecordUpdater}
     */
    where(...args) {
        let options = {};
        if (args[0] && args[0].constructor === Object) {
            options = args[0];
            args.shift();
        }
        if (typeof options.condition !== "undefined" && !options.condition) {
            return this;
        }
        let format = "";
        if (typeof args[0] === "string") {
            format = args.shift();
        }
        let index = 0;
        format = format.replace(__classPrivateFieldGet(this, _query).formatSymbolRegex, (fullMatch, param) => (__classPrivateFieldGet(this, _query).parseFormatSymbol(param, args[index++])));
        __classPrivateFieldSet(this, _where, __classPrivateFieldGet(this, _where).concat(format));
        return this;
    }
    /**
     * Translates the RecordUpdater to its SQL representation.
     * @returns {Promise<string[]>}
     * @throws {sbError} If no UPDATE database/table have been provided.
     * @throws {sbError} If no SET columns have been provided.
     */
    toSQL() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _update).database || !__classPrivateFieldGet(this, _update).table) {
                throw new error_1.default({
                    message: "No UPDATE database/table in RecordUpdater - invalid definition"
                });
            }
            else if (__classPrivateFieldGet(this, _set).length === 0) {
                throw new error_1.default({
                    message: "No SET in RecordUpdater - invalid definition"
                });
            }
            const sql = [];
            const set = [];
            const { columns } = yield __classPrivateFieldGet(this, _query).getDefinition(__classPrivateFieldGet(this, _update).database, __classPrivateFieldGet(this, _update).table);
            const priority = (__classPrivateFieldGet(this, _priority) === "low") ? "LOW_PRIORITY " : "";
            const ignore = (__classPrivateFieldGet(this, _ignoreDuplicates)) ? "IGNORE " : "";
            sql.push(`UPDATE ${priority} ${ignore} \`${__classPrivateFieldGet(this, _update).database}\`.\`${__classPrivateFieldGet(this, _update).table}\``);
            for (const { column, value } of __classPrivateFieldGet(this, _set)) {
                const definition = columns.find(i => i.name === column);
                if (!definition) {
                    throw new error_1.default({
                        message: `Unrecognized column "${column}"`
                    });
                }
                if (value === null || value === void 0 ? void 0 : value.useField) {
                    set.push(`${column} = ${value.value}`);
                }
                else {
                    set.push(`${column} = ${__classPrivateFieldGet(this, _query).convertToSQL(value, definition.type)}`);
                }
            }
            sql.push("SET " + set.join(", "));
            if (__classPrivateFieldGet(this, _where).length !== 0) {
                sql.push("WHERE (" + __classPrivateFieldGet(this, _where).join(") AND (") + ")");
            }
            return sql;
        });
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = yield this.toSQL();
            return yield __classPrivateFieldGet(this, _query).raw(...sql);
        });
    }
}
exports.default = RecordUpdater;
_query = new WeakMap(), _update = new WeakMap(), _set = new WeakMap(), _where = new WeakMap(), _priority = new WeakMap(), _ignoreDuplicates = new WeakMap();
;
