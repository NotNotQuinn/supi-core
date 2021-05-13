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
var _loggingThreshold, _definitionPromises;
Object.defineProperty(exports, "__esModule", { value: true });
const mariadb_1 = __importDefault(require("mariadb"));
const batch_js_1 = __importDefault(require("./batch.js"));
const recordset_js_1 = __importDefault(require("./recordset.js"));
const record_deleter_js_1 = __importDefault(require("./record-deleter.js"));
const record_updater_js_1 = __importDefault(require("./record-updater.js"));
const row_js_1 = __importDefault(require("./row.js"));
const template_js_1 = __importDefault(require("../template.js"));
// Originaly in global object 'sb' however that does not translate to typescript.
// especially because the global object is used in its own definition.
const error_1 = __importDefault(require("../../objects/error")); // sb.Error
const date_1 = __importDefault(require("../../objects/date")); // sb.Date
// sb.Utils.isValidInteger
const isValidInteger = (input, minLimit = 0) => {
    if (typeof input !== "number") {
        return false;
    }
    return Boolean(Number.isFinite(input) && Math.trunc(input) === input && input >= minLimit);
};
const updateBatchLimit = 1000;
const formatSymbolRegex = /%(s\+|n\+|b|dt|d|n|p|s|t|\*?like\*?)/g;
/**
 * Query represents every possible access to the database.
 * Exposes multiple ways to access:
 * {@link Row}: Single table row, select/insert/update/delete
 * {@link Recordset}: Result of a compound SELECT statement
 * {@link Batch}: A tool to INSERT multiple rows in one statement, for specified columns
 * {@link RecordUpdater}: UPDATEs specified columns with values, with specified condition(s)
 * @name Query
 */
class Query extends template_js_1.default {
    constructor() {
        var _a, _b;
        super();
        this.tableDefinitions = {};
        _loggingThreshold.set(this, null);
        _definitionPromises.set(this, new Map());
        this.activeConnections = new Set();
        if (!process.env.MARIA_USER || !process.env.MARIA_PASSWORD || (!process.env.MARIA_HOST && !process.env.MARIA_SOCKET_PATH)) {
            throw new error_1.default({ message: "Database access must be initialized first" });
        }
        /** @type {TableDefinition[]} */
        this.tableDefinitions = {};
        if (process.env.MARIA_SOCKET_PATH) {
            this.pool = mariadb_1.default.createPool({
                user: process.env.MARIA_USER,
                password: process.env.MARIA_PASSWORD,
                socketPath: process.env.MARIA_SOCKET_PATH,
                connectionLimit: (_a = Number(process.env.MARIA_CONNECTION_LIMIT)) !== null && _a !== void 0 ? _a : 25
            });
        }
        else if (process.env.MARIA_HOST) {
            this.pool = mariadb_1.default.createPool({
                user: process.env.MARIA_USER,
                host: process.env.MARIA_HOST,
                port: Number(process.env.MARIA_PORT) || 3306,
                password: process.env.MARIA_PASSWORD,
                connectionLimit: (_b = Number(process.env.MARIA_CONNECTION_LIMIT)) !== null && _b !== void 0 ? _b : 25
            });
        }
        else {
            throw new error_1.default({
                message: "Not enough info provided in process.env for Query to initialize"
            });
        }
    }
    /**
     * @inheritDoc
     * @returns {Query}
     */
    static singleton() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Query.module) {
                Query.module = new Query();
            }
            return Query.module;
        });
    }
    /**
     * Executes a raw SQL query.
     * @param {...string} args
     * @returns {Promise<*>}
     */
    raw(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = args.join("\n");
            const timing = {
                start: process.hrtime.bigint()
            };
            const connector = yield this.pool.getConnection();
            timing.connection = process.hrtime.bigint();
            this.activeConnections.add(connector.threadId);
            const result = connector.query({
                sql: query,
                multipleStatements: true
            });
            timing.result = process.hrtime.bigint();
            yield connector.end();
            this.activeConnections.delete(connector.threadId);
            timing.end = process.hrtime.bigint();
            if (__classPrivateFieldGet(this, _loggingThreshold) !== null && (timing.end - timing.start) > (__classPrivateFieldGet(this, _loggingThreshold) * 1e6)) {
                console.warn("Query time threshold exceeded", {
                    timing: {
                        full: Number(timing.end - timing.start) / 1e6,
                        getConnection: Number(timing.connection - timing.start) / 1e6,
                        query: Number(timing.result - timing.connection) / 1e6,
                        cleanup: Number(timing.end - timing.result) / 1e6
                    },
                    hrtime: timing,
                    query,
                    timestamp: new date_1.default().sqlDateTime(),
                    stack: new Error().stack
                });
            }
            return result;
        });
    }
    /**
     * @alias Query.raw
     */
    send(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.raw(...args);
        });
    }
    /**
     * Prepares a transaction for next use.
     * Transaction must be commited/rollbacked manually afterwards.
     * @returns {Promise<*>}
     */
    getTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            const connector = yield this.pool.getConnection();
            connector.beginTransaction();
            return connector;
        });
    }
    /**
     * Creates a new Recordset instance.
     * @param {RecordsetCallback} callback
     * @returns {Promise<Array>}
     */
    getRecordset(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const rs = new recordset_js_1.default(this);
            callback(rs);
            return yield rs.fetch();
        });
    }
    /**
     * Creates a new RecordDeleter instance.
     * @param callback
     * @returns {Promise<*>}
     */
    getRecordDeleter(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const rd = new record_deleter_js_1.default(this);
            callback(rd);
            return yield rd.fetch();
        });
    }
    /**
     * Creates a new RecordUpdater instance.
     * @param {RecordsetCallback} callback
     * @returns {Promise<Array>}
     */
    getRecordUpdater(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const ru = new record_updater_js_1.default(this);
            callback(ru);
            return yield ru.fetch();
        });
    }
    /**
     * Creates a new Row instance.
     * @param {string} database Database of the table
     * @param {string} table Name of the table
     * @returns {Promise<Row>}
     */
    getRow(database, table) {
        return __awaiter(this, void 0, void 0, function* () {
            let row = new row_js_1.default(this, database, table);
            yield row.readyPromise;
            return row;
        });
    }
    /**
     * Returns a new Batch instance.
     * @param {string} database Database of the table
     * @param {string} table Name of the table
     * @param {string[]} columns Column names to insert into given table
     * @returns {Promise<Batch>}
     */
    getBatch(database, table, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            let batch = new batch_js_1.default(this, database, table, columns);
            yield batch.readyPromise;
            return batch;
        });
    }
    isRecordset(input) { return (input instanceof recordset_js_1.default); }
    isRecordDeleter(input) { return (input instanceof record_deleter_js_1.default); }
    isRecordUpdater(input) { return (input instanceof record_updater_js_1.default); }
    isRow(input) { return (input instanceof row_js_1.default); }
    isBatch(input) { return (input instanceof batch_js_1.default); }
    /**
     * Fetches the definition of a specific table.
     * @param {string} database
     * @param {string} table
     * @returns {Promise<TableDefinition>}
     */
    getDefinition(database, table) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = database + "." + table;
            if (this.tableDefinitions[database] && this.tableDefinitions[database][table]) {
                return this.tableDefinitions[database][table];
            }
            else if (__classPrivateFieldGet(this, _definitionPromises).has(key)) {
                return __classPrivateFieldGet(this, _definitionPromises).get(key);
            }
            const promise = (() => __awaiter(this, void 0, void 0, function* () {
                const path = this.escapeIdentifier(database) + "." + this.escapeIdentifier(table);
                const escapedPath = "`" + this.escapeIdentifier(database) + "`.`" + this.escapeIdentifier(table) + "`";
                this.tableDefinitions[database] = this.tableDefinitions[database] || {};
                let obj = {
                    name: table, database: database, path: path, escapedPath: escapedPath, columns: []
                };
                const data = yield this.raw("SELECT * FROM " + escapedPath + " WHERE 1 = 0");
                for (const column of data.meta) {
                    obj.columns.push({
                        name: column.name(),
                        type: (Boolean(column.flags & Query.flagMask["SET"])) ? "SET" : column.type,
                        notNull: Boolean(column.flags & Query.flagMask["NOT_NULL"]),
                        primaryKey: Boolean(column.flags & Query.flagMask["PRIMARY_KEY"]),
                        unsigned: Boolean(column.flags & Query.flagMask["UNSIGNED"])
                    });
                }
                this.tableDefinitions[database][table] = obj;
                __classPrivateFieldGet(this, _definitionPromises).delete(key);
                return this.tableDefinitions[database][table];
            }))();
            __classPrivateFieldGet(this, _definitionPromises).set(key, promise);
            return promise;
        });
    }
    /**
     * Returns a boolean determining if a given database (schema) - table combination exists.
     * @param {string} database
     * @param {string} table
     * @returns {Promise<boolean>}
     */
    isTablePresent(database, table) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield this.getRecordset(rs => rs
                .select("1")
                .from("INFORMATION_SCHEMA", "TABLES")
                .where("TABLE_SCHEMA = %s", database)
                .where("TABLE_NAME = %s", table));
            return (exists.length !== 0);
        });
    }
    /**
     * Performs a configurable batched update.
     * Supports staggering, grouping statements into transactions, and more.
     * @param {Object[]} data List of rows to update
     * @param {Object} options Configurable options object
     * @param {Function} options.callback Callback that gets passed into the RecordUpdater instances
     * @returns {Promise<void>}
     */
    batchUpdate(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { batchSize, callback, staggerDelay } = options;
            if (typeof callback !== "function") {
                throw new error_1.default({
                    message: `Callback must be a function, received ${typeof callback}`
                });
            }
            const limit = (isValidInteger(batchSize))
                ? batchSize
                : updateBatchLimit;
            const queries = yield Promise.all(data.map((row) => __awaiter(this, void 0, void 0, function* () {
                const ru = new record_updater_js_1.default(this);
                callback(ru, row);
                const sql = yield ru.toSQL();
                return sql.join(" ") + ";";
            })));
            if (isValidInteger(staggerDelay)) {
                let counter = 0;
                for (let i = 0; i <= queries.length; i += limit) {
                    let slice = queries.slice(i, i + limit).join("\n");
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        const transaction = yield this.getTransaction();
                        try {
                            yield transaction.query(slice);
                            yield transaction.commit();
                        }
                        catch (_b) {
                            yield transaction.rollback();
                        }
                        finally {
                            yield transaction.end();
                            slice = null;
                        }
                    }), (counter * staggerDelay));
                    counter++;
                }
            }
            else {
                for (let i = 0; i <= queries.length; i += limit) {
                    const transaction = yield this.getTransaction();
                    const slice = queries.slice(i, i + limit);
                    try {
                        yield transaction.query(slice.join("\n"));
                        yield transaction.commit();
                    }
                    catch (_a) {
                        yield transaction.rollback();
                    }
                }
            }
        });
    }
    /**
     * Creates a condition string, based on the same syntax Recordset uses
     * @param {Function} callback
     * @returns {string}
     */
    getCondition(callback) {
        const rs = new recordset_js_1.default(this);
        callback(rs);
        return rs.toCondition();
    }
    /**
     * Invalidates a specific table definition.
     * The next time it is accessed, it will be refreshed.
     * @param {string} database Database of table
     * @param {string} table Name of table
     */
    invalidateDefinition(database, table) {
        if (this.tableDefinitions[database] && this.tableDefinitions[database][table]) {
            this.tableDefinitions[database][table] = null;
        }
    }
    /**
     * Invalidates all table definitions.
     * The next time they're accessed, they will be refreshed.
     */
    invalidateAllDefinitions() {
        this.tableDefinitions = {};
    }
    /**
     * Converts a SQL value and type to a Javascript value
     * SQL TINYINT(1) -> JS boolean
     * SQL DATE/DATETIME/TIMESTAMP -> JS sbDate
     * SQL JSON -> JS Object
     * SQL *INT/*TEXT/*CHAR -> JS number/string
     * @param {*} value
     * @param {string} type
     * @returns {*}
     */
    convertToJS(value, type) {
        if (value === null) {
            return value;
        }
        switch (type) {
            case "TINY": return (value === 1);
            // case "TIME":
            case "DATE":
            case "DATETIME":
            case "TIMESTAMP": return new date_1.default(value);
            case "LONGLONG": return BigInt(value);
            case "JSON": return JSON.parse(value);
            default: return value;
        }
    }
    /**
     * Converts a Javascript value to its SQL counterpart
     * JS null -> SQL NULL
     * JS boolean -> SQL TINYINT(1)
     * JS Date/sbDate -> SQL TIME/DATE/DATETIME/TIMESTAMP
     * JS string -> escaped SQL VARCHAR/*TEXT
     * JS number -> SQL *INT
     * @param {*} value Javascript value to convert
     * @param {string} targetType Target SQL type
     * @returns {*} Properly formatted SQL value
     * @throws {sbError} If a type mismatch is encountered
     */
    convertToSQL(value, targetType) {
        let sourceType = typeof value;
        if (value === null) {
            return "NULL";
        }
        else if (targetType === "TINY") {
            if (sourceType !== "boolean") {
                throw new error_1.default({
                    message: "Expected value type: boolean",
                    args: value
                });
            }
            return (value === true) ? "1" : "0";
        }
        else if (targetType === "SET" && Array.isArray(value)) {
            const string = this.escapeString(value.join(","));
            return `'${string}'`;
        }
        else if (targetType === "TIME" || targetType === "DATE" || targetType === "DATETIME" || targetType === "TIMESTAMP") {
            if (value instanceof Date) {
                value = new date_1.default(value);
            }
            if (!(value instanceof date_1.default)) {
                throw new error_1.default({
                    message: "Expected value type: date",
                    args: value
                });
            }
            switch (targetType) {
                case "TIME": return "'" + value.sqlTime() + "'";
                case "DATE": return "'" + value.sqlDate() + "'";
                case "DATETIME": return "'" + value.sqlDateTime() + "'";
                case "TIMESTAMP": return "'" + value.sqlDateTime() + "'";
            }
        }
        else if (sourceType === "string") {
            return "'" + this.escapeString(value) + "'";
        }
        else {
            return value;
        }
    }
    escapeIdentifier(string) {
        // @todo figure this out
        // // console.log("escape identifier", "`" + string.replace(/^`|`$/g, "").replace(/`/g, "``") + "`");
        // const result = (/\*$/.test(string))
        // 	? string
        // 	: "`" + string.replace(/^`|`$/g, "").replace(/`/g, "``") + "`";
        //
        if (typeof string === "string" && string.includes("chatrooms")) {
            string = "`" + string + "`";
        }
        // console.warn(string);
        return string;
        // return string;
        // return "`" + string.replace(/^`|`$/g, "").replace(/`/g, "``") + "`";
        // return "`" + string.replace(/^`|`$/g, "").replace(/`/g, "\\`") + "`";
    }
    /**
     * Escapes a string to be SQL-compliant
     * @param string
     * @returns {string}
     */
    escapeString(string) {
        return string.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "\\\"");
    }
    /**
     * Escapes a LIKE string to be SQL-compliant - makes sure to keep % characters in correct places
     * @param string
     * @returns {string}
     */
    escapeLikeString(string) {
        return this.escapeString(string).replace(/%/g, "\\%").replace(/_/g, "\\_");
    }
    /**
     * Replaces format symbols used in WHERE/HAVING with their provided values and escapes/parses them.
     * @private
     * @param {string} type
     * @param {*} param
     * @returns {string}
     * @throws {sbError} If an unrecognized format symbol was encountered.
     */
    parseFormatSymbol(type, param) {
        switch (type) {
            case "b":
                if (typeof param !== "boolean") {
                    throw new error_1.default({ message: "Expected boolean, got " + param });
                }
                return (param ? "1" : "0");
            case "d":
                if (param instanceof Date && !(param instanceof date_1.default)) {
                    param = new date_1.default(param);
                }
                if (!(param instanceof date_1.default)) {
                    throw new error_1.default({ message: "Expected sbDate, got " + param });
                }
                return "'" + param.sqlDate() + "'";
            case "dt":
                if (param instanceof Date && !(param instanceof date_1.default)) {
                    param = new date_1.default(param);
                }
                if (!(param instanceof date_1.default)) {
                    throw new error_1.default({ message: "Expected sbDate, got " + param });
                }
                return "'" + param.sqlDateTime() + "'";
            case "n":
                if (typeof param !== "number") {
                    throw new error_1.default({ message: "Expected number, got " + param });
                }
                else if (Number.isNaN(param)) {
                    throw new error_1.default({ message: `Cannot use ${param} as a number in SQL` });
                }
                return String(param);
            case "s":
                if (typeof param !== "string") {
                    throw new error_1.default({ message: "Expected string, got " + param });
                }
                return "'" + this.escapeString(param) + "'";
            case "t":
                if (param instanceof Date && !(param instanceof date_1.default)) {
                    param = new date_1.default(param);
                }
                if (!(param instanceof date_1.default)) {
                    throw new error_1.default({ message: "Expected sbDate, got " + param });
                }
                return param.sqlTime();
            case "s+":
                if (!Array.isArray(param)) {
                    throw new error_1.default({ message: "Expected Array, got " + param });
                }
                else if (param.some(i => typeof i !== "string")) {
                    throw new error_1.default({ message: "Array must contain strings only" });
                }
                return "(" + param.map(i => this.escapeString(i)).map(i => `'${i}'`).join(",") + ")";
            case "n+":
                if (!Array.isArray(param)) {
                    throw new error_1.default({ message: "Expected Array, got " + param });
                }
                else if (param.some(i => typeof i !== "number" || Number.isNaN(i))) {
                    throw new error_1.default({ message: "Array must contain proper numbers only" });
                }
                return "(" + param.join(",") + ")";
            case "like":
            case "*like":
            case "like*":
            case "*like*": {
                if (typeof param !== "string") {
                    throw new error_1.default({ message: "Expected string, got " + param });
                }
                const start = (type.startsWith("*")) ? "%" : "";
                const end = (type.endsWith("*")) ? "%" : "";
                const string = this.escapeLikeString(param);
                return ` LIKE '${start}${string}${end}'`;
            }
            default: throw new error_1.default({
                message: "Unknown Recordset replace parameter",
                args: type
            });
        }
    }
    setLogThreshold(value) {
        if (typeof value !== "number") {
            throw new error_1.default({
                message: "Logging threshold must be a number",
                args: { value }
            });
        }
        __classPrivateFieldSet(this, _loggingThreshold, value);
    }
    disableLogThreshold() {
        __classPrivateFieldSet(this, _loggingThreshold, null);
    }
    static get sqlKeywords() {
        return ["SUM", "COUNT", "AVG"];
    }
    static get flagMask() {
        return {
            "NOT_NULL": 1,
            "PRIMARY_KEY": 2,
            "UNIQUE_KEY": 4,
            "MULTIPLE_KEY": 8,
            "BLOB": 16,
            "UNSIGNED": 32,
            "ZEROFILL_FLAG": 64,
            "BINARY_COLLATION": 128,
            "ENUM": 256,
            "AUTO_INCREMENT": 512,
            "TIMESTAMP": 1024,
            "SET": 2048,
            "NO_DEFAULT_VALUE_FLAG": 4096,
            "ON_UPDATE_NOW_FLAG": 8192,
            "NUM_FLAG": 32768
        };
    }
    /**
     * Regex used to parse out format symbols.
     * @returns {RegExp}
     */
    get formatSymbolRegex() {
        return formatSymbolRegex;
    }
    get modulePath() { return "query"; }
    /**
     * Cleans up.
     */
    destroy() {
        this.invalidateAllDefinitions();
        this.pool = null;
    }
}
exports.default = Query;
_loggingThreshold = new WeakMap(), _definitionPromises = new WeakMap();
;
