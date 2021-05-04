import { TableDefinition } from './index'
import Query from "./index"
/**
 * Represents one row of a SQL database table.
 */
class Row {
	query: Query;
	/** 
	 * This promise resolves when the Row has loaded.
	 * @type {Promise<any>} 
	 */
	readyPromise: Promise<void> = new Promise(() => {});
	#definition: TableDefinition | null = null;
	#primaryKey: null | number = null;
	/** @type {typeof Row.#definition.columns} */
	#primaryKeyField: any = null;
	#values: any = {};
	#originalValues: any = {};
	#valueProxy = new Proxy(this.#values, {
		/** @param {string} name */
		get: (target, name: string) => {
			if (typeof target[name] === "undefined") {
				// @ts-ignore
				throw new stolen_sb.Error({
					message: "Getting value: Column " + name + " does not exist"
				});
			}

			return target[name];
		},
		/** @param {string} name */
		set: (target, name: string, value) => {
			if (typeof target[name] === "undefined") {
				// @ts-ignore
				throw new stolen_sb.Error({
					message: "Setting value: Column " + name + " does not exist"
				});
			}

			target[name] = value;
			return true;
		}
	});
	#loaded = false;

	/**
	 * Creates a new Row instance
	 * @param {Query} query
	 * @param {string} database
	 * @param {string} table
	 */
	constructor (query: Query, database: string, table: string) {
		if (!database || !table) {
				// @ts-ignore
			throw new stolen_sb.Error({
				message: "Row: database and table must be provided",
				args: {
					db: database,
					table: table
				}
			});
		}

		/** @type {Query} */
		this.query = query;

		this.readyPromise = (async () => {
			this.#definition = await query.getDefinition(database, table);
			for (const column of this.#definition?.columns ?? []) {
				this.#values[column.name] = Symbol.for("unset");
				this.#originalValues[column.name] = Symbol.for("unset");

				if (column.primaryKey) {
					this.#primaryKeyField = column;
				}
			}
		})();
	}

	/**
	 * Loads a row based on its primary key.
	 * @param {number} primaryKey
	 * @param {boolean} ignoreError
	 * @returns {Promise<Row>}
	 */
	async load (primaryKey: number, ignoreError: boolean = false): Promise<Row> {
		if (typeof primaryKey === "undefined") {
				// @ts-ignore
			throw new stolen_sb.Error({
				message: "Primary key must be passed to Row.load"
			});
		}

		if (this.#primaryKey && this.#primaryKey !== primaryKey) {
			this.reset();
		}
		this.#primaryKey = primaryKey;

		const data = await this.query.raw([
			"SELECT * FROM " + this.#definition!.escapedPath,
			"WHERE " + this.query.escapeIdentifier(this.fieldPK.name) + " = " + this.escapedPK
		].join(" "));

		if (!data[0]) {
			if (ignoreError) {
				this.#values[this.fieldPK.name] = primaryKey;
				return this;
			}
			else {
				// @ts-ignore
				throw new stolen_sb.Error({
					message: "Row load failed - no such PK",
					args: {
						primaryKeyField: this.fieldPK,
						primaryKey: this.PK,
						table: this.path
					}
				});
			}
		}

		for (const column of this.#definition!.columns) {
			const value = this.query.convertToJS(data[0][column.name], column.type);
			this.#values[column.name] = value;
			this.#originalValues[column.name] = value;
		}

		this.#loaded = true;
		return this;
	}

	/**
	 * Saves the row.
	 * If a primary key is present, saves the row as new (INSERT).
	 * If not, saves an existing row (UPDATE).
	 * @param {Object} options
	 * @param {boolean} [options.ignore] If true, INSERT will be executed as INSERT IGNORE (ignores duplicate keys)
	 * @returns {Promise<Object>}
	 */
	async save (options: { ignore?: boolean } = {}): Promise<object|false> {
		let outputData = null;

		if (this.PK !== null && this.#loaded) { // UPDATE
			let setColumns = [];
			for (const column of this.#definition!.columns) {
				if (this.#originalValues[column.name] === this.#values[column.name]) continue;

				setColumns.push(
					this.query.escapeIdentifier(column.name) +
					" = " +
					this.query.convertToSQL(this.#values[column.name], column.type)
				);
			}

			if (setColumns.length === 0) { // no update necessary
				return false;
			}

			outputData = await this.query.raw([
				"UPDATE " + this.#definition!.escapedPath,
				"SET " + setColumns.join(", "),
				"WHERE " + this.query.escapeIdentifier(this.fieldPK.name) + " = " + this.escapedPK
			].join(" "));
		}
		else { // INSERT
			let columns = [];
			let values = [];
			for (const column of this.#definition!.columns) {
				if (this.#values[column.name] === Symbol.for("unset")) continue;

				columns.push(this.query.escapeIdentifier(column.name));
				values.push(this.query.convertToSQL(this.#values[column.name], column.type));
			}

			const ignore = (options.ignore === true ? "IGNORE " : "");
			outputData = await this.query.send([
				"INSERT " + ignore + "INTO " + this.#definition!.escapedPath,
				"(" + columns.join(",") + ")",
				"VALUES (" + values.join(",") + ")"
			].join(" "));

			if (outputData.insertId !== 0) {
				this.#primaryKey = outputData.insertId;
				await this.load(this.#primaryKey!);
			}
			else if (columns.indexOf(this.fieldPK.name) !== -1) {
				this.#primaryKey = this.#values[this.fieldPK.name];
				await this.load(this.#primaryKey!);
			}
			else {
				this.#primaryKey = null;
			}
		}

		return outputData;
	}

	/**
	 * Performs a DELETE operation on the currently loaded row.
	 * @returns {Promise<void>}
	 */
	async delete (): Promise<void> {
		if (this.PK !== null) {
			await this.query.send([
				"DELETE FROM " + this.#definition!.escapedPath,
				"WHERE " + this.query.escapeIdentifier(this.fieldPK.name) + " = " + this.escapedPK
			].join(" "));
			this.#loaded = false;
		}
		else {
				// @ts-ignore
			throw new stolen_sb.Error({
				message: "In order to delete the row, it must be loaded.",
				args: this.#definition
			});
		}
	}

	/**
	 * @private
	 * Resets the data of the currently loaded row.
	 */
	reset () {
		this.#loaded = false;
		this.#primaryKey = null;
		for (const column of this.#definition!.columns) {
			this.#values[column.name] = Symbol.for("unset");
			this.#originalValues[column.name] = Symbol.for("unset");
		}
	}

	/**
	 * Syntax sugar to set multiple values at once.
	 * @param {Object} data
	 * @returns {Row}
	 */
	setValues (data: object): Row {
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
	hasProperty (property: string): boolean {
		return (typeof this.#values[property] !== "undefined");
	}

	/** @type {Object} */
	get valuesObject () { return Object.assign({}, this.#values); }
	get originalValues () { return this.#originalValues; }
	get PK () { return this.#primaryKey; }
	get fieldPK () { return this.#primaryKeyField; }
	get escapedPK () {
		if (this.PK === null) {
				// @ts-ignore
			throw new stolen_sb.Error({
				message: "Row has no PK"
			});
		}
		return this.query.convertToSQL(this.PK, this.fieldPK.type);
	}
	get values () { return this.#valueProxy; }
	get definition () { return this.#definition || null; }
	get path () {
		if (this.#definition) {
			return this.#definition.path;
		}
		else {
				// @ts-ignore
			throw new stolen_sb.Error({
				message: "This row has no definition, yet"
			});
		}
	}
	get loaded () { return this.#loaded; }
};

module.exports = Row;