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
var _query, _fetchSingle, _raw, _options, _flat, _select, _from, _where, _having, _orderBy, _groupBy, _join, _limit, _offset, _reference;
const error_1 = __importDefault(require("../../objects/error"));
/**
 * Represents the result of a SELECT statement with (usually) more than one result row.
 */
const ROW_COLLAPSED = Symbol.for("row-collapsed");
class Recordset {
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query) {
        _query.set(this, null);
        _fetchSingle.set(this, false);
        _raw.set(this, null);
        _options.set(this, {});
        _flat.set(this, null);
        _select.set(this, []);
        _from.set(this, { database: null, table: null });
        _where.set(this, []);
        _having.set(this, []);
        _orderBy.set(this, []);
        _groupBy.set(this, []);
        _join.set(this, []);
        _limit.set(this, null);
        _offset.set(this, null);
        _reference.set(this, []);
        /** @type {Query} */
        __classPrivateFieldGet(this, _query) = query;
    }
    /**
     * Sets a flag so the recordset will return the first result directly instead of returning an array.
     * @returns {Recordset}
     */
    single() {
        __classPrivateFieldSet(this, _fetchSingle, true);
        return this;
    }
    /**
     * Sets for the query result to be an array of primitives, instead of an array of objects.
     * The object will be flattened, and only the field values will be preserved.
     * @param {string} field
     */
    flat(field) {
        __classPrivateFieldSet(this, _flat, field);
        return this;
    }
    /**
     * Sets an option to be used when constructing the SQL query.
     * @param {string} option
     * @param {*} value
     */
    use(option, value) {
        __classPrivateFieldGet(this, _options)[option] = value;
        return this;
    }
    /**
     * Sets the LIMIT.
     * @param {number} number
     * @returns {Recordset}
     * @throws {sbError} If number is not a finite number
     */
    limit(number) {
        __classPrivateFieldSet(this, _limit, Number(number));
        if (!Number.isFinite(__classPrivateFieldGet(this, _limit))) {
            throw new error_1.default({
                message: "Limit must be a finite number",
                args: number
            });
        }
        return this;
    }
    /**
     * Sets the OFFSET.
     * @param {number} number
     * @returns {Recordset}
     * @throws {sbError} If number is not a finite number
     */
    offset(number) {
        __classPrivateFieldSet(this, _offset, Number(number));
        if (!Number.isFinite(__classPrivateFieldGet(this, _offset))) {
            throw new error_1.default({
                message: "Offset must be a finite number",
                args: number
            });
        }
        return this;
    }
    /**
     * Sets SELECT fields.
     * @param {string[]} args
     * @returns {Recordset}
     */
    select(...args) {
        __classPrivateFieldSet(this, _select, __classPrivateFieldGet(this, _select).concat(args));
        return this;
    }
    /**
     * Sets the FROM table
     * @param {string} database
     * @param {string} table
     * @returns {Recordset}
     */
    from(database, table) {
        if (!database || !table) {
            throw new error_1.default({
                message: "Recordset: database and table must be provided",
                args: {
                    db: database,
                    table: table
                }
            });
        }
        __classPrivateFieldGet(this, _from).database = database;
        __classPrivateFieldGet(this, _from).table = table;
        return this;
    }
    /**
     * Sets a GROUP BY statement.
     * @param {string[]} args
     * @returns {Recordset}
     */
    groupBy(...args) {
        __classPrivateFieldSet(this, _groupBy, __classPrivateFieldGet(this, _groupBy).concat(args));
        return this;
    }
    /**
     * Sets an ORDER BY statement.
     * @param {string[]} args
     * @returns {Recordset}
     */
    orderBy(...args) {
        __classPrivateFieldSet(this, _orderBy, __classPrivateFieldGet(this, _orderBy).concat(args));
        return this;
    }
    /**
     * Sets a WHERE condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
     * @returns {Recordset}
     */
    where(...args) {
        return this.conditionWrapper("where", ...args);
    }
    /**
     * Sets a HAVING condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array} args
     * @returns {Recordset}
     */
    having(...args) {
        return this.conditionWrapper("having", ...args);
    }
    /**
     * Sets a HAVING/WHERE condition, avoids duplicate code
     * @private
     * @param {"where"|"having"} type
     * @param {Array} args
     * @returns {Recordset}
     */
    conditionWrapper(type, ...args) {
        let options = {};
        if (args[0] && args[0].constructor === Object) {
            options = args[0];
            args.shift();
        }
        if (typeof options.condition !== "undefined" && !options.condition) {
            return this;
        }
        if (typeof options.raw !== "undefined") {
            __classPrivateFieldGet(this, _where).push(options.raw);
            return this;
        }
        let format = "";
        if (typeof args[0] === "string") {
            format = args.shift();
        }
        let index = 0;
        format = format.replace(__classPrivateFieldGet(this, _query).formatSymbolRegex, (fullMatch, param) => (__classPrivateFieldGet(this, _query).parseFormatSymbol(param, args[index++])));
        if (type === "where") {
            __classPrivateFieldSet(this, _where, __classPrivateFieldGet(this, _where).concat(format));
        }
        else if (type === "having") {
            __classPrivateFieldSet(this, _having, __classPrivateFieldGet(this, _having).concat(format));
        }
        else {
            throw new error_1.default({
                message: "Recordset: Unrecognized condition wrapper option",
                args: arguments
            });
        }
        return this;
    }
    /**
     * Sets a table to JOIN.
     * @param {string|Object} target If string, represents the name of the table to join.
     * @param {string} [target.raw] If target is Object, and raw is specified, parsing is skipped and the string is used directly.
     * @param {string} database Database of joined table
     * @param {string} [customField] If set, attempts to join the table via specific field
     * @param {string} left
     * @returns {Recordset}
     */
    join(database, target, customField, left = "") {
        if (typeof target === "string") {
            const dot = (database) ? (database + ".`" + target + "`") : ("`" + target + "`");
            __classPrivateFieldGet(this, _join).push(left + "JOIN " + dot + " ON `" + __classPrivateFieldGet(this, _from).table + "`.`" + (customField || target) + "` = " + dot + ".ID");
        }
        else if (database && database.constructor === Object) {
            const { toDatabase = __classPrivateFieldGet(this, _from).database, toTable, toField, fromTable = __classPrivateFieldGet(this, _from).table, fromField, alias, condition, on } = database;
            if (!toTable || !toDatabase) {
                throw new error_1.default({
                    message: "Missing compulsory arguments for join",
                    args: target
                });
            }
            let result = left + "JOIN `" + toDatabase + "`.`" + toTable + "`";
            if (alias) {
                result += " AS `" + alias + "` ";
            }
            if (on) {
                result += "ON " + on;
            }
            else {
                result += " ON `" + fromTable + "`.`" + fromField + "` = `" + (alias !== null && alias !== void 0 ? alias : toTable) + "`.`" + toField + "`";
                if (condition) {
                    result += " AND " + condition;
                }
            }
            __classPrivateFieldGet(this, _join).push(result);
        }
        else if (target && target.constructor === Object) {
            if (typeof target.raw === "string") {
                __classPrivateFieldGet(this, _join).push(left + "JOIN " + target.raw);
            }
        }
        return this;
    }
    /**
     * Sets a table to LEFT JOIN.
     * @todo - this needs a better implementation
     * @param {string|{raw?: string}} target If string, represents the name of the table to join.
     * If target is Object, and raw is specified, parsing is skipped and the string is used directly.
     * @param {string} database Database of joined table
     * @param {string} [customField] If set, attempts to join the table via specific field
     * @returns {Recordset}
     */
    leftJoin(database, target, customField) {
        return this.join(database, target, customField, "LEFT ");
    }
    /**
     * For more info and detailed usage, check `./reference.md`
     */
    reference(options = {}) {
        const { sourceDatabase = __classPrivateFieldGet(this, _from).database, sourceTable = __classPrivateFieldGet(this, _from).table, sourceField = "ID", targetDatabase = __classPrivateFieldGet(this, _from).database, targetTable, targetField = "ID", targetAlias = null, referenceDatabase = __classPrivateFieldGet(this, _from).database, referenceTable, referenceFieldSource = sourceTable, referenceFieldTarget = targetTable, condition, referenceCondition, targetCondition, fields = [], collapseOn, left = true } = options;
        const joinType = (left) ? "leftJoin" : "join";
        if (referenceTable && targetTable) {
            this[joinType]({
                fromDatabase: sourceDatabase,
                fromTable: sourceTable !== null && sourceTable !== void 0 ? sourceTable : undefined,
                fromField: sourceField,
                toDatabase: referenceDatabase !== null && referenceDatabase !== void 0 ? referenceDatabase : undefined,
                toTable: referenceTable,
                toField: referenceFieldSource !== null && referenceFieldSource !== void 0 ? referenceFieldSource : undefined,
                condition: referenceCondition
            });
            this[joinType]({
                fromDatabase: referenceDatabase !== null && referenceDatabase !== void 0 ? referenceDatabase : undefined,
                fromTable: referenceTable,
                fromField: referenceFieldTarget,
                toDatabase: targetDatabase !== null && targetDatabase !== void 0 ? targetDatabase : undefined,
                toTable: targetTable,
                toField: targetField,
                alias: targetAlias !== null && targetAlias !== void 0 ? targetAlias : undefined,
                condition: targetCondition
            });
            __classPrivateFieldGet(this, _reference).push({
                collapseOn: collapseOn !== null && collapseOn !== void 0 ? collapseOn : null,
                columns: fields,
                target: targetAlias !== null && targetAlias !== void 0 ? targetAlias : targetTable
            });
        }
        else if (targetTable && !referenceTable) {
            this[joinType]({
                fromDatabase: sourceDatabase,
                fromTable: sourceTable !== null && sourceTable !== void 0 ? sourceTable : undefined,
                fromField: sourceField,
                toDatabase: targetDatabase !== null && targetDatabase !== void 0 ? targetDatabase : undefined,
                toTable: targetTable,
                toField: targetField,
                alias: targetAlias !== null && targetAlias !== void 0 ? targetAlias : undefined,
                condition
            });
            __classPrivateFieldGet(this, _reference).push({
                collapseOn: collapseOn !== null && collapseOn !== void 0 ? collapseOn : null,
                columns: fields,
                target: targetAlias !== null && targetAlias !== void 0 ? targetAlias : targetTable
            });
        }
        else {
            throw new error_1.default({
                message: "Too many missing table specifications"
            });
        }
        return this;
    }
    /**
     * Returns Recordset's WHERE condition.
     * @returns {string}
     */
    toCondition() {
        if (__classPrivateFieldGet(this, _where).length !== 0) {
            return "(" + __classPrivateFieldGet(this, _where).join(") AND (") + ")";
        }
        else {
            return "";
        }
    }
    /**
     * Translates Recordset to its SQL representation
     * @returns {string[]}
     * @throws {sbError} If no SELECT statement has been provided. The entire Recordset makes no sense should this happen
     */
    toSQL() {
        if (__classPrivateFieldGet(this, _raw)) {
            return __classPrivateFieldGet(this, _raw);
        }
        if (__classPrivateFieldGet(this, _select).length === 0) {
            throw new error_1.default({
                message: "No SELECT in Recordset - invalid definition"
            });
        }
        let sql = [];
        sql.push("SELECT " + __classPrivateFieldGet(this, _select).map(select => __classPrivateFieldGet(this, _query).escapeIdentifier(select)).join(", "));
        (__classPrivateFieldGet(this, _from)) && sql.push("FROM `" + __classPrivateFieldGet(this, _from).database + "`.`" + __classPrivateFieldGet(this, _from).table + "`");
        (__classPrivateFieldGet(this, _join).length !== 0) && sql.push(__classPrivateFieldGet(this, _join).join(" "));
        (__classPrivateFieldGet(this, _where).length !== 0) && sql.push("WHERE (" + __classPrivateFieldGet(this, _where).join(") AND (") + ")");
        (__classPrivateFieldGet(this, _groupBy).length !== 0) && sql.push("GROUP BY " + __classPrivateFieldGet(this, _groupBy).join(", "));
        (__classPrivateFieldGet(this, _having).length !== 0) && sql.push("HAVING " + __classPrivateFieldGet(this, _having).join(", "));
        (__classPrivateFieldGet(this, _orderBy).length !== 0) && sql.push("ORDER BY " + __classPrivateFieldGet(this, _orderBy).join(", "));
        (__classPrivateFieldGet(this, _limit) !== null) && sql.push("LIMIT " + __classPrivateFieldGet(this, _limit));
        (__classPrivateFieldGet(this, _offset) !== null) && sql.push("OFFSET " + __classPrivateFieldGet(this, _offset));
        return sql;
    }
    /**
     * Executes the SQL query and converts received values to their JS representation.
     * @returns {Promise<Array>}
     */
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = this.toSQL();
            let rows = null;
            try {
                rows = yield __classPrivateFieldGet(this, _query).raw(...sql);
            }
            catch (err) {
                console.error(err);
                throw err;
            }
            const definition = {};
            for (const column of rows.meta) {
                definition[column.name()] = column.type;
            }
            let result = [];
            for (const row of rows) {
                if (__classPrivateFieldGet(this, _flat) && typeof row[__classPrivateFieldGet(this, _flat)] === "undefined") {
                    throw new error_1.default({
                        message: `Column ${__classPrivateFieldGet(this, _flat)} is not included in the result`,
                        args: {
                            column: __classPrivateFieldGet(this, _flat),
                            resultColuns: Object.keys(row)
                        }
                    });
                }
                for (const [name, value] of Object.entries(row)) {
                    let type = definition[name];
                    if (definition[name] === "LONGLONG" && !__classPrivateFieldGet(this, _options).bigint) {
                        type = "LONG";
                    }
                    row[name] = __classPrivateFieldGet(this, _query).convertToJS(value, type);
                }
                if (__classPrivateFieldGet(this, _flat)) {
                    result.push(row[__classPrivateFieldGet(this, _flat)]);
                }
                else {
                    result.push(row);
                }
            }
            if (__classPrivateFieldGet(this, _reference).length > 0) {
                for (const reference of __classPrivateFieldGet(this, _reference)) {
                    if (reference.collapseOn) {
                        Recordset.collapseReferencedData(result, reference);
                    }
                }
                result = result.filter(i => !i[ROW_COLLAPSED]);
            }
            // result.sql = sql;
            return (__classPrivateFieldGet(this, _fetchSingle))
                ? result[0]
                : result;
        });
    }
    static collapseReferencedData(data, options) {
        const keyMap = new Map();
        const { collapseOn: collapser, target, columns } = options;
        const regex = new RegExp("^" + target + "_");
        for (let i = data.length - 1; i >= 0; i--) {
            const row = data[i];
            if (!keyMap.has(row[collapser])) {
                keyMap.set(row[collapser], []);
            }
            else {
                // @ts-ignore
                data[i][ROW_COLLAPSED] = true;
            }
            const copiedProperties = {};
            for (const column of columns) {
                copiedProperties[column.replace(regex, "")] = row[column];
                delete row[column];
            }
            let addProperties = true;
            for (const value of keyMap.get(row[collapser])) {
                const skip = Object.keys(value).every(i => value[i] === copiedProperties[i]);
                if (skip) {
                    addProperties = false;
                    break;
                }
            }
            if (addProperties) {
                keyMap.get(row[collapser]).push(copiedProperties);
            }
        }
        for (const row of data) {
            row[target] = keyMap.get(row[collapser]);
            if (row[target].length === 1) {
                const allNull = !Object.values(row[target][0]).some(Boolean);
                if (allNull) {
                    row[target] = [];
                }
            }
        }
    }
}
_query = new WeakMap(), _fetchSingle = new WeakMap(), _raw = new WeakMap(), _options = new WeakMap(), _flat = new WeakMap(), _select = new WeakMap(), _from = new WeakMap(), _where = new WeakMap(), _having = new WeakMap(), _orderBy = new WeakMap(), _groupBy = new WeakMap(), _join = new WeakMap(), _limit = new WeakMap(), _offset = new WeakMap(), _reference = new WeakMap();
;
module.exports = Recordset;
