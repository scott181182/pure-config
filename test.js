const fs = require('fs');

const PureConfig = require('./index');

if(process.argv.length == 2) {
	var config = loadFile('test03.pure');
}

function loadFile(file)
{
	return new PureConfig(__dirname + '/samples/' + file);
}

exports.test01 = function(test) {
	test.expect(4);
	
	var config = loadFile('test01.pure');
	test.deepEqual({ port: 8443, bind: '0.0.0.0' }, config._obj);

	test.strictEqual(8443, config.get('port'));
	config.set('bind', '127.0.0.1');
	test.strictEqual('127.0.0.1', config.get('bind'));

	test.deepEqual({ port: 8443, bind: '127.0.0.1' }, config._obj);
	test.done();
}
exports.test02 = function(test) {
	test.expect(4);

	var config = loadFile('test02.pure');
	test.deepEqual({ server: { port: 8443, bind: '0.0.0.0' } }, config._obj);

	test.strictEqual('8443', config.getString('server.port'));
	config.put('server.gateway', '192.168.0.1');
	test.strictEqual('192.168.0.1', config.get('server.gateway'));

	test.deepEqual({ server: { port: 8443, bind: '0.0.0.0', gateway: '192.168.0.1' } }, config._obj);
	test.done();
}
exports.test03 = function(test) {
	var config = loadFile('test03.pure');
	test.deepEqual({ server: { port: 8443, bind: '0.0.0.0' } }, config._obj);
	test.done();
}
exports.test04 = function(test) {
	test.expect(3);

	var config = loadFile('test04.pure');
	test.deepEqual({
		server: { port: 8443, bind: '0.0.0.0', log: { level: 'debug' } },
		database: {
			url: 'something-cool-here',
			user: 'sys',
			password: 'something',
			timeout: { magnitude: 30, unit: 's' },

			data: { path: '../data', indexed: true },
			log: { level: 'info' }
		}
	}, config._obj);

	test.strictEqual(true, config.has('database.url'));
	test.strictEqual(false, config.has('database.URL'));

	test.done();
}
exports.test05 = function(test) {
	var config = loadFile('test05.pure');
	test.deepEqual({
		shared: {
			log: {
				filename: 'server.log',
				rolling: true,
				'keep-count': 10,
				'max-size': { magnitude: 50, unit: 'MB' }
			}
		},
		server: {
			log: {
				filename: 'server.log',
				rolling: true,
				'keep-count': 10,
				'max-size': { magnitude: 10, unit: 'MB' },
				'date-format': 'yyyy-mm-dd'
			}
		},
		database: {
			log: {
				filename: 'db.log',
				rolling: true,
				'keep-count': 10,
				'max-size': { magnitude: 50, unit: 'MB' }
			}
		}
	}, config._obj);
	test.done();
}
exports.test06 = function(test) {
	var config = loadFile('test06.pure');
	test.deepEqual({ vars: { filename: 'thefile.txt'}, server: { data: 'thefile.txt' } }, config._obj);
	test.done();
}
exports.test07 = function(test) {
	var config = loadFile('test07.pure');
	test.deepEqual({ app: { logfile: `${process.env.HOME}/.logs/myapp.log` } }, config._obj);
	test.done();
}
exports.test08 = function(test) {
	var config = loadFile('test08.pure');
	test.deepEqual({ server: { 'allowed-hosts': [ 'localhost', '127.0.0.1', '192.168.0.1' ] } }, config._obj);
	test.done();
}
exports.test09 = function(test) {
	var config = loadFile('test09.pure');
	var tst = {
		servers: [
			{
				host: '1.2.3.4',
				port: 8443,
				datadir: './data',
				log: { level: 'trace' }
			},
			{
				host: '1.2.3.5',
				port: 8443,
				datadir: './data',
				log: { level: 'info' }
			},
			{
				host: '1.2.3.6',
				port: 9931
			}
		]
	};
	tst.servers['app-1'] = tst.servers[0];
	tst.servers['app-2'] = tst.servers[1];
	tst.servers['dbserver'] = tst.servers[2];
	test.deepEqual(tst, config._obj);
	test.done();
}
exports.test10 = function(test) {
	var config = loadFile('test10.pure');
	test.deepEqual({
		key: '    this value has four spaces in front of it',
		quotes: '"a quoted string"',
		'spaces-and-quotes': '    "quoted string with four spaces in front"',
		backslash: 'c:/program files/my app'
	}, config._obj);
	test.done();
}
exports.test11 = function(test) {
	var config = loadFile('test11.pure');
	test.deepEqual({ value: 'This is a long property value' }, config._obj);
	test.done();
}
exports.test12 = function(test) {
	var config = loadFile('test12.pure');
	test.deepEqual({
		port: 8443,
		bind: '0.0.0.0',
		vars : { filename: 'thefile.txt' },
		server: { data: 'thefile.txt' },
		log: {
			filename: 'thefile.txt',
			log: { level: 'info', filename: 'app.log' }
		}
	}, config._obj);
	test.done();
}
