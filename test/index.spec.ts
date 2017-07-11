import "mocha";
import * as chai from "chai";
import rewire = require("rewire");

const expect = chai.expect;



const index = rewire("../src/index");
const Configuration = index.__get__("Configuration");

declare var __dirname: string;
declare var process: any;
function loadFile(file: string): any
{
	return new Configuration(__dirname + "/samples/" + file);
}

describe("index", () => {
  it("should provide Configuration", () => {
    expect(Configuration).to.not.be.undefined;
  });

  describe("Configuration", () => {
    it("test01", () => {
    	const config = loadFile('test01.pure');
    	expect(config.object, "[parse]").to.deep.equal({ port: 8443, bind: '0.0.0.0' });

        expect(config.get("port"), "[get]").to.equal(8443);
    	config.set('bind', '127.0.0.1');
        expect(config.get('bind'), "[set]").to.equal("127.0.0.1");

        expect(config.object, "[finish]").to.deep.equal({ port: 8443, bind: '127.0.0.1' });
    });
    it("test02", () => {
        const config = loadFile('test02.pure');
    	expect(config.object, "[parse]").to.deep.equal({ server: { port: 8443, bind: '0.0.0.0' }});

        expect(config.get("server.port"), "[get]").to.equal(8443);
    	config.put('server.gateway', '192.168.0.1');
        expect(config.get('server.gateway'), "[put]").to.equal("192.168.0.1");

        expect(config.object, "[finish]").to.deep.equal({
            server: { port: 8443, bind: '0.0.0.0', gateway: '192.168.0.1' }
        });
    });
    it("test03", () => {
        const config = loadFile('test03.pure');
    	expect(config.object, "[parse]").to.deep.equal({ server: { port: 8443, bind: '0.0.0.0' } });
    });
    it("test04", () => {
        const config = loadFile('test04.pure');
    	expect(config.object, "[parse]").to.deep.equal({
    		server: { port: 8443, bind: '0.0.0.0', log: { level: 'debug' } },
    		database: {
    			url: 'something-cool-here',
    			user: 'sys',
    			password: 'something',
    			timeout: { magnitude: 30, unit: 's' },

    			data: { path: '../data', indexed: true },
    			log: { level: 'info' }
    		}
        });

        expect(config.has('database.url'), "[has]").to.be.true;
        expect(config.has('database.URL'), "[case-sensative]").to.be.false;
    });
    it("test05", () => {
        const config = loadFile('test05.pure');
    	expect(config.object, "[parse]").to.deep.equal({
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
    	});
    });
    it("test06", () => {
        const config = loadFile('test06.pure');
    	expect(config.object, "[parse]").to.deep.equal({
            vars: { filename: 'thefile.txt'}, server: { data: 'thefile.txt' }
        });
    });
    it("test07", () => {
        const config = loadFile('test07.pure');
    	expect(config.object, "[parse]").to.deep.equal({
            app: { logfile: `${process.env.HOME}/.logs/myapp.log` }
        });
    });
    it("test08", () => {
        const config = loadFile('test08.pure');
    	expect(config.object, "[parse]").to.deep.equal({
            server: { 'allowed-hosts': [ 'localhost', '127.0.0.1', '192.168.0.1' ] }
        });
    });
    it("test09", () => {
        const config = loadFile('test09.pure');
        const tst: any = {
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

    	expect(config.object, "[parse]").to.deep.equal(tst);
    });
    it("test10", () => {
        const config = loadFile('test10.pure');
    	expect(config.object, "[parse]").to.deep.equal({
            key: '    this value has four spaces in front of it',
    		quotes: '"a quoted string"',
    		'spaces-and-quotes': '    "quoted string with four spaces in front"',
    		backslash: 'c:/program files/my app'
        });
    });
    it("test11", () => {
        const config = loadFile('test11.pure');
    	expect(config.object, "[parse]").to.deep.equal({
            value: 'This is a long property value'
        });
    });
    it("test12", () => {
        const config = loadFile('test12.pure');
    	expect(config.object, "[parse]").to.deep.equal({
            port: 8443,
    		bind: '0.0.0.0',
    		vars : { filename: 'thefile.txt' },
    		server: { data: 'thefile.txt' },
    		log: {
    			filename: 'thefile.txt',
    			log: { level: 'info', filename: 'app.log' }
    		}
        });
    });
  });
});
/*
exports.autotest = function(test) {
	var pureFiles = fs.readdirSync(__dirname + '/samples/auto').filter((file) => file.endsWith('.pure'));
	test.expect(pureFiles.length);

	pureFiles.forEach((filename) => {
		var config = new PureConfig(`${__dirname}/samples/auto/${filename}`);
		var jsonFile = fs.readFileSync(`${__dirname}/samples/auto/${filename.replace(/\.pure$/, '.json')}`, 'utf8');

		console.log(`   testing ${filename}`);
		test.deepEqual(JSON.parse(jsonFile), config._obj, filename);
	});

	test.done();
}
*/
