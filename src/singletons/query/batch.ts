import Query from './index';
import { ColumnDefinition } from './index';
import sbError from '../../objects/error';

/**
 * Represents the SQL INSERT statement for multiple rows.
 * One instance is always locked to one table and some of its columns based on constructor.
 */
class Batch {
	/**
	 * This promise resolves when the Batch finishes constructing.
	 */
	readyPromise: Promise<void> = (async() => {})();
	query: Query|null = null;
	database: string|null;
	table: string|null;
	records: any[]|null = [];
	columns: ColumnDefinition[]|null = [];
	ready: boolean|null = false;

	/**
	 * Creates a new Batch instance. Constructor must be await-ed.
	 * @param {Query} query
	 * @param {string} db
	 * @param {string} table
	 * @param {string[]} columns
	 * @throws sbError If a nonexistent column has been provided
	 */
	constructor (query: Query, db: string, table: string, columns: string[]) {
		this.query! = query;
		this.database! = db;
		this.table! = table;
		this.records! = [];
		this.columns! = [];
		this.ready = false;

		this.readyPromise = (async () => {
			const definition = await this.query!.getDefinition(db, table);
			for (const column of columns) {
				if (definition.columns.every(col => column !== col.name)) {
					throw new sbError({
						message: "Unrecognized Batch column",
						args: {
							database: db,
							table: table,
							column: definition.columns.filter(i => column !== i.name).map(i => i.name).join(", ")
						}
					});
				}
			}

			this.columns! = definition.columns.filter(column => columns.indexOf(column.name) !== -1);
			this.ready = true;
		})();
	}

	/**
	 * Adds a data record, based on the Batch's columns definition
	 * @param {Object} data
	 * @returns {number} The index of added data record
	 */
	add (data: object): number {
		return (this.records!.push(data) - 1);
	}

	/**
	 * Deletes a record based on its index
	 * @param index
	 */
	delete (index: number) {
		this.records!.splice(index, 1);
	}

	/**
	 * Attempts to find a record based on a callback function
	 * @param {Function} callback
	 * @returns {Object|null} record
	 */
	find (callback: NthArgType<0, functionArguments< Array<Object>["find"] > > ): object | null {
		return this.records!.find(callback) ?? null;
	}

	/**
	 * Executes the INSERT statement for bound database, table and columns.
	 * Automatically clears itself after the statement is executed.
	 * @param {Object} options Additional options
	 * @param {boolean} options.ignore If true, batch will use `INSERT IGNORE INTO`.
	 * @param {Function} options.duplicate If set, will use the result of this callback to create ON DUPLICATE KEY clausule.
	 * @returns {Promise<void>}
	 */
	async insert (options: { ignore?: boolean; duplicate?: Function } = {}): Promise<void> {
		if (this.records!.length === 0) {
			return;
		}

		let stringColumns = [];
		let data: any[][] = this.records!.map(() => []);
		for (const column of this.columns!) {
			const name = column.name;
			const type = column.type;
			stringColumns.push(this.query!.escapeIdentifier(name));

			for (let i = 0; i < this.records!.length; i++) {
				data[i].push(this.query!.convertToSQL(this.records![i][name], type));
			}
		}

		const { duplicate, ignore } = options;
		if (duplicate && ignore) {
			throw new sbError({
				message: "Cannot set ignore and duplicate at the same time"
			});
		}

		data = data.filter(i => i.length !== 0);
		if (data.length !== 0) {
			try {
				await this.query!.raw([
					`INSERT ${ignore ? "IGNORE" : ""} INTO`,
					"`" + this.database! + "`.`" + this.table! + "`",
					"(" + stringColumns.join(", ") + ")",
					"VALUES ("  + data.map(row => row.join(", ")).join("), (") + ")",
					(duplicate ? duplicate(data, stringColumns) : "")
				].join(" "));
			}
			catch (e) {
				console.error("Batch SQL failed", e);
			}
		}

		this.clear();
	}

	/**
	 * Clears all records from the instance.
	 */
	clear () {
		this.records! = [];
	}

	/**
	 * Destroys the instance, freeing up memory and making it unusable.
	 */
	destroy () {
		this.clear();
		this.columns = null;
		this.records = null;
		this.query = null;
		this.table = null;
		this.database = null;
	}
};

// util types, I probibly dont need them but whatever.
type functionArguments<T extends Function> = T extends (...args: infer A) => any ? A : unknown;
type NthArgType<N extends number, A extends Array<any>> = A extends Array<any> ? A[N] : unknown;

export default Batch;