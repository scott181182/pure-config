const fs = require('fs');
const _ = require('lodash');

const r_linefeed = /[\r\n]+/;
const r_singleton = /^\s*[a-zA-Z][!-<>-~]*\s*=\s*[ -~]+$/;
const r_linked_singleton = /^\s*[a-zA-Z][!-<>-~]*\s*=>\s*[a-zA-Z][!-<>-~]*(\.[a-zA-Z][!-<>-~]*)*\s*$/;
const r_array_opener = /^\s*[a-zA-Z][!-<>-~]*\s*=\s*$/;
const r_nest = /^\s*[a-zA-Z][!-<>-~]*(\s*=>\s*[a-zA-Z][!-<>-~]*)?\s*$/;
const r_int = /^[0-9]+$/;
const r_double = /^[0-9]+\.[0-9]*$/;
const r_number = /^[0-9]+(\.[0-9]*)?$/;
const r_value = /^\s*[ -~]+\s*$/;

const r_quantity = /^[0-9]+[\.]?[0-9]*[a-zA-Z]+$/;
const r_magnitude = /[0-9]+[\.]?[0-9]*/;
const r_alpha = /[a-zA-Z]+/;

class Configuration {
	constructor(filename) {
		var data = fs.readFileSync(filename, 'utf8');

		var dirTree = filename.split('/');
		dirTree.pop();
		this._dir = dirTree.join('/');

		// Holds the configuration values
		this._obj = {  };
		this.parseConfig(data);
	}

	/*
   *	Instance Methods for retrieving configuration data
	 */
	get(key) { return _.get(this._obj, key); }
	has(key) { return !!_.get(this._obj, key) }
	//type(key) { return _.get(this._map, key); }

	/* Get specific types. Technically unneccesary in JavaScript, but I'll allow limited value coersions */
	getBool(key) {
		var val = this.get(key);
		return typeof val == 'boolean' ? val : !!val;
	}
	getInt(key) {
		var val = this.get(key);
		return typeof val == 'number' ? Math.round(val) : Math.round(parseFloat(val.match(r_number)[0]));
	}
	getDouble(key) {
		var val = this.get(key);
		return typeof val == 'number' ? val : parseFloat(val.match(r_number)[0]);
	}
	getString(key) {
		var val = this.get(key);
		return typeof val == 'string' ? val : JSON.stringify(val);
	}
	getPath(key) { return this.get(key); }
	getQuantity(key) {
		var val = this.get(key);
		return val.magnitude && val.unit ? val : {
			magnitude: parseFloat(val.match(r_number)[0]),
			unit: val.match(r_alpha)
		};
	}
	getQuantityValue(key) { return this.getQuantity(key).magnitude; }
	// I prefer the term Magnitude to Value
	getQuantityMagnitude(key) { return this.getQuantityValue(key); }
	getQuantityUnit(key) { return this.getQuantity(key).unit; }

	/*  While I dont support programatically setting configuration settings,
	 *  I'll allow it on the terms of the API Specification */
	put(key, value) { _.set(this._obj, key, value); }
	set(key, value) { this.put(key, value); }



	/*
	 *	Internal Methods for building the configuration tree
	 */
	parseConfig(data)
	{
		/** PRE-PROCESSING */
		// Capture Multiline Properties
		data = data.replace(/\s*\\[\r\n]+\s*/g, ' ');

		var lines = data.split(r_linefeed);
		this._parseBlock(lines, this._obj, this._obj);
	}

	_parseBlock(lines, root, parent)
	{
		var skipTo = -1;

		/** PROCESSING */
		lines.forEach((line, lineNum) => {
			if(lineNum < skipTo) { return; }

			// Comments. Comment about Comments. #metacomment
			if(line.trim().startsWith('#')) { return; }
			if(line.trim().startsWith('%include')) {
				return _.merge(root, new Configuration(this._dir + '/' + line.substr(line.indexOf(' ') + 1))._obj);
			}

			var newKey;


			if(r_nest.test(line) && lines[lineNum + 1] && lines[lineNum + 1].search(/\S/) > line.search(/\S/)) {
				var frags = line.split('=>');
				newKey = frags[0].trim();

				parent[newKey] = {  };

				var currIndent = line.search(/\S/);
				if(frags[1]) { parent[newKey] = _.cloneDeep(_.get(root, frags[1].trim())); }

				var blockEnd = lines.findIndex((f_line, f_index) => {
					if(f_index <= lineNum) { return false; }
					return f_line.search(/\S/) == currIndent;
				});
				if(blockEnd == -1) { blockEnd = lines.length; }
				skipTo = blockEnd;

				var blockLines = lines.slice(lineNum + 1, blockEnd);
				_.merge(parent[newKey], this._parseBlock(blockLines, root, parent[newKey]));
			}
			else if(r_array_opener.test(line)) {
				if(!lines[lineNum + 1] || lines[lineNum + 1].search(/\S/) != line.search(/\S/)) {
					return console.error("Expected List, but found:\n" + lines[lineNum + 1]);
				}

				var frags = line.split('=');
				newKey = frags[0].trim();

				parent[newKey] = [  ];

				var currIndent = line.search(/\S/);
				var blockEnd = lines.findIndex((f_line, f_index) => {
					if(f_index <= lineNum) { return false; }
					return f_line.search(/\S/) == currIndent && f_line.charAt(f_line.search(/\S/)) == ']';
				});
				if(blockEnd == -1) { return console.error('Could not find closing bracket to list:\n' + line + '\n' + lines[lineNum + 1]); }
				skipTo = blockEnd + 1;

				var blockLines = lines.slice(lineNum + 2, blockEnd);
				this._parseBlock(blockLines, root, parent[newKey]);
			}
			else if(r_linked_singleton.test(line)) {
				var frags = line.split('=>');
				newKey = frags[0].trim();
				_.set(parent, newKey, _.cloneDeep(_.get(root, frags[1].trim())));
			}
			else if(r_singleton.test(line)) {
				newKey = this._parseSingleton(line, parent);
			}
			else if(isArray && r_value.test(line)) {
				parent.push(_parseValue(line.trim()));
			}

			if(Array.isArray(parent) && newKey) { parent.push(parent[newKey]); }
		});
	}

	_parseSingleton(line, obj)
	{
		var frags = line.split('=');
		var key = frags[0].trim();
		var value = this._parseValue(frags[1].trim());
		_.set(obj, key, value);
		return key;
	}
	_parseValue(val)
	{
		val = val.replace(/^["']/, '').replace(/([^\\])["']$/, '$1').replace(/\\([\\ "'])/g, '$1').replace(/\\$/, ' ')

		val = val.replace(/\$[\{]?([a-zA-Z][a-zA-Z0-9_]*)[\}]?/, (match, p1) => process.env[p1]);
		val = val.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/, (match, p1) => process.env[p1]);

		if(val.startsWith('[')) {
			var line = val.substring(1, val.indexOf(']'));
			return line.split(/,/).map((frag) => this._parseValue(frag.trim()));
		}

		// Boolean Data Types
		if(val.toLowerCase() == 'true') { return true; }
		if(val.toLowerCase() == 'false') { return false; }

		// Number Data Types
		if(r_int.test(val)) { return parseInt(val); }
		if(r_double.test(val)) { return parseFloat(val); }
		if(r_quantity.test(val)) {
			var magnitude = parseFloat(val.match(r_magnitude)[0]);
			var unit = val.match(r_alpha)[0];
			return { magnitude, unit };
		}

		// Path. '/' works on all OSs
		if(val.startsWith('.') || val.indexOf('/') > -1 || val.search(/\\[^ "']/) > -1) {
			return val.replace(/\\/g, '/');
		}

		// Strings!
		return val;
	}
}

module.exports = Configuration
