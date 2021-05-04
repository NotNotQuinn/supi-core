"use strict";
import Maria from 'mariadb';
import Batch from './batch.js';
import Recordset from './recordset.js';
import RecordDeleter from './record-deleter.js';
import RecordUpdater from './record-updater.js';
import Row from './row.js';
import Template from '../template.js';

// Originaly in global object 'sb' however that does not translate to typescript.
// especially because the global object is used in its own definition.
import sbError from '../../objects/error'; // sb.Error
import sbDate from '../../objects/date'; // sb.Date
// sb.Utils.isValidInteger
const isValidInteger = (input: any, minLimit = 0) => {
	if (typeof input !== "number") {
		return false;
	}

	return Boolean(Number.isFinite(input) && Math.trunc(input) === input && input >= minLimit);
}

const updateBatchLimit = 1000;
const formatSymbolRegex = /%(s\+|n\+|b|dt|d|n|p|s|t|\*?like\*?)/g;

type WeirdTableDefinitionStructure = {
	[database: string]: {
		[table: string]: TableDefinition | null
	}
}

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
	static module: Query;
	pool: null | Maria.Pool;
	tableDefinitions: WeirdTableDefinitionStructure = {};
	#loggingThreshold: number|null = null;
	#definitionPromises: Map<string, Promise<any>> = new Map();
	activeConnections = new Set();

	/**
	 * @inheritDoc
	 * @returns {Query}
	 */
	static async singleton (): Promise<Query> {
		if (!Query.module) {
			Query.module = new Query();
		}
		return Query.module;
	}

	constructor () {
		super();

		if (!process.env.MARIA_USER || !process.env.MARIA_PASSWORD || (!process.env.MARIA_HOST && !process.env.MARIA_SOCKET_PATH)) {
			throw new sbError({ message: "Database access must be initialized first" });
		}

		/** @type {TableDefinition[]} */
		this.tableDefinitions = {};

		if (process.env.MARIA_SOCKET_PATH) {
			this.pool! = Maria.createPool({
				user: process.env.MARIA_USER,
				password: process.env.MARIA_PASSWORD,
				socketPath: process.env.MARIA_SOCKET_PATH,
				connectionLimit: Number(process.env.MARIA_CONNECTION_LIMIT) ?? 25
			});
		}
		else if (process.env.MARIA_HOST) {
			this.pool! = Maria.createPool({
				user: process.env.MARIA_USER,
				host: process.env.MARIA_HOST,
				port: Number(process.env.MARIA_PORT) || 3306,
				password: process.env.MARIA_PASSWORD,
				connectionLimit: Number(process.env.MARIA_CONNECTION_LIMIT) ?? 25
			});
		}
		else {
			throw new sbError({
				message: "Not enough info provided in process.env for Query to initialize"
			})
		}
	}

	/**
	 * Executes a raw SQL query.
	 * @param {...string} args
	 * @returns {Promise<*>}
	 */
	async raw (...args: string[]): Promise<any[] & { meta?: any } & any> {
		const query = args.join("\n");
		const timing: {[x:string]: bigint} = {
			start: process.hrtime.bigint()
		};

		const connector = await this.pool!.getConnection();
		timing.connection = process.hrtime.bigint();
		this.activeConnections.add(connector.threadId);

		const result: Promise<any[]> = connector.query({
			sql: query,
			multipleStatements: true
		} as Maria.QueryOptions);
		timing.result = process.hrtime.bigint();

		await connector.end();
		this.activeConnections.delete(connector.threadId);
		timing.end = process.hrtime.bigint();

		if (this.#loggingThreshold !== null && (timing.end - timing.start) > (this.#loggingThreshold! * 1e6)) {
			console.warn("Query time threshold exceeded", {
				timing: {
					full: Number(timing.end - timing.start) / 1e6,
					getConnection: Number(timing.connection - timing.start) / 1e6,
					query: Number(timing.result - timing.connection) / 1e6,
					cleanup: Number(timing.end - timing.result) / 1e6
				},
				hrtime: timing,
				query,
				timestamp: new sbDate().sqlDateTime(),
				stack: new Error().stack
			});
		}

		return result;
	}

	/**
	 * @alias Query.raw
	 */
	async send (...args: string[]) {
		return this.raw(...args);
	}

	/**
	 * Prepares a transaction for next use.
	 * Transaction must be commited/rollbacked manually afterwards.
	 * @returns {Promise<*>}
	 */
	async getTransaction (): Promise<any> {
		const connector = await this.pool!.getConnection();
		connector.beginTransaction();
		return connector;
	}

	/**
	 * Creates a new Recordset instance.
	 * @param {RecordsetCallback} callback
	 * @returns {Promise<Array>}
	 */
	async getRecordset (callback: RecordsetCallback): Promise<Array<any>> {
		const rs = new Recordset(this);
		callback(rs);
		return await rs.fetch();
	}

	/**
	 * Creates a new RecordDeleter instance.
	 * @param callback
	 * @returns {Promise<*>}
	 */
	async getRecordDeleter (callback: (rd: RecordDeleter) => RecordDeleter): Promise<any> {
		const rd = new RecordDeleter(this);
		callback(rd);
		return await rd.fetch();
	}

	/**
	 * Creates a new RecordUpdater instance.
	 * @param {RecordsetCallback} callback
	 * @returns {Promise<Array>}
	 */
	async getRecordUpdater (callback: (rd: RecordUpdater) => RecordUpdater): Promise<Array<any>> {
		const ru = new RecordUpdater(this);
		callback(ru);
		return await ru.fetch();
	}

	/**
	 * Creates a new Row instance.
	 * @param {string} database Database of the table
	 * @param {string} table Name of the table
	 * @returns {Promise<Row>}
	 */
	async getRow (database: string, table: string): Promise<Row> {
		let row = new Row(this, database, table);
		await row.readyPromise;
		return row;
	}

	/**
	 * Returns a new Batch instance.
	 * @param {string} database Database of the table
	 * @param {string} table Name of the table
	 * @param {string[]} columns Column names to insert into given table
	 * @returns {Promise<Batch>}
	 */
	async getBatch (database: string, table: string, columns: string[]): Promise<Batch> {
		let batch = new Batch(this, database, table, columns);
		await batch.readyPromise;
		return batch;
	}

	isRecordset (input: any) { return (input instanceof Recordset); }
	isRecordDeleter (input: any) { return (input instanceof RecordDeleter); }
	isRecordUpdater (input: any) { return (input instanceof RecordUpdater); }
	isRow (input: any) { return (input instanceof Row); }
	isBatch (input: any) { return (input instanceof Batch); }

	/**
	 * Fetches the definition of a specific table.
	 * @param {string} database
	 * @param {string} table
	 * @returns {Promise<TableDefinition>}
	 */
	async getDefinition (database: string, table: string): Promise<TableDefinition> {
		const key = database + "." + table;
		if (this.tableDefinitions[database] && this.tableDefinitions[database][table]) {
			return this.tableDefinitions[database][table]!;
		}
		else if (this.#definitionPromises.has(key)) {
			return this.#definitionPromises.get(key);
		}

		const promise = (async () => {
			const path = this.escapeIdentifier(database) + "." + this.escapeIdentifier(table);
			const escapedPath = "`" + this.escapeIdentifier(database) + "`.`" + this.escapeIdentifier(table) + "`";
			this.tableDefinitions[database] = this.tableDefinitions[database] || {};
			let obj: TableDefinition = {
				name: table, database: database, path: path, escapedPath: escapedPath, columns: []
			};

			const data = await this.raw("SELECT * FROM " + escapedPath + " WHERE 1 = 0");
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
			this.#definitionPromises.delete(key);

			return this.tableDefinitions[database][table]!;
		})();

		this.#definitionPromises.set(key, promise);
		return promise;
	}

	/**
	 * Returns a boolean determining if a given database (schema) - table combination exists.
	 * @param {string} database
	 * @param {string} table
	 * @returns {Promise<boolean>}
	 */
	async isTablePresent (database: string, table: string): Promise<boolean> {
		const exists = await this.getRecordset(rs => rs
			.select("1")
			.from("INFORMATION_SCHEMA", "TABLES")
			.where("TABLE_SCHEMA = %s", database)
			.where("TABLE_NAME = %s", table)
		);

		return (exists.length !== 0);
	}

	/**
	 * Performs a configurable batched update.
	 * Supports staggering, grouping statements into transactions, and more.
	 * @param {Object[]} data List of rows to update
	 * @param {Object} options Configurable options object
	 * @param {Function} options.callback Callback that gets passed into the RecordUpdater instances
	 * @returns {Promise<void>}
	 */
	async batchUpdate (data: object[], options: {
		 callback: (ru: RecordUpdater, row: any)=>void;
		 staggerDelay?: number;
		 batchSize: number;
		}): Promise<void> {
		const { batchSize, callback, staggerDelay } = options;
		if (typeof callback !== "function") {
			throw new sbError({
				message: `Callback must be a function, received ${typeof callback}`
			});
		}

		const limit = (isValidInteger(batchSize))
			? batchSize
			: updateBatchLimit;

		const queries = await Promise.all(data.map(async row => {
			const ru = new RecordUpdater(this);
			callback(ru, row);

			const sql = await ru.toSQL();
			return sql.join(" ") + ";";
		}));

		if (isValidInteger(staggerDelay)) {
			let counter = 0;
			for (let i = 0; i <= queries.length; i += limit) {
				let slice: string|null = queries.slice(i, i + limit).join("\n");

				setTimeout(async () => {
					const transaction = await this.getTransaction();
					try {
						await transaction.query(slice);
						await transaction.commit();
					}
					catch {
						await transaction.rollback();
					}
					finally {
						await transaction.end();
						slice = null;
					}
				}, (counter * staggerDelay!));

				counter++;
			}
		}
		else {
			for (let i = 0; i <= queries.length; i += limit) {
				const transaction = await this.getTransaction();
				const slice = queries.slice(i, i + limit);

				try {
					await transaction.query(slice.join("\n"));
					await transaction.commit();
				}
				catch {
					await transaction.rollback();
				}
			}
		}
	}

	/**
	 * Creates a condition string, based on the same syntax Recordset uses
	 * @param {Function} callback
	 * @returns {string}
	 */
	getCondition (callback: Function): string {
		const rs = new Recordset(this);
		callback(rs);
		return rs.toCondition();
	}

	/**
	 * Invalidates a specific table definition.
	 * The next time it is accessed, it will be refreshed.
	 * @param {string} database Database of table
	 * @param {string} table Name of table
	 */
	invalidateDefinition (database: string, table: string) {
		if (this.tableDefinitions[database] && this.tableDefinitions[database][table]) {
			this.tableDefinitions[database][table] = null;
		}
	}

	/**
	 * Invalidates all table definitions.
	 * The next time they're accessed, they will be refreshed.
	 */
	invalidateAllDefinitions () {
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
	convertToJS (value: any, type: string): any {
		if (value === null) {
			return value;
		}

		switch (type) {
			case "TINY": return (value === 1);

			// case "TIME":
			case "DATE":
			case "DATETIME":
			case "TIMESTAMP": return new sbDate(value);

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
	convertToSQL (value: any, targetType: string): any {
		let sourceType = typeof value;

		if (value === null) {
			return "NULL";
		}
		else if (targetType === "TINY") {
			if (sourceType !== "boolean") {
				throw new sbError({
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
		else if (targetType === "TIME" || targetType === "DATE" || targetType === "DATETIME" || targetType === "TIMESTAMP")  {
			if (value instanceof Date) {
				value = new sbDate(value);
			}

			if (!(value instanceof sbDate)) {
				throw new sbError({
					message: "Expected value type: date",
					args: value
				});
			}

			switch (targetType) {
				case "TIME": return "'" + value.sqlTime() + "'";
				case "DATE": return "'" +  value.sqlDate() + "'";
				case "DATETIME": return "'" +  value.sqlDateTime() + "'";
				case "TIMESTAMP": return "'" +  value.sqlDateTime() + "'";
			}
		}
		else if (sourceType === "string") {
			return "'" + this.escapeString(value) + "'";
		}
		else {
			return value;
		}
	}

	escapeIdentifier (string: string) {
		// @todo figure this out

		// // console.log("escape identifier", "`" + string.replace(/^`|`$/g, "").replace(/`/g, "``") + "`");
		// const result = (/\*$/.test(string))
		// 	? string
		// 	: "`" + string.replace(/^`|`$/g, "").replace(/`/g, "``") + "`";
		//

		if (typeof string === "string" && string.includes("chatrooms")) {
			string = "`" + string + "`"
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
	escapeString (string: string): string {
		return string.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "\\\"");
	}

	/**
	 * Escapes a LIKE string to be SQL-compliant - makes sure to keep % characters in correct places
	 * @param string
	 * @returns {string}
	 */
	escapeLikeString (string: string): string {
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
	parseFormatSymbol (type: string, param: any): string {
		switch (type) {
			case "b":
				if (typeof param !== "boolean") {
					throw new sbError({ message: "Expected boolean, got " + param });	
				} 
				
				return (param ? "1" : "0");

			case "d":
				if (param instanceof Date && !(param instanceof sbDate)) {
					param = new sbDate(param);
				}					
				if (!(param instanceof sbDate)) {
					throw new sbError({ message: "Expected sbDate, got " + param });
				}
				
				return "'" + param.sqlDate() + "'";

			case "dt":
				if (param instanceof Date && !(param instanceof sbDate)) {
					param = new sbDate(param);
				}					
				if (!(param instanceof sbDate)) {
					throw new sbError({ message: "Expected sbDate, got " + param });
				}

				return "'" + param.sqlDateTime() + "'";

			case "n":
				if (typeof param !== "number") {
					throw new sbError({ message: "Expected number, got " + param });
				}
				else if (Number.isNaN(param)) {
					throw new sbError({ message: `Cannot use ${param} as a number in SQL` });
				}
				
				return String(param);

			case "s":
				if (typeof param !== "string") {
					throw new sbError({ message: "Expected string, got " + param });
				}
				
				return "'" + this.escapeString(param) + "'";

			case "t":
				if (param instanceof Date && !(param instanceof sbDate)) {
					param = new sbDate(param);
				}
				if (!(param instanceof sbDate)) {
					throw new sbError({ message: "Expected sbDate, got " + param });
				}
				
				return param.sqlTime();

			case "s+":
				if (!Array.isArray(param)) {
					throw new sbError({ message: "Expected Array, got " + param });
				}
				else if (param.some(i => typeof i !== "string")) {
					throw new sbError({ message: "Array must contain strings only" });
				}
				
				return "(" + param.map(i => this.escapeString(i)).map(i => `'${i}'`).join(",") + ")";

			case "n+":
				if (!Array.isArray(param)) {
					throw new sbError({ message: "Expected Array, got " + param });
				}
				else if (param.some(i => typeof i !== "number" || Number.isNaN(i))) {
					throw new sbError({ message: "Array must contain proper numbers only" });
				}
				
				return "(" + param.join(",") + ")";

			case "like":
			case "*like":
			case "like*":
			case "*like*": {
				if (typeof param !== "string") {
					throw new sbError({ message: "Expected string, got " + param });
				}

				const start = (type.startsWith("*")) ? "%" : "";
				const end = (type.endsWith("*")) ? "%" : "";
				const string = this.escapeLikeString(param);

				return ` LIKE '${start}${string}${end}'`;
			}

			default: throw new sbError({
				message: "Unknown Recordset replace parameter",
				args: type
			});
		}
	}

	setLogThreshold (value: number) {
		if (typeof value !== "number") {
			throw new sbError({
				message: "Logging threshold must be a number",
				args: { value }
			});
		}

		this.#loggingThreshold = value;
	}

	disableLogThreshold () {
		this.#loggingThreshold = null;
	}

	static get sqlKeywords () {
		return [ "SUM", "COUNT", "AVG" ];
	}

	static get flagMask () {
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
	get formatSymbolRegex (): RegExp {
		return formatSymbolRegex;
	}

	get modulePath () { return "query"; }

	/**
	 * Cleans up.
	 */
	destroy () {
		this.invalidateAllDefinitions();
		this.pool = null;
	}

};

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
};
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

export type RecordsetCallback = (rs: Recordset) => Recordset;
