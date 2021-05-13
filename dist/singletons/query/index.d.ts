import Maria from 'mariadb';
import Batch from './batch.js';
import Recordset from './recordset.js';
import RecordDeleter from './record-deleter.js';
import RecordUpdater from './record-updater.js';
import Row from './row.js';
import Template from '../template.js';
declare type WeirdTableDefinitionStructure = {
    [database: string]: {
        [table: string]: TableDefinition | null;
    };
};
/**
 * Query represents every possible access to the database.
 * Exposes multiple ways to access:
 * {@link Row}: Single table row, select/insert/update/delete
 * {@link Recordset}: Result of a compound SELECT statement
 * {@link Batch}: A tool to INSERT multiple rows in one statement, for specified columns
 * {@link RecordUpdater}: UPDATEs specified columns with values, with specified condition(s)
 * @name Query
 */
export default class Query extends Template {
    #private;
    static module: Query;
    pool: null | Maria.Pool;
    tableDefinitions: WeirdTableDefinitionStructure;
    activeConnections: Set<unknown>;
    /**
     * @inheritDoc
     * @returns {Query}
     */
    static singleton(): Promise<Query>;
    constructor();
    /**
     * Executes a raw SQL query.
     * @param {...string} args
     * @returns {Promise<*>}
     */
    raw(...args: string[]): Promise<any[] & {
        meta?: any;
    } & any>;
    /**
     * @alias Query.raw
     */
    send(...args: string[]): Promise<any>;
    /**
     * Prepares a transaction for next use.
     * Transaction must be commited/rollbacked manually afterwards.
     * @returns {Promise<*>}
     */
    getTransaction(): Promise<any>;
    /**
     * Creates a new Recordset instance.
     * @param {RecordsetCallback} callback
     * @returns {Promise<Array>}
     */
    getRecordset(callback: RecordsetCallback): Promise<Array<any>>;
    /**
     * Creates a new RecordDeleter instance.
     * @param callback
     * @returns {Promise<*>}
     */
    getRecordDeleter(callback: (rd: RecordDeleter) => RecordDeleter): Promise<any>;
    /**
     * Creates a new RecordUpdater instance.
     * @param {RecordsetCallback} callback
     * @returns {Promise<Array>}
     */
    getRecordUpdater(callback: (rd: RecordUpdater) => RecordUpdater): Promise<Array<any>>;
    /**
     * Creates a new Row instance.
     * @param {string} database Database of the table
     * @param {string} table Name of the table
     * @returns {Promise<Row>}
     */
    getRow(database: string, table: string): Promise<Row>;
    /**
     * Returns a new Batch instance.
     * @param {string} database Database of the table
     * @param {string} table Name of the table
     * @param {string[]} columns Column names to insert into given table
     * @returns {Promise<Batch>}
     */
    getBatch(database: string, table: string, columns: string[]): Promise<Batch>;
    isRecordset(input: any): boolean;
    isRecordDeleter(input: any): boolean;
    isRecordUpdater(input: any): boolean;
    isRow(input: any): boolean;
    isBatch(input: any): boolean;
    /**
     * Fetches the definition of a specific table.
     * @param {string} database
     * @param {string} table
     * @returns {Promise<TableDefinition>}
     */
    getDefinition(database: string, table: string): Promise<TableDefinition>;
    /**
     * Returns a boolean determining if a given database (schema) - table combination exists.
     * @param {string} database
     * @param {string} table
     * @returns {Promise<boolean>}
     */
    isTablePresent(database: string, table: string): Promise<boolean>;
    /**
     * Performs a configurable batched update.
     * Supports staggering, grouping statements into transactions, and more.
     * @param {Object[]} data List of rows to update
     * @param {Object} options Configurable options object
     * @param {Function} options.callback Callback that gets passed into the RecordUpdater instances
     * @returns {Promise<void>}
     */
    batchUpdate(data: object[], options: {
        callback: (ru: RecordUpdater, row: any) => void;
        staggerDelay?: number;
        batchSize: number;
    }): Promise<void>;
    /**
     * Creates a condition string, based on the same syntax Recordset uses
     * @param {Function} callback
     * @returns {string}
     */
    getCondition(callback: Function): string;
    /**
     * Invalidates a specific table definition.
     * The next time it is accessed, it will be refreshed.
     * @param {string} database Database of table
     * @param {string} table Name of table
     */
    invalidateDefinition(database: string, table: string): void;
    /**
     * Invalidates all table definitions.
     * The next time they're accessed, they will be refreshed.
     */
    invalidateAllDefinitions(): void;
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
    convertToJS(value: any, type: string): any;
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
    convertToSQL(value: any, targetType: string): any;
    escapeIdentifier(string: string): string;
    /**
     * Escapes a string to be SQL-compliant
     * @param string
     * @returns {string}
     */
    escapeString(string: string): string;
    /**
     * Escapes a LIKE string to be SQL-compliant - makes sure to keep % characters in correct places
     * @param string
     * @returns {string}
     */
    escapeLikeString(string: string): string;
    /**
     * Replaces format symbols used in WHERE/HAVING with their provided values and escapes/parses them.
     * @private
     * @param {string} type
     * @param {*} param
     * @returns {string}
     * @throws {sbError} If an unrecognized format symbol was encountered.
     */
    parseFormatSymbol(type: string, param: any): string;
    setLogThreshold(value: number): void;
    disableLogThreshold(): void;
    static get sqlKeywords(): string[];
    static get flagMask(): {
        NOT_NULL: number;
        PRIMARY_KEY: number;
        UNIQUE_KEY: number;
        MULTIPLE_KEY: number;
        BLOB: number;
        UNSIGNED: number;
        ZEROFILL_FLAG: number;
        BINARY_COLLATION: number;
        ENUM: number;
        AUTO_INCREMENT: number;
        TIMESTAMP: number;
        SET: number;
        NO_DEFAULT_VALUE_FLAG: number;
        ON_UPDATE_NOW_FLAG: number;
        NUM_FLAG: number;
    };
    /**
     * Regex used to parse out format symbols.
     * @returns {RegExp}
     */
    get formatSymbolRegex(): RegExp;
    get modulePath(): string;
    /**
     * Cleans up.
     */
    destroy(): void;
}
export declare type TableDefinition = {
    /**
     * Database of table
     */
    database: string;
    /**
     * Name of table
     */
    name: string;
    /**
     * Escaped path to data.
     */
    escapedPath: string;
    /**
     * {@link TableDefinition#database} . {@link TableDefinition#name}
     */
    path: string;
    /**
     * Column definition
     */
    columns: ColumnDefinition[];
};
export declare type ColumnDefinition = {
    /**
     * Column name
     */
    name: string;
    /**
     * Column type
     */
    type: CollumnType;
    /**
     * If true, column can be set to null
     */
    notNull: boolean;
    /**
     * If true, column is the primary key or a part of it
     */
    primaryKey: boolean;
    /**
     * If true, a numeric column is unsigned
     */
    unsigned: boolean;
};
export declare type WhereHavingParams = {
    /**
     * If false, WHERE/HAVING will not be executed
     */
    condition?: boolean | undefined;
    /**
     * If present, WHERE/HAVING will not be parsed, and instead will directly use this string
     */
    raw?: string | undefined;
};
export declare type FormatSymbol = "%b" | "%d" | "%dt" | "%p" | "%n" | "%s" | "%t" | "%like" | "%*like" | "%like*" | "%*like*";
export declare type CollumnType = Maria.Types;
export declare type RecordsetCallback = (rs: Recordset) => Recordset;
export {};
