# Test Files
This directory contains example Pure Config files (most of which are from the [Pure Specification](https://github.com/pureconfig/pureconfig))
The desired output and operation of these are manually tested in [test.js](https://github.com/scott181182/pure-config/blob/master/test.js)

In the `auto` directory there are pure files with matching json files that show the desired structure of the configuration object (taken from the [specification tests](https://github.com/pureconfig/pureconfig/tree/master/tests/success). These are tested without hardcoding the desired output.


To run these tests, install `nodeunit` and run it on `test.js`:
```bash
$ npm install -g nodeunit
$ cd pure-config
$ nodeunit test.js
```