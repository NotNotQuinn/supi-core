/* global stolen_sb */
import Query from './index';
import { WhereHavingParams, FormatSymbol, ColumnDefinition } from './index';
/**
 * Represents the UPDATE sql statement.
 */
export default class RecordUpdater {
	#query: Query|null = null;
	#update: { database: string|null, table: string|null } = { database: null, table: null };
	#set: { column: string, value: any }[] = [];
	#where: string[] = [];

	#priority = "normal";
	#ignoreDuplicates = false;

	/**
	 * Creates a new Recordset instance.
	 * @param {Query} query
	 * @name {Recordset}
	 */
	constructor (query: Query) {
		/** @type {Query} */
		this.#query! = query;
	}

	priority (value: "normal" | "low") {
		if (!["normal", "low"].includes(value)) {
			// @ts-ignore
			throw new stolen_sb.Error({
				message: "Incorrect priority value",
				args: { value }
			});
		}

		this.#priority = value;
		return this;
	}

	ignoreDuplicates () {
		this.#ignoreDuplicates = true;
		return this;
	}

	/**
	 * Sets the UPDATE database + table.
	 * @param {string} database
	 * @param {string} table
	 * @returns {RecordUpdater}
	 */
	update (database:string , table:string ): RecordUpdater {
		this.#update.database = database;
		this.#update.table = table;
		return this;
	}

	/**
	 * Sets the SET statement for a specific column.
	 * @param {string} column
	 * @param {*} value
	 * @returns {RecordUpdater}
	 */
	set (column: string, value: any): RecordUpdater {
		this.#set = this.#set.concat({ column, value });
		return this;
	}

	/**
	 * Sets a WHERE condition.
	 * First parameter can be an option argument {@link WhereHavingParams}
	 * Multiple formatting symbols {@link FormatSymbol} can be used
	 * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
	 * @returns {RecordUpdater}
	 */
	where (...args: Array<string | FormatSymbol | WhereHavingParams>): RecordUpdater {
		let options: { condition?: string } = {};
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
	 * Translates the RecordUpdater to its SQL representation.
	 * @returns {Promise<string[]>}
	 * @throws {stolen_sb.Error} If no UPDATE database/table have been provided.
	 * @throws {stolen_sb.Error} If no SET columns have been provided.
	 */
	async toSQL (): Promise<string[]> {
		if (!this.#update.database || !this.#update.table) {
			// @ts-ignore
			throw new stolen_sb.Error({
				message: "No UPDATE database/table in RecordUpdater - invalid definition"
			});
		}
		else if (this.#set.length === 0) {
			// @ts-ignore
			throw new stolen_sb.Error({
				message: "No SET in RecordUpdater - invalid definition"
			});
		}

		const sql = [];
		const set = [];
		const { columns } = await this.#query!.getDefinition(this.#update.database, this.#update.table) as { columns: ColumnDefinition[] };
		const priority = (this.#priority === "low") ? "LOW_PRIORITY " : "";
		const ignore = (this.#ignoreDuplicates) ? "IGNORE " : "";

		sql.push(`UPDATE ${priority} ${ignore} \`${this.#update.database}\`.\`${this.#update.table}\``);

		for (const { column, value } of this.#set) {
			const definition = columns.find(i => i.name === column);
			if (!definition) {
			// @ts-ignore
				throw new stolen_sb.Error({
					message: `Unrecognized column "${column}"`
				});
			}

			if (value?.useField) {
				set.push(`${column} = ${value.value}`);
			}
			else {
				set.push(`${column} = ${this.#query!.convertToSQL(value, definition.type)}`);
			}
		}

		sql.push("SET " + set.join(", "));
		if (this.#where.length !== 0) {
			sql.push("WHERE (" + this.#where.join(") AND (") + ")");
		}

		return sql;
	}


	async fetch (): Promise<any> {
		const sql = await this.toSQL();
		return await this.#query!.raw(...sql);
	}
};