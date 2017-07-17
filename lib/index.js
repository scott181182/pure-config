"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
var _ = require("lodash");
var r_linefeed = /[\r\n]+/;
var s_key = "\\s*[a-zA-Z][!-<>-~]*?(\\.[a-zA-Z][!-<>-~]*?)*\\s*";
var s_value = "\\s*[\\t -~]+\\s*";
var r_key = new RegExp("^" + s_key + "$");
var r_value = new RegExp("^" + s_value + "$");
var r_singleton = new RegExp("^" + s_key + "=" + s_value + "$");
var r_linked_singleton = new RegExp("^" + s_key + "=>" + s_key + "$");
var r_nest = new RegExp("^" + s_key + "(=>" + s_key + ")?$");
var r_array_opener = new RegExp("^" + s_key + "=\\s*$");
var s_int = "[\\-+]?[0-9]+";
var s_number = s_int + "(\\.[0-9]+)?";
var r_int = new RegExp("^" + s_int + "$");
var r_double = new RegExp("^" + s_int + "\\.[0-9]+$");
var r_number = new RegExp("" + s_number);
var s_alpha = "[a-zA-Z]+";
var r_alpha = new RegExp("" + s_alpha);
var r_quantity = new RegExp("^" + s_number + s_alpha + "$");
var s_filename = "[^\\\\\\/:?*\"><|\\0]+";
var r_path = new RegExp("^([a-zA-Z]:|.{1,2}|~)?([\\\\\\/]" + s_filename + ")*$");
var Configuration = (function () {
    function Configuration(filename) {
        this.path = path_1.resolve(filename);
        var data = fs_1.readFileSync(this.path, "utf8");
        this.directory = path_1.dirname(this.path);
        this.object = {};
        this.parseConfig(data);
    }
    Configuration.prototype.get = function (key) { return _.get(this.object, key); };
    Configuration.prototype.has = function (key) { return _.has(this.object, key); };
    Configuration.prototype.getBool = function (key) {
        var val = this.get(key);
        return typeof val === "boolean" ? val : !!val;
    };
    Configuration.prototype.getInt = function (key) {
        var val = this.get(key);
        return typeof val === "number" ? Math.round(val) : Math.round(parseFloat(val.match(r_number)[0]));
    };
    Configuration.prototype.getDouble = function (key) {
        var val = this.get(key);
        return typeof val === "number" ? val : parseFloat(val.match(r_number)[0]);
    };
    Configuration.prototype.getString = function (key) {
        var val = this.get(key);
        return typeof val === "string" ? val : JSON.stringify(val);
    };
    Configuration.prototype.getPath = function (key) {
        var path = this.get(key);
        if (path[0] === "~") {
            path = path.replace(/^~/, process.env.HOME);
        }
        path = path_1.resolve(this.directory, path);
        return path;
    };
    Configuration.prototype.getQuantity = function (key) {
        var val = this.get(key);
        return val.magnitude && val.unit ? val : {
            magnitude: parseFloat(val.match(r_number)[0]),
            unit: val.match(r_alpha)
        };
    };
    Configuration.prototype.getQuantityValue = function (key) { return this.getQuantity(key).magnitude; };
    Configuration.prototype.getQuantityMagnitude = function (key) { return this.getQuantityValue(key); };
    Configuration.prototype.getQuantityUnit = function (key) { return this.getQuantity(key).unit; };
    Configuration.prototype.put = function (key, value) { _.set(this.object, key, value); };
    Configuration.prototype.set = function (key, value) { this.put(key, value); };
    Configuration.prototype.parseConfig = function (data) {
        data = data.replace(/\s*\\[\r\n]+\s*/g, " ");
        var lines = data.split(r_linefeed);
        this.parseBlock(lines, this.object, this.object);
    };
    Configuration.prototype.parseBlock = function (lines, root, parent) {
        var _this = this;
        var skipTo = -1;
        lines.forEach(function (line, lineNum) {
            if (lineNum < skipTo) {
                return;
            }
            if (_.startsWith(line.trim(), "#")) {
                return;
            }
            if (_.startsWith(line.trim(), "%include")) {
                return _.merge(root, new Configuration(path_1.resolve(_this.directory, line.substr(line.indexOf(" ") + 1))).object);
            }
            var newKey;
            if (r_nest.test(line) && lines[lineNum + 1] && lines[lineNum + 1].search(/\S/) > line.search(/\S/)) {
                var frags = line.split("=>");
                newKey = frags[0].trim();
                parent[newKey] = {};
                var currIndent_1 = line.search(/\S/);
                if (frags[1]) {
                    parent[newKey] = _.cloneDeep(_.get(root, frags[1].trim()));
                }
                var blockEnd = _.findIndex(lines, function (f_line, f_index) {
                    if (f_index <= lineNum) {
                        return false;
                    }
                    return f_line.search(/\S/) === currIndent_1;
                });
                if (blockEnd === -1) {
                    blockEnd = lines.length;
                }
                skipTo = blockEnd;
                var blockLines = lines.slice(lineNum + 1, blockEnd);
                _.merge(parent[newKey], _this.parseBlock(blockLines, root, parent[newKey]));
            }
            else if (r_array_opener.test(line)) {
                if (!lines[lineNum + 1]
                    || lines[lineNum + 1].search(/\S/) !== line.search(/\S/)
                    || lines[lineNum + 1].match(/\S/)[0] !== "[") {
                    newKey = _this.parseSingleton(line, parent);
                }
                else {
                    var frags = line.split("=");
                    newKey = frags[0].trim();
                    parent[newKey] = [];
                    var currIndent_2 = line.search(/\S/);
                    var blockEnd = _.findIndex(lines, function (f_line, f_index) {
                        if (f_index <= lineNum) {
                            return false;
                        }
                        return f_line.search(/\S/) === currIndent_2 && f_line.charAt(f_line.search(/\S/)) === "]";
                    });
                    if (blockEnd === -1) {
                        throw new Error("Could not find closing bracket to list:\n" + line + "\n" + lines[lineNum + 1]);
                    }
                    skipTo = blockEnd + 1;
                    var blockLines = lines.slice(lineNum + 2, blockEnd);
                    _this.parseBlock(blockLines, root, parent[newKey]);
                }
            }
            else if (r_linked_singleton.test(line)) {
                var frags = line.split("=>");
                newKey = frags[0].trim();
                _.set(parent, newKey, _.cloneDeep(_.get(root, frags[1].trim())));
            }
            else if (r_singleton.test(line)) {
                newKey = _this.parseSingleton(line, parent);
            }
            else if (Array.isArray(parent) && r_value.test(line)) {
                parent.push(_this.parseValue(line.trim()));
            }
            if (Array.isArray(parent) && newKey) {
                parent.push(parent[newKey]);
            }
        });
    };
    Configuration.prototype.parseSingleton = function (line, obj) {
        var frags = line.split("=");
        var key = frags[0].trim();
        var value = this.parseValue(frags.slice(1).join("=").trim());
        _.set(obj, key, value);
        return key;
    };
    Configuration.prototype.parseValue = function (val) {
        var _this = this;
        val = val.replace(/\$[\{]?([a-zA-Z][a-zA-Z0-9_]*)[\}]?/, function (match, p1) { return process.env[p1]; });
        val = val.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/, function (match, p1) { return process.env[p1]; });
        if (_.startsWith(val, "[")) {
            var line = val.substring(1, val.indexOf("]"));
            return line.split(/,/).map(function (frag) { return _this.parseValue(frag.trim()); });
        }
        if (val.toLowerCase() === "true") {
            return true;
        }
        if (val.toLowerCase() === "false") {
            return false;
        }
        if (r_int.test(val)) {
            return parseInt(val);
        }
        if (r_double.test(val)) {
            return parseFloat(val);
        }
        if (r_quantity.test(val)) {
            var magnitude = parseFloat(val.match(r_number)[0]);
            var unit = val.match(r_alpha)[0];
            return { magnitude: magnitude, unit: unit };
        }
        val = val.replace(/^["']/, "").replace(/([^\\])["']$/, "$1").replace(/\\$/, " ");
        val = escapeChars(val);
        if (r_path.test(val)) {
            return val.replace(/\\/g, "/");
        }
        return val;
    };
    return Configuration;
}());
exports.Configuration = Configuration;
function escapeChars(str) {
    return str.replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\t")
        .replace(/\\f/g, "\f")
        .replace(/\\'/g, "\'")
        .replace(/\\"/g, "\"")
        .replace(/\\\\/g, "\\")
        .replace(/\\ /g, " ");
}
