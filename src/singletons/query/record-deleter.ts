
import Query from './index';
import { FormatSymbol, WhereHavingParams } from './index';
/* global stolen_sb */
/**
 * Represents the UPDATE sql statement.
 */
module.exports = class RecordDeleter {
	#query: Query|null = null;
	#deleteFrom: { database: string|null; table: string|null } = { database: null, table: null };
	#where: string[] = [];
	#confirmedFullDelete = false;

	/**
	 * Creates a new Recordset instance.
	 * @param {Query} query
	 * @name {Recordset}
	 */
	constructor (query: Query) {
		/** @type {Query} */
		this.#query! = query;
	}

	/**
	 * Placeholder for the "correct" SQL syntax
	 * @returns {RecordDeleter}
	 */
	delete (): RecordDeleter {
		return this;
	}

	/**
	 * Creates a FROM statement for DELETE
	 * @param {string} database
	 * @param {string} table
	 * @returns {RecordDeleter}
	 */
	from (database: string, table: string): RecordDeleter {
		this.#deleteFrom.database = database;
		this.#deleteFrom.table = table;
		return this;
	}

	/**
	 * Sets a WHERE condition.
	 * First parameter can be an option argument {@link WhereHavingParams}
	 * Multiple formatting symbols {@link FormatSymbol} can be used
	 * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
	 * @returns {RecordDeleter}
	 */
	where (...args: Array<string | FormatSymbol | WhereHavingParams>): RecordDeleter {
		let options: {
			condition?: boolean;
		} = {};
		if (args[0] && args[0].constructor === Object) {
			options = args[0] as Object;
			args.shift();
		}

		if (typeof options.condition !== "undefined" && !options.condition) {
			return this;
		}

		let format = "";
		if (typeof args[0] === "string") {
			format = args.shift() as string;
		}

		let index = 0;
		format = format.replace(this.#query!.formatSymbolRegex, (fullMatch, param) => (
			this.#query!.parseFormatSymbol(param, args[index++])
		));

		this.#where = this.#where.concat(format);

		return this;
	}

	/**
	 * If there is a need to delete without WHERE, this flag must be set.
	 * Otherwise, a no-condition DELETE will not be performed, and ends with an exception.
	 * @returns {RecordDeleter}
	 * @throws {stolen_sb.Error} If no FROM database/table have been provided.
	 */
	confirm (): RecordDeleter {
		this.#confirmedFullDelete = true;
		return this;
	}

	/**
	 * Translates the RecordDeleter to its SQL representation.
	 * @returns {Promise<string[]>}
	 * @throws {stolen_sb.Error} If no FROM database/table have been provided.
	 */
	async toSQL (): Promise<string[]> {
		if (!this.#deleteFrom.database || !this.#deleteFrom.table) {
				// @ts-ignore
			throw new stolen_sb.Error({
				message: "No UPDATE database/table in RecordUpdater - invalid definition"
			});
		}

		const sql = [];
		sql.push(`DELETE FROM \`${this.#deleteFrom.database}\`.\`${this.#deleteFrom.table}\``);

		if (this.#where.length !== 0) {
			sql.push("WHERE (" + this.#where.join(") AND (") + ")");
		}
		else {
			if (!this.#confirmedFullDelete) {
				// @ts-ignore
				throw new stolen_sb.Error({
					message: "Unconfirmed full table deletion",
					args: {
						from: this.#deleteFrom
					}
				})
			}
		}

		return sql;
	}

	/**
	 * Runs the UPDATE SQL query and returns the status object.
	 * @returns {Object}
	 */
	async fetch (): Promise<object> {
		const sql = await this.toSQL();
		return await this.#query!.raw(...sql);
	}
};