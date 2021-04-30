/* global stolen_sb */
module.exports = class Error extends global.Error {
	/**
	 * Custom error object - has arguments provided
	 * @param {Object} obj
	 * @param {Error} [error]
	 */
	constructor (obj, error) {
		if (!obj || obj.constructor !== Object) {
			throw new global.Error("stolen_sb.Error must receive an object as params");
		}

		const {message, args} = obj;
		super(message);

		this.parentError = error ?? null;
		this.name = obj.name || "stolen_sb.Error";
		this.date = new stolen_sb.Date();

		if (args) {
			this.message += "; args = " + JSON.stringify(args, null, 2);
		}

		const stackDescriptor = Object.getOwnPropertyDescriptor(this, "stack");
		Object.defineProperty(this, "stack", {
			get: () => {
				const currentStack = (typeof stackDescriptor.get === "function")
					? stackDescriptor.get()
					: stackDescriptor.value;

				const extraStack = (this?.parentError?.stack)
					? `\n=====\nCaused by:\n${this.parentError.stack}`
					: "";

				return currentStack + extraStack;
			}
		});
	}

	toString () {
		let description = super.description;
		if (this.error) {
			description += `\n${this.err.description}`;
		}

		return description;
	}
};