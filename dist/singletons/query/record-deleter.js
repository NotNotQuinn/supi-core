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
var _query, _deleteFrom, _where, _confirmedFullDelete;
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = __importDefault(require("../../objects/error"));
/**
 * Represents the UPDATE sql statement.
 */
class RecordDeleter {
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query) {
        _query.set(this, null);
        _deleteFrom.set(this, { database: null, table: null });
        _where.set(this, []);
        _confirmedFullDelete.set(this, false);
        /** @type {Query} */
        __classPrivateFieldGet(this, _query) = query;
    }
    /**
     * Placeholder for the "correct" SQL syntax
     * @returns {RecordDeleter}
     */
    delete() {
        return this;
    }
    /**
     * Creates a FROM statement for DELETE
     * @param {string} database
     * @param {string} table
     * @returns {RecordDeleter}
     */
    from(database, table) {
        __classPrivateFieldGet(this, _deleteFrom).database = database;
        __classPrivateFieldGet(this, _deleteFrom).table = table;
        return this;
    }
    /**
     * Sets a WHERE condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
     * @returns {RecordDeleter}
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
     * If there is a need to delete without WHERE, this flag must be set.
     * Otherwise, a no-condition DELETE will not be performed, and ends with an exception.
     * @returns {RecordDeleter}
     * @throws {sbError} If no FROM database/table have been provided.
     */
    confirm() {
        __classPrivateFieldSet(this, _confirmedFullDelete, true);
        return this;
    }
    /**
     * Translates the RecordDeleter to its SQL representation.
     * @returns {Promise<string[]>}
     * @throws {sbError} If no FROM database/table have been provided.
     */
    toSQL() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _deleteFrom).database || !__classPrivateFieldGet(this, _deleteFrom).table) {
                throw new error_1.default({
                    message: "No UPDATE database/table in RecordUpdater - invalid definition"
                });
            }
            const sql = [];
            sql.push(`DELETE FROM \`${__classPrivateFieldGet(this, _deleteFrom).database}\`.\`${__classPrivateFieldGet(this, _deleteFrom).table}\``);
            if (__classPrivateFieldGet(this, _where).length !== 0) {
                sql.push("WHERE (" + __classPrivateFieldGet(this, _where).join(") AND (") + ")");
            }
            else {
                if (!__classPrivateFieldGet(this, _confirmedFullDelete)) {
                    throw new error_1.default({
                        message: "Unconfirmed full table deletion",
                        args: {
                            from: __classPrivateFieldGet(this, _deleteFrom)
                        }
                    });
                }
            }
            return sql;
        });
    }
    /**
     * Runs the UPDATE SQL query and returns the status object.
     * @returns {Object}
     */
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = yield this.toSQL();
            return yield __classPrivateFieldGet(this, _query).raw(...sql);
        });
    }
}
exports.default = RecordDeleter;
_query = new WeakMap(), _deleteFrom = new WeakMap(), _where = new WeakMap(), _confirmedFullDelete = new WeakMap();
;
