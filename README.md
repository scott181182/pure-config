[![Build Status](https://travis-ci.org/scott181182/pure-config.svg?branch=master)](https://travis-ci.org/scott181182/pure-config.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/scott181182/pure-config/badge.svg?branch=master)](https://coveralls.io/github/scott181182/pure-config?branch=master)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

# Pure Config
JavaScript/Typescript Configuration Parser and API for the [Pure Config Specification](https://github.com/pureconfig/pureconfig)

> [!IMPORTANT]
> This project was originally written when the above PureConfig project was a novel configuration file format that I enjoyed.
> The PureConfig project has since changed scope, so this TypeScript binding for it is pretty much moot.

## Configuration files
See the [Pure Config Specification](https://github.com/pureconfig/pureconfig) for how to write .pure config files

## Install
Install the library using NPM and include it in your code

- To use the `Configuration` class in a TypeScript file -

```ts
import { Configuration } from "pure-config";

const config = new Configuration("/path/to/config.pure");
```

- To use the `Configuration` class in a JavaScript file -

```js
const Configuration = require('pure-config').Configuration;

const config = new Configuration('/path/to/config.pure');
```

## API

You can get and set any value, as well as ask for specific types

```javascript
config.get('server.port'); // Returns the type that the parser found in the .pure file

config.has('server.bind'); // Returns a boolean of whether that value exists or not

config.set('server.port', 8080); // Sets whatever type you give it
config.put('server.port', 80);

config.getString('log.level');  // Returns a string

// Paths must start with a Drive Letter (i.e. 'C:'), dot(s) (i.e. '.' or '..'), tilde '~', or root ('\' or '/')
config.getPath('server.log');   // Returns the string representation of the path

config.getQuantity('bandwidth') // Returns an object: { magnitude: [number], unit: [string] }
config.getInt('my-number')      // Returns round number, or rounds floating points, or tries to coerce other types
config.getDouble('pi')          // Returns a number, or tries to coerce other types
config.getBoolean('isAdmin')    // Returns a boolean, or tries to coerce other types
```

## Other Features
This implementation of the Pure Specification does not currently support the optional Schema mechanism, so data types are determined implicitly
