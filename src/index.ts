import { readFileSync } from "fs";
import { dirname, resolve } from "path";

import * as _ from "lodash";

export type Path = string;
export type Quantity = { unit: string, magnitude: number };

const r_linefeed = /[\r\n]+/;

const s_key =              "\\s*[a-zA-Z][!-<>-~]*?(\\.[a-zA-Z][!-<>-~]*?)*\\s*";
const s_value =            "\\s*[\\t -~]+\\s*";
const r_key =              new RegExp(`^${s_key}$`);
const r_value =            new RegExp(`^${s_value}$`);

const r_singleton =        new RegExp(`^${s_key}=${s_value}$`);
const r_linked_singleton = new RegExp(`^${s_key}=>${s_key}$`);
const r_nest =             new RegExp(`^${s_key}(=>${s_key})?$`);
// Be careful, this also matches empty string singletons
const r_array_opener =     new RegExp(`^${s_key}=\\s*$`);

const s_int =              "[\\-+]?[0-9]+";
const s_number =           `${s_int}(\\.[0-9]+)?`;
const r_int =              new RegExp(`^${s_int}$`);
const r_double =           new RegExp(`^${s_int}\\.[0-9]+$`);
const r_number =           new RegExp(`${s_number}`);

const s_alpha =            "[a-zA-Z]+";
const r_alpha =            new RegExp(`${s_alpha}`);
const r_quantity =         new RegExp(`^${s_number}${s_alpha}$`);

const s_filename =         "[^\\\\\\/:?*\"><|\\0]+";
const r_path =             new RegExp(`^([a-zA-Z]:|\.{1,2}|~)?([\\\\\\/]${s_filename})*$`);

export class Configuration
{
    private path: string;
    private directory: string;
    private object: any;

    constructor(filename: string)
    {
        this.path = resolve(filename);
        const data = readFileSync(this.path, "utf8");

        this.directory = dirname(this.path);

        // Holds the configuration values
        this.object = {  };
        this.parseConfig(data);
    }

    /*
     * Instance Methods for retrieving configuration data
     */
    public get(key: string): any { return _.get(this.object, key); }
    public has(key: string): any { return _.has(this.object, key); }

    /* Get specific types. Technically unneccesary in JavaScript, but I"ll allow limited value coersions */
    public getBool(key: string): boolean {
        const val = this.get(key);
        return typeof val === "boolean" ? val : !!val;
    }
    public getInt(key: string): number {
        const val = this.get(key);
        return typeof val === "number" ? Math.round(val) : Math.round(parseFloat(val.match(r_number)[0]));
    }
    public getDouble(key: string): number {
        const val = this.get(key);
        return typeof val === "number" ? val : parseFloat(val.match(r_number)[0]);
    }
    public getString(key: string): string {
        const val = this.get(key);
        return typeof val === "string" ? val : JSON.stringify(val);
    }
    public getPath(key: string): string {
        let path: string = this.get(key);
        if(path[0] === "~") { path = path.replace(/^~/, process.env.HOME); }
        path = resolve(this.directory, path);
        return path;
    }
    public getQuantity(key: string): Quantity {
        const val = this.get(key);
        return val.magnitude && val.unit ? val : {
            magnitude: parseFloat(val.match(r_number)[0]),
            unit: val.match(r_alpha)
        };
    }
    public getQuantityValue(key: string): number { return this.getQuantity(key).magnitude; }
    // I prefer the term Magnitude to Value
    public getQuantityMagnitude(key: string): number { return this.getQuantityValue(key); }
    public getQuantityUnit(key: string): string { return this.getQuantity(key).unit; }

    /*  While I dont support programatically setting configuration settings,
     *  I'll allow it on the terms of the API Specification */
    public put(key: string, value: any) { _.set(this.object, key, value); }
    public set(key: string, value: any) { this.put(key, value); }



    /*
     * Internal Methods for building the configuration tree
     */
    private parseConfig(data: string)
    {
        /* PRE-PROCESSING */
        // Capture Multiline Properties
        data = data.replace(/\s*\\[\r\n]+\s*/g, " ");

        const lines = data.split(r_linefeed);
        this.parseBlock(lines, this.object, this.object);
    }

    private parseBlock(lines: string[], root: any, parent: any): void
    {
        let skipTo = -1;

        /** PROCESSING */
        lines.forEach((line, lineNum) => {
            if(lineNum < skipTo) { return; }

            // Comments. Comment about Comments. #metacomment
            if(_.startsWith(line.trim(), "#")) { return; }
            if(_.startsWith(line.trim(), "%include")) {
                return _.merge(root,
                    new Configuration(resolve(this.directory, line.substr(line.indexOf(" ") + 1))).object);
            }

            let newKey: string;

            if(r_nest.test(line) && lines[lineNum + 1] && lines[lineNum + 1].search(/\S/) > line.search(/\S/)) {
                const frags = line.split("=>");
                newKey = frags[0].trim();

                parent[newKey] = {  };

                const currIndent = line.search(/\S/);
                if(frags[1]) { parent[newKey] = _.cloneDeep(_.get(root, frags[1].trim())); }

                let blockEnd = _.findIndex(lines, (f_line, f_index) => {
                    if(f_index <= lineNum) { return false; }
                    return f_line.search(/\S/) === currIndent;
                });
                if(blockEnd === -1) { blockEnd = lines.length; }
                skipTo = blockEnd;

                const blockLines = lines.slice(lineNum + 1, blockEnd);
                _.merge(parent[newKey], this.parseBlock(blockLines, root, parent[newKey]));
            }
            else if(r_array_opener.test(line)) {
                if(!lines[lineNum + 1]
                    || lines[lineNum + 1].search(/\S/) !== line.search(/\S/)
                    || lines[lineNum + 1].match(/\S/)[0] !== "[")
                {
                    newKey = this.parseSingleton(line, parent);
                }
                else
                {
                    const frags = line.split("=");
                    newKey = frags[0].trim();

                    parent[newKey] = [  ];

                    const currIndent = line.search(/\S/);
                    const blockEnd = _.findIndex(lines, (f_line, f_index) => {
                        if(f_index <= lineNum) { return false; }
                        return f_line.search(/\S/) === currIndent && f_line.charAt(f_line.search(/\S/)) === "]";
                    });
                    if(blockEnd === -1) {
                        throw new Error("Could not find closing bracket to list:\n" + line + "\n" + lines[lineNum + 1]);
                    }
                    skipTo = blockEnd + 1;

                    const blockLines = lines.slice(lineNum + 2, blockEnd);
                    this.parseBlock(blockLines, root, parent[newKey]);
                }
            }
            else if(r_linked_singleton.test(line)) {
                const frags = line.split("=>");
                newKey = frags[0].trim();
                _.set(parent, newKey, _.cloneDeep(_.get(root, frags[1].trim())));
            }
            else if(r_singleton.test(line)) {
                newKey = this.parseSingleton(line, parent);
            }
            else if(Array.isArray(parent) && r_value.test(line)) {
                parent.push(this.parseValue(line.trim()));
            }

            if(Array.isArray(parent) && newKey) { parent.push((parent as any)[newKey]); }
        });
    }

    private parseSingleton(line: string, obj: any): string
    {
        const frags = line.split("=");
        const key = frags[0].trim();
        const value = this.parseValue(frags.slice(1).join("=").trim());
        _.set(obj, key, value);
        return key;
    }
    private parseValue(val: string): any
    {
        val = val.replace(/\$[\{]?([a-zA-Z][a-zA-Z0-9_]*)[\}]?/, (match, p1) => process.env[p1]);
        val = val.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/, (match, p1) => process.env[p1]);

        if(_.startsWith(val, "[")) {
            const line = val.substring(1, val.indexOf("]"));
            return line.split(/,/).map((frag) => this.parseValue(frag.trim()));
        }

        // Boolean Data Types
        if(val.toLowerCase() === "true") { return true; }
        if(val.toLowerCase() === "false") { return false; }

        // Number Data Types
        if(r_int.test(val)) { return parseInt(val); }
        if(r_double.test(val)) { return parseFloat(val); }
        if(r_quantity.test(val)) {
            const magnitude = parseFloat(val.match(r_number)[0]);
            const unit = val.match(r_alpha)[0];
            return { magnitude, unit };
        }

        val = val.replace(/^["']/, "").replace(/([^\\])["']$/, "$1").replace(/\\$/, " ");
        val = escapeChars(val);

        // Path. '/' works on all OSs
        if(r_path.test(val)) {
            return val.replace(/\\/g, "/");
        }

        // Strings!
        return val;
    }
}

function escapeChars(str: string): string {
    return str.replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\t")
        .replace(/\\f/g, "\f")
        .replace(/\\'/g, "\'")
        .replace(/\\"/g, "\"")
        .replace(/\\\\/g, "\\")
        .replace(/\\ /g, " ");
}
