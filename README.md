# Pure Config
JavaScript Configuration Parser and API for the [Pure Config Specification](https://github.com/pureconfig/pureconfig)

## Configuration files
See the [Pure Config Specification](https://github.com/pureconfig/pureconfig) for how to write .pure config files

## API
Install the library using NPM and include it in your code

```bash
npm install --save pure-config
```

```javascript
const PureConfig = require('pure-config');

var config = new PureConfig('path/to/config.pure');
```

You can get and set any value, as well as ask for specific types

```javascript
config.get('server.port'); // Returns the type that the parser found in the .pure file

config.has('server.bind'); // Returns a boolean of whether that value exists or not

config.set('server.port', 8080); // Sets whatever type you give it
config.put('server.port', 80);

config.getString('log.level');  // Returns a string
config.getPath('server.log');   // Returns the string representation of the path
config.getQuantity('bandwidth') // Returns an object: { magnitude: [number], unit: [string] }
config.getInt('my-number')      // Returns round number, or rounds floating points, or tries to coerce other types
config.getDouble('pi')          // Returns a number, or tries to coerce other types
config.getBoolean('isAdmin')    // Returns a boolean, or tries to coerce other types
```
