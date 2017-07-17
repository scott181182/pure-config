export declare type Path = string;
export declare type Quantity = {
    unit: string;
    magnitude: number;
};
export declare class Configuration {
    private path;
    private directory;
    private object;
    constructor(filename: string);
    get(key: string): any;
    has(key: string): any;
    getBool(key: string): boolean;
    getInt(key: string): number;
    getDouble(key: string): number;
    getString(key: string): string;
    getPath(key: string): string;
    getQuantity(key: string): Quantity;
    getQuantityValue(key: string): number;
    getQuantityMagnitude(key: string): number;
    getQuantityUnit(key: string): string;
    put(key: string, value: any): void;
    set(key: string, value: any): void;
    private parseConfig(data);
    private parseBlock(lines, root, parent);
    private parseSingleton(line, obj);
    private parseValue(val);
}
