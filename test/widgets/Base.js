var assert = require('chai').assert;
require('traceur');
var Base = require('../../lib/main').ui.Base;

describe('Base', function () {
    it('should be return a new instance when called with new', function () {
        var base = new Base();
        assert(base instanceof Base);
    });
    it('should extend its state with passed in props', function () {
        var base = new Base();
        assert.deepEqual(base.state, {'bound': null});
        var base = new Base({'extend': true});
        assert.deepEqual(base.state, {'bound': null, 'extend': true});
        var base = new Base({'bound': true});
        assert.deepEqual(base.state, {'bound': true});
    });
});
