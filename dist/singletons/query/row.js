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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _definition, _primaryKey, _primaryKeyField, _values, _originalValues, _valueProxy, _loaded;
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = __importDefault(require("../../objects/error"));
/**
 * Represents one row of a SQL database table.
 */
class Row {
    /**
     * Creates a new Row instance
     * @param {Query} query
     * @param {string} database
     * @param {string} table
     */
    constructor(query, database, table) {
        /**
         * This promise resolves when the Row finishes constructing.
         * @type {Promise<any>}
         */
        this.readyPromise = new Promise(() => { });
        _definition.set(this, null);
        _primaryKey.set(this, null);
        /** @type {typeof Row.#definition.columns} */
        _primaryKeyField.set(this, null);
        _values.set(this, {});
        _originalValues.set(this, {});
        _valueProxy.set(this, new Proxy(__classPrivateFieldGet(this, _values), {
            /** @param {string} name */
            get: (target, name) => {
                if (typeof target[name] === "undefined") {
                    throw new error_1.default({
                        message: "Getting value: Column " + name + " does not exist"
                    });
                }
                return target[name];
            },
            /** @param {string} name */
            set: (target, name, value) => {
                if (typeof target[name] === "undefined") {
                    throw new error_1.default({
                        message: "Setting value: Column " + name + " does not exist"
                    });
                }
                target[name] = value;
                return true;
            }
        }));
        _loaded.set(this, false);
        if (!database || !table) {
            throw new error_1.default({
                message: "Row: database and table must be provided",
                args: {
                    db: database,
                    table: table
                }
            });
        }
        /** @type {Query} */
        this.query = query;
        this.readyPromise = (() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            __classPrivateFieldSet(this, _definition, yield query.getDefinition(database, table));
            for (const column of (_b = (_a = __classPrivateFieldGet(this, _definition)) === null || _a === void 0 ? void 0 : _a.columns) !== null && _b !== void 0 ? _b : []) {
                __classPrivateFieldGet(this, _values)[column.name] = Symbol.for("unset");
                __classPrivateFieldGet(this, _originalValues)[column.name] = Symbol.for("unset");
                if (column.primaryKey) {
                    __classPrivateFieldSet(this, _primaryKeyField, column);
                }
            }
        }))();
    }
    /**
     * Loads a row based on its primary key.
     * @param {number} primaryKey
     * @param {boolean} ignoreError
     * @returns {Promise<Row>}
     */
    load(primaryKey, ignoreError = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof primaryKey === "undefined") {
                throw new error_1.default({
                    message: "Primary key must be passed to Row.load"
                });
            }
            if (__classPrivateFieldGet(this, _primaryKey) && __classPrivateFieldGet(this, _primaryKey) !== primaryKey) {
                this.reset();
            }
            __classPrivateFieldSet(this, _primaryKey, primaryKey);
            const data = yield this.query.raw([
                "SELECT * FROM " + __classPrivateFieldGet(this, _definition).escapedPath,
                "WHERE " + this.query.escapeIdentifier(this.fieldPK.name) + " = " + this.escapedPK
            ].join(" "));
            if (!data[0]) {
                if (ignoreError) {
                    __classPrivateFieldGet(this, _values)[this.fieldPK.name] = primaryKey;
                    return this;
                }
                else {
                    throw new error_1.default({
                        message: "Row load failed - no such PK",
                        args: {
                            primaryKeyField: this.fieldPK,
                            primaryKey: this.PK,
                            table: this.path
                        }
                    });
                }
            }
            for (const column of __classPrivateFieldGet(this, _definition).columns) {
                const value = this.query.convertToJS(data[0][column.name], column.type);
                __classPrivateFieldGet(this, _values)[column.name] = value;
                __classPrivateFieldGet(this, _originalValues)[column.name] = value;
            }
            __classPrivateFieldSet(this, _loaded, true);
            return this;
        });
    }
    /**
     * Saves the row.
     * If a primary key is present, saves the row as new (INSERT).
     * If not, saves an existing row (UPDATE).
     * @param {Object} options
     * @param {boolean} [options.ignore] If true, INSERT will be executed as INSERT IGNORE (ignores duplicate keys)
     * @returns {Promise<Object>}
     */
    save(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let outputData = null;
            if (this.PK !== null && __classPrivateFieldGet(this, _loaded)) { // UPDATE
                let setColumns = [];
                for (const column of __classPrivateFieldGet(this, _definition).columns) {
                    if (__classPrivateFieldGet(this, _originalValues)[column.name] === __classPrivateFieldGet(this, _values)[column.name])
                        continue;
                    setColumns.push(this.query.escapeIdentifier(column.name) +
                        " = " +
                        this.query.convertToSQL(__classPrivateFieldGet(this, _values)[column.name], column.type));
                }
                if (setColumns.length === 0) { // no update necessary
                    return false;
                }
                outputData = yield this.query.raw([
                    "UPDATE " + __classPrivateFieldGet(this, _definition).escapedPath,
                    "SET " + setColumns.join(", "),
                    "WHERE " + this.query.escapeIdentifier(this.fieldPK.name) + " = " + this.escapedPK
                ].join(" "));
            }
            else { // INSERT
                let columns = [];
                let values = [];
                for (const column of __classPrivateFieldGet(this, _definition).columns) {
                    if (__classPrivateFieldGet(this, _values)[column.name] === Symbol.for("unset"))
                        continue;
                    columns.push(this.query.escapeIdentifier(column.name));
                    values.push(this.query.convertToSQL(__classPrivateFieldGet(this, _values)[column.name], column.type));
                }
                const ignore = (options.ignore === true ? "IGNORE " : "");
                outputData = yield this.query.send([
                    "INSERT " + ignore + "INTO " + __classPrivateFieldGet(this, _definition).escapedPath,
                    "(" + columns.join(",") + ")",
                    "VALUES (" + values.join(",") + ")"
                ].join(" "));
                if (outputData.insertId !== 0) {
                    __classPrivateFieldSet(this, _primaryKey, outputData.insertId);
                    yield this.load(__classPrivateFieldGet(this, _primaryKey));
                }
                else if (columns.indexOf(this.fieldPK.name) !== -1) {
                    __classPrivateFieldSet(this, _primaryKey, __classPrivateFieldGet(this, _values)[this.fieldPK.name]);
                    yield this.load(__classPrivateFieldGet(this, _primaryKey));
                }
                else {
                    __classPrivateFieldSet(this, _primaryKey, null);
                }
            }
            return outputData;
        });
    }
    /**
     * Performs a DELETE operation on the currently loaded row.
     * @returns {Promise<void>}
     */
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.PK !== null) {
                yield this.query.send([
                    "DELETE FROM " + __classPrivateFieldGet(this, _definition).escapedPath,
                    "WHERE " + this.query.escapeIdentifier(this.fieldPK.name) + " = " + this.escapedPK
                ].join(" "));
                __classPrivateFieldSet(this, _loaded, false);
            }
            else {
                throw new error_1.default({
                    message: "In order to delete the row, it must be loaded.",
                    args: __classPrivateFieldGet(this, _definition)
                });
            }
        });
    }
    /**
     * @private
     * Resets the data of the currently loaded row.
     */
    reset() {
        __classPrivateFieldSet(this, _loaded, false);
        __classPrivateFieldSet(this, _primaryKey, null);
        for (const column of __classPrivateFieldGet(this, _definition).columns) {
            __classPrivateFieldGet(this, _values)[column.name] = Symbol.for("unset");
            __classPrivateFieldGet(this, _originalValues)[column.name] = Symbol.for("unset");
        }
    }
    /**
     * Syntax sugar to set multiple values at once.
     * @param {Object} data
     * @returns {Row}
     */
    setValues(data) {
        for (const [key, value] of Object.entries(data)) {
            this.values[key] = value;
        }
        return this;
    }
    /**
     * Determines if a property exists on the row instance.
     * @param {string} property
     * @returns {boolean}
     */
    hasProperty(property) {
        return (typeof __classPrivateFieldGet(this, _values)[property] !== "undefined");
    }
    /** @type {Object} */
    get valuesObject() { return Object.assign({}, __classPrivateFieldGet(this, _values)); }
    get originalValues() { return __classPrivateFieldGet(this, _originalValues); }
    get PK() { return __classPrivateFieldGet(this, _primaryKey); }
    get fieldPK() { return __classPrivateFieldGet(this, _primaryKeyField); }
    get escapedPK() {
        if (this.PK === null) {
            throw new error_1.default({
                message: "Row has no PK"
            });
        }
        return this.query.convertToSQL(this.PK, this.fieldPK.type);
    }
    get values() { return __classPrivateFieldGet(this, _valueProxy); }
    get definition() { return __classPrivateFieldGet(this, _definition) || null; }
    get path() {
        if (__classPrivateFieldGet(this, _definition)) {
            return __classPrivateFieldGet(this, _definition).path;
        }
        else {
            throw new error_1.default({
                message: "This row has no definition, yet"
            });
        }
    }
    get loaded() { return __classPrivateFieldGet(this, _loaded); }
}
_definition = new WeakMap(), _primaryKey = new WeakMap(), _primaryKeyField = new WeakMap(), _values = new WeakMap(), _originalValues = new WeakMap(), _valueProxy = new WeakMap(), _loaded = new WeakMap();
;
exports.default = Row;
