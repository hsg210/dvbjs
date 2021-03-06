'use strict';

var fs = require('fs');
var assert = require('assert');
var mockery = require('mockery');
var bluebird = require('bluebird');
var requestP = require('request-promise');

var dvb;

function mockRequest(filename) {
    before(function (done) {
        var index = 0;

        if (process.env.NODE_ENV && process.env.NODE_ENV.indexOf('live') == -1) {
            mockery.enable({
                warnOnReplace: true,
                warnOnUnregistered: false,
                useCleanCache: true
            });

            mockery.registerMock('request-promise', function (request) {
                var file_path;

                if (filename instanceof Array) {
                    file_path = __dirname + "/data/" + filename[index % filename.length];
                    index++;
                } else {
                    file_path = __dirname + "/data/" + filename;
                }

                if (process.env.NODE_ENV == 'test_update') {
                    return requestP(request).then(function (data) {
                        fs.writeFileSync(file_path, data + "\n", 'utf8');
                        return data;
                    });
                } else {
                    var result = fs.readFileSync(file_path, 'utf8');
                    return bluebird.resolve(result.trim())
                }
            });
        }

        dvb = require('../index');
        done();
    });

    after(function (done) {
        mockery.disable();
        mockery.deregisterAll();
        done();
    });
}

describe('dvb.monitor', function () {

    function assertTransport(transport) {
        assert.strictEqual('string', typeof transport.line);
        assert.strictEqual('string', typeof transport.direction);
        assert(transport.platform);
        assert.strictEqual('number', typeof transport.arrivalTimeRelative);
        assert.strictEqual('object', typeof transport.arrivalTime);
        assert.strictEqual('number', typeof transport.scheduledTimeRelative);
        assert.strictEqual('object', typeof transport.scheduledTime);
        assert.strictEqual('number', typeof transport.delayTime);
        assert(transport.state);
        assert.strictEqual('object', typeof transport.mode);
        assert(transport.diva);
    }

    describe('dvb.monitor "33000037" (Postplatz)', function () {
        mockRequest('monitor-33000037.json');

        it('should return an array with elements', function (done) {
            dvb.monitor(33000037, 10, 5)
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(data.length, 5);
                    done()
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should contain all five fields', function (done) {
            dvb.monitor(33000037, 0, 5)
                .then(function (data) {
                    data.forEach(assertTransport);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should return a Promise but still accept a callback', function () {
            dvb.monitor(33000037, 0, 5, function (err, data) {
                assert(data);
            }).then(assert)
        });
    });

    describe('dvb.monitor "Postplatz"', function () {
        mockRequest(['find-Postplatz.json', 'monitor-33000037.json']);

        it('should return an array with elements', function (done) {
            dvb.monitor('Postplatz', 10, 5)
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(data.length, 5);
                    done()
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should contain all five fields', function (done) {
            dvb.monitor('Postplatz', 0, 5)
                .then(function (data) {
                    data.forEach(assertTransport);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should return a Promise but still accept a callback', function () {
            dvb.monitor('Postplatz', 0, 5, function (err, data) {
                assert(data);
            }).then(assert)
        });
    });

    describe('dvb.monitor "xyz"', function () {
        mockRequest('monitor-xyz.json');

        it('should return an empty array', function (done) {
            dvb.monitor('xyz', 0, 5)
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(data.length, 0);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    })
});

describe('dvb.find', function () {
    describe('dvb.find "Postplatz"', function () {
        mockRequest('find-Postpl.json');

        function assertStop(stop) {
            assert(stop.stop);
            assert(stop.id);
            assert(stop.city);
            assert(Array.isArray(stop.coords));
            assert.strictEqual(2, stop.coords.length);
        }

        it('should return an array', function (done) {
            dvb.find('Postpl')
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert(data.length > 0);
                    data.forEach(assertStop);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should find the correct stop', function (done) {
            dvb.find('Postpl')
                .then(function (data) {
                    assert.strictEqual('Postplatz', data[0].stop);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should return a Promise but still accept a callback', function (done) {
            dvb.find('Postpl', function (err, data) {
                assert(data);
                done();
            }).then(assert);
        });
    });

    describe('dvb.find "0"', function () {
        mockRequest('find-0.json');

        it('should return an empty array', function (done) {
            dvb.find('0')
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(data.length, 0);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

    describe('dvb.find "xyz"', function () {
        mockRequest('find-xyz.json');

        it('should return an empty array', function (done) {
            dvb.find('xyz')
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(data.length, 0);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    })
});

describe('dvb.pins', function () {
    describe('dvb.pins "51.026578, 13.713899, 51.035565, 13.737974, stop"', function () {
        mockRequest('pins-stop.json');

        it('should resolve into an array', function (done) {
            dvb.pins(51.026578, 13.713899, 51.035565, 13.737974, 'stop')
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.notEqual(0, data.length);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should contain objects with id, name, coords and connections', function (done) {
            dvb.pins(51.026578, 13.713899, 51.035565, 13.737974, 'stop')
                .then(function (data) {
                    data.forEach(function (elem) {
                        assert(elem.id);
                        assert(elem.name);
                        assert(elem.coords);
                        assert.strictEqual(2, elem.coords.length);
                        assert.strictEqual(13, Math.floor(elem.coords[1]));
                        assert.strictEqual(51, Math.floor(elem.coords[0]));
                        assert.strictEqual(13, Math.floor(elem.coords[1]));
                        assert(Array.isArray(elem.connections));
                        elem.connections.forEach(function (con) {
                            assert(con.line);
                            assert(con.type);
                        });
                    });
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should return a Promise but still accept a callback', function (done) {
            dvb.pins(51.026578, 13.713899, 51.035565, 13.737974, 'stop', function (err, data) {
                assert(data);
                done();
            }).then(assert);
        });
    });

    describe('dvb.pins "51.026578, 13.713899, 51.035565, 13.737974, platform"', function () {
        mockRequest('pins-platform.json');

        it('should contain objects with name, coords and platform_nr', function (done) {
            dvb.pins(51.026578, 13.713899, 51.035565, 13.737974, 'platform')
                .then(function (data) {
                    assert.notEqual(0, data.length);
                    data.forEach(function (elem) {
                        assert(elem.name);
                        assert(elem.coords);
                        assert.strictEqual(2, elem.coords.length);
                        assert.strictEqual(13, Math.floor(elem.coords[1]));
                        assert.strictEqual(51, Math.floor(elem.coords[0]));
                        assert(elem.platform_nr);
                    });
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

    describe('dvb.pins "51.026578, 13.713899, 51.035565, 13.737974, POI"', function () {
        mockRequest('pins-poi.json');

        it('should contain objects with name, coords and id', function (done) {
            dvb.pins(51.026578, 13.713899, 51.035565, 13.737974, dvb.pins.type.POI)
                .then(function (data) {
                    assert.notEqual(0, data.length);
                    data.forEach(function (elem) {
                        assert(elem.id);
                        assert(elem.name);
                        assert(elem.coords);
                        assert.strictEqual(2, elem.coords.length);
                        assert.strictEqual(13, Math.floor(elem.coords[1]));
                        assert.strictEqual(51, Math.floor(elem.coords[0]));
                    });
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

    describe('dvb.pins "0, 0, 0, 0, stop"', function () {
        mockRequest('pins-empty.json');

        it('should resolve into an empty array', function (done) {
            dvb.pins(0, 0, 0, 0, dvb.pins.type.STOP)
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(0, data.length);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
});

describe('dvb.address', function () {
    describe('dvb.address "51.025451, 13.722943"', function () {
        mockRequest('address-51-13.json');

        it('should resolve into an object with city and address properties', function (done) {
            dvb.address(51.025451, 13.722943)
                .then(function (data) {
                    assert.strictEqual("Nöthnitzer Straße 46", data.address);
                    assert.strictEqual("Dresden", data.city);
                    done()
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should return a Promise but still accept a callback', function (done) {
            dvb.address(51.025451, 13.722943, function (err, data) {
                assert(data);
                done();
            }).then(assert);
        });
    });

    describe('dvb.address "0, 0"', function () {
        mockRequest('address-0.json');

        it('should return null', function (done) {
            dvb.address(0, 0)
                .then(function (data) {
                    assert.equal(null, data);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
});

describe('dvb.coords', function () {
    describe('dvb.coords "33000755"', function () {
        mockRequest('coords-33000755.json');

        it('should resolve into a coordinate array [lat, lng]', function (done) {
            dvb.coords('33000755')
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.equal(data.length, 2);
                    assert.strictEqual(13, Math.floor(data[1]));
                    assert.strictEqual(51, Math.floor(data[0]));
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should return a Promise but still accept a callback', function (done) {
            dvb.coords('33000755', function (err, data) {
                assert(data);
                done();
            }).then(assert);
        });
    });

    describe('dvb.coords "123"', function () {
        mockRequest('coords-123.json');

        it('should return null', function (done) {
            dvb.coords("123")
                .then(function (data) {
                    assert.equal(null, data);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
});

describe('dvb.coords for id from dvb.pins', function () {

    var pins = [];

    describe('dvb.pins "51.026578, 13.713899, 51.035565, 13.737974, POI"', function () {
        mockRequest('pins-poi.json');

        it('should contain objects with name, coords and id', function (done) {
            dvb.pins(51.026578, 13.713899, 51.035565, 13.737974, dvb.pins.type.POI)
                .then(function (data) {
                    assert(Array.isArray(data));
                    assert.notEqual(0, data.length);
                    data.forEach(function (elem) {
                        assert(elem.id);
                        assert(elem.name);
                        assert(elem.coords);
                        assert.strictEqual(2, elem.coords.length);
                        assert.strictEqual(13, Math.floor(elem.coords[1]));
                        assert.strictEqual(51, Math.floor(elem.coords[0]));
                    });
                    pins = data;
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

    describe('dvb.coords should be equal to first pin coords', function () {
        mockRequest('coords-poi.json');

        it('coordinates should be equal', function (done) {
            dvb.coords(pins[0].id)
                .then(function (coords) {
                    assert.deepEqual(coords, pins[0].coords);
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
});

describe('internal utils', function () {
    var utils = require('../lib/utils');

    describe('parseMode', function () {
        it('should identify correct values as `Straßenbahn`', function (done) {
            assert.equal(utils.parseMode('3').title, 'Straßenbahn');
            assert.equal(utils.parseMode('11').title, 'Straßenbahn');
            assert.equal(utils.parseMode('59').title, 'Straßenbahn');
            assert.equal(utils.parseMode('E8').title, 'Straßenbahn');
            assert.equal(utils.parseMode('E11').title, 'Straßenbahn');
            assert.notEqual(utils.parseMode('85').title, 'Straßenbahn');
            done();
        });

        it('should identify correct values as `Stadtbus`', function (done) {
            assert.equal(utils.parseMode('85').title, 'Stadtbus');
            assert.equal(utils.parseMode('99').title, 'Stadtbus');
            assert.equal(utils.parseMode('60').title, 'Stadtbus');
            assert.equal(utils.parseMode('E75').title, 'Stadtbus');
            assert.notEqual(utils.parseMode('100').title, 'Stadtbus');
            done();
        });

        it('should identify correct values as `Regionalbus`', function (done) {
            assert.equal(utils.parseMode('366').title, 'Regionalbus');
            assert.equal(utils.parseMode('999').title, 'Regionalbus');
            assert.equal(utils.parseMode('100').title, 'Regionalbus');
            assert.equal(utils.parseMode('A').title, 'Regionalbus');
            assert.equal(utils.parseMode('Z').title, 'Regionalbus');
            assert.equal(utils.parseMode('G/L').title, 'Regionalbus');
            assert.equal(utils.parseMode('H/S').title, 'Regionalbus');
            assert.notEqual(utils.parseMode('85').title, 'Regionalbus');
            done();
        });

        it('should identify correct values as `Seil-/Schwebebahn`', function (done) {
            assert.equal(utils.parseMode('SWB').title, 'Seil-/Schwebebahn');
            assert.notEqual(utils.parseMode('85').title, 'Seil-/Schwebebahn');
            done();
        });

        it('should identify correct values as `Fähre`', function (done) {
            assert.equal(utils.parseMode('F7').title, 'Fähre');
            assert.equal(utils.parseMode('F14').title, 'Fähre');
            assert.notEqual(utils.parseMode('85').title, 'Fähre');
            done();
        });

        it('should identify correct values as `Zug`', function (done) {
            assert.equal(utils.parseMode('ICE 1717').title, 'Zug');
            assert.equal(utils.parseMode('IC 1717').title, 'Zug');
            assert.equal(utils.parseMode('RB 1717').title, 'Zug');
            assert.equal(utils.parseMode('TLX 1717').title, 'Zug');
            assert.equal(utils.parseMode('SB33').title, 'Zug'); // Sächsische Städtebahn
            assert.equal(utils.parseMode('SE19').title, 'Zug'); // Wintersport Express o.O
            assert.equal(utils.parseMode('U28').title, 'Zug'); // Bad Schandau -> Děčín
            assert.notEqual(utils.parseMode('S 1717').title, 'Zug');
            done();
        });

        it('should identify correct values as `S-Bahn`', function (done) {
            assert.equal(utils.parseMode('S3').title, 'S-Bahn');
            assert.equal(utils.parseMode('S 1717').title, 'S-Bahn');
            assert.notEqual(utils.parseMode('IC 1717').title, 'S-Bahn');
            assert.notEqual(utils.parseMode('RB 1717').title, 'S-Bahn');
            done();
        });

        it('should identify correct values as `Rufbus`', function (done) {
            assert.equal(utils.parseMode('alita').title, 'Anrufsammeltaxi (AST)/ Rufbus');
            assert.equal(utils.parseMode('alita 95').title, 'Anrufsammeltaxi (AST)/ Rufbus');
            assert.notEqual(utils.parseMode('85').title, 'Anrufsammeltaxi (AST)/ Rufbus');
            done();
        });

        it('should fail with undefined', function (done) {
            assert.strictEqual(utils.parseMode('Lorem Ipsum'), undefined);
            done();
        })
    });
});
