import sbDate from './date';

export default class sbError extends global.Error {
	parentError: sbError | Error;
	date: sbDate;
	/**
	 * Custom error object - has arguments provided
	 * @param {Object} obj
	 * @param {Error} [error]
	 */
	constructor (obj: object, error: Error) {
		if (!obj || obj.constructor !== Object) {
			throw new global.Error("sbError must receive an object as params");
		}

		const {message, args} = obj as any;
		super(message);

		this.parentError = error ?? null;
		this.name = (obj as any).name || "sbError";
		this.date = new sbDate();

		if (args) {
			this.message += "; args = " + JSON.stringify(args, null, 2);
		}

		const stackDescriptor = Object.getOwnPropertyDescriptor(this, "stack");
		Object.defineProperty(this, "stack", {
			get: () => {
				const currentStack = (typeof stackDescriptor!.get === "function")
					? stackDescriptor!.get()
					: stackDescriptor!.value;

				const extraStack = (this?.parentError?.stack)
					? `\n=====\nCaused by:\n${this.parentError.stack}`
					: "";

				return currentStack + extraStack;
			}
		});
	}

	toString () {
		// @ts-ignore
		let description = super.description;
		// @ts-ignore
		if (this.error) {
		// @ts-ignore
			description += `\n${this.error.description}`;
		}

		return description;
	}
};