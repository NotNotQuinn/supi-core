export = TemplateSingletonModule;
declare class TemplateSingletonModule {
    /**
     * Constructs the singleton instance.
     * @returns {Promise<void>}
     */
    static singleton(): Promise<void>;
    /**
     * Cleans up the module.
     * All sub-classes must implement this method.
     * @abstract
     */
    destroy(): void;
    /**
     * File name of the module.
     * All sub-classes must implement this getter.
     * @abstract
     */
    get modulePath(): void;
}
