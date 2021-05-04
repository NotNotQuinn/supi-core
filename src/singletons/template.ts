/** @interface */
export default class TemplateSingletonModule {
	static module: TemplateSingletonModule;
	/**
	 * Cleans up the module.
	 * All sub-classes must implement this method.
	 * @abstract
	 */
	destroy () {
		throw new Error("Module.destroy is not implemented");
	}

	/**
	 * Constructs the singleton instance.
	 * @returns {Promise<void>}
	 */
	static async singleton (): Promise<TemplateSingletonModule> {
		throw new Error("Module.singleton is not implemented")
	}

	/**
	 * File name of the module.
	 * All sub-classes must implement this getter.
	 * @abstract
	 */
	get modulePath (): string {
		throw new Error("get Module.modulePath is not implemented");
	}
};