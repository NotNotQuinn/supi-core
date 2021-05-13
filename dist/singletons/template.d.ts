/** @interface */
export default class TemplateSingletonModule {
    static module: TemplateSingletonModule;
    /**
     * Cleans up the module.
     * All sub-classes must implement this method.
     * @abstract
     */
    destroy(): void;
    /**
     * Constructs the singleton instance.
     * @returns {Promise<void>}
     */
    static singleton(): Promise<TemplateSingletonModule>;
    /**
     * File name of the module.
     * All sub-classes must implement this getter.
     * @abstract
     */
    get modulePath(): string;
}
