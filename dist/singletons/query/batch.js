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
const error_1 = __importDefault(require("../../objects/error"));
/**
 * Represents the SQL INSERT statement for multiple rows.
 * One instance is always locked to one table and some of its columns based on constructor.
 */
class Batch {
    /**
     * Creates a new Batch instance. Constructor must be await-ed.
     * @param {Query} query
     * @param {string} db
     * @param {string} table
     * @param {string[]} columns
     * @throws sbError If a nonexistent column has been provided
     */
    constructor(query, db, table, columns) {
        /**
         * This promise resolves when the Batch finishes constructing.
         */
        this.readyPromise = (() => __awaiter(this, void 0, void 0, function* () { }))();
        this.query = null;
        this.records = [];
        this.columns = [];
        this.ready = false;
        this.query = query;
        this.database = db;
        this.table = table;
        this.records = [];
        this.columns = [];
        this.ready = false;
        this.readyPromise = (() => __awaiter(this, void 0, void 0, function* () {
            const definition = yield this.query.getDefinition(db, table);
            for (const column of columns) {
                if (definition.columns.every(col => column !== col.name)) {
                    throw new error_1.default({
                        message: "Unrecognized Batch column",
                        args: {
                            database: db,
                            table: table,
                            column: definition.columns.filter(i => column !== i.name).map(i => i.name).join(", ")
                        }
                    });
                }
            }
            this.columns = definition.columns.filter(column => columns.indexOf(column.name) !== -1);
            this.ready = true;
        }))();
    }
    /**
     * Adds a data record, based on the Batch's columns definition
     * @param {Object} data
     * @returns {number} The index of added data record
     */
    add(data) {
        return (this.records.push(data) - 1);
    }
    /**
     * Deletes a record based on its index
     * @param index
     */
    delete(index) {
        this.records.splice(index, 1);
    }
    /**
     * Attempts to find a record based on a callback function
     * @param {Function} callback
     * @returns {Object|null} record
     */
    find(callback) {
        var _a;
        return (_a = this.records.find(callback)) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Executes the INSERT statement for bound database, table and columns.
     * Automatically clears itself after the statement is executed.
     * @param {Object} options Additional options
     * @param {boolean} options.ignore If true, batch will use `INSERT IGNORE INTO`.
     * @param {Function} options.duplicate If set, will use the result of this callback to create ON DUPLICATE KEY clausule.
     * @returns {Promise<void>}
     */
    insert(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.records.length === 0) {
                return;
            }
            let stringColumns = [];
            let data = this.records.map(() => []);
            for (const column of this.columns) {
                const name = column.name;
                const type = column.type;
                stringColumns.push(this.query.escapeIdentifier(name));
                for (let i = 0; i < this.records.length; i++) {
                    data[i].push(this.query.convertToSQL(this.records[i][name], type));
                }
            }
            const { duplicate, ignore } = options;
            if (duplicate && ignore) {
                throw new error_1.default({
                    message: "Cannot set ignore and duplicate at the same time"
                });
            }
            data = data.filter(i => i.length !== 0);
            if (data.length !== 0) {
                try {
                    yield this.query.raw([
                        `INSERT ${ignore ? "IGNORE" : ""} INTO`,
                        "`" + this.database + "`.`" + this.table + "`",
                        "(" + stringColumns.join(", ") + ")",
                        "VALUES (" + data.map(row => row.join(", ")).join("), (") + ")",
                        (duplicate ? duplicate(data, stringColumns) : "")
                    ].join(" "));
                }
                catch (e) {
                    console.error("Batch SQL failed", e);
                }
            }
            this.clear();
        });
    }
    /**
     * Clears all records from the instance.
     */
    clear() {
        this.records = [];
    }
    /**
     * Destroys the instance, freeing up memory and making it unusable.
     */
    destroy() {
        this.clear();
        this.columns = null;
        this.records = null;
        this.query = null;
        this.table = null;
        this.database = null;
    }
}
;
exports.default = Batch;
