import Recordset from "./recordset";
import Maria from "mariadb";
import Row from "./row";
import Batch from "./batch";
declare class Query {
    "__#5@#loggingThreshold": any;
    "__#5@#definitionPromises": Map<any, any>;
    activeConnections: Set<any>;
    /** @type {TableDefinition[]} */
    tableDefinitions: TableDefinition[];
    pool: Maria.Pool;
    /**
     * Executes a raw SQL query.
     * @param {...string} args
     * @returns {Promise<*>}
     */
    raw(...args: string[]): Promise<any>;
    /**
     * @alias Query.raw
     */
    send(...args: any[]): Promise<any>;
    /**
     * Prepares a transaction for next use.
     * Transaction must be commited/rollbacked manually afterwards.
     * @returns {Promise<*>}
     */
    getTransaction(): Promise<any>;
    /**
     * Creates a new Recordset instance.
     * @param {(rs: Recordset) => Recordset} callback
     * @returns {Promise<Array>}
     */
    getRecordset(callback: (rs: Recordset) => Recordset): Promise<any[]>;
    /**
     * Creates a new RecordDeleter instance.
     * @param callback
     * @returns {Promise<*>}
     */
    getRecordDeleter(callback: any): Promise<any>;
    /**
     * Creates a new RecordUpdater instance.
     * @param {(rs: Recordset) => Recordset} callback
     * @returns {Promise<Array>}
     */
    getRecordUpdater(callback: (rs: Recordset) => Recordset): Promise<Object[]|Object>;
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
     * @params {Function} options.callback Callback that gets passed into the RecordUpdater instances
     * @returns {Promise<void>}
     */
    batchUpdate(data: Object[], options?: {[x:string]: any, callback?: Function}): Promise<void>;
    /**
     * Creates a condition string, based on the same syntax Recordset uses
     * @param {Function} callback
     * @returns {string}
     */
    getCondition(callback: (rs: Recordset) => Recordset): string;
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
     * SQL DATE/DATETIME/TIMESTAMP -> JS stolen_sb.Date
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
     * JS Date/stolen_sb.Date -> SQL TIME/DATE/DATETIME/TIMESTAMP
     * JS string -> escaped SQL VARCHAR/*TEXT
     * JS number -> SQL *INT
     * @param {*} value Javascript value to convert
     * @param {string} targetType Target SQL type
     * @returns {*} Properly formatted SQL value
     * @throws {stolen_sb.Error} If a type mismatch is encountered
     */
    convertToSQL(value: any, targetType: string): any;
    escapeIdentifier(string: any): any;
    /**
     * Escapes a string to be SQL-compliant
     * @param string
     * @returns {string}
     */
    escapeString(string: any): string;
    /**
     * Escapes a LIKE string to be SQL-compliant - makes sure to keep % characters in correct places
     * @param string
     * @returns {string}
     */
    escapeLikeString(string: any): string;
    /**
     * Replaces format symbols used in WHERE/HAVING with their provided values and escapes/parses them.
     * @private
     * @param {string} type
     * @param {*} param
     * @returns {string}
     * @throws {stolen_sb.Error} If an unrecognized format symbol was encountered.
     */
    parseFormatSymbol(type: string, param: any): string;
    setLogThreshold(value: any): void;
    disableLogThreshold(): void;
    /**
     * Regex used to parse out format symbols.
     * @returns {RegExp}
     */
    readonly formatSymbolRegex: RegExp;
    readonly modulePath: string;
    /**
     * Cleans up.
     */
    destroy(): void;
    /**
     * @inheritDoc
     * @returns {Query}
     */
    singleton(): Query;
    readonly sqlKeywords: [ "SUM", "COUNT", "AVG" ];
    readonly flagMask: {
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
};
export = Query;
export type TableDefinition = {
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
} | null;
export type ColumnDefinition = {
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
export type WhereHavingParams = {
    /**
     * If false, WHERE/HAVING will not be executed
     */
    condition?: boolean | undefined;
    /**
     * If present, WHERE/HAVING will not be parsed, and instead will directly use this string
     */
    raw?: string | undefined;
};
export type FormatSymbol = "%b" | "%d" | "%dt" | "%p" | "%n" | "%s" | "%t" | "%like" | "%*like" | "%like*" | "%*like*";

export type CollumnType = Maria.Types;
