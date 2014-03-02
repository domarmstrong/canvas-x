/**
 * Inherit from a constructor and extend with properties from properties
 */
module.exports.inherit = function inherit(parent, constructor, properties) {
    var proto = Object.create(parent.prototype); 
    Object.keys(properties).forEach(function (key) {
        proto[key] = properties[key]; 
    });
    proto.constructor = constructor;
    constructor.prototype = proto;
};

/**
 * Extend a with b overwiting properties
 */
module.exports.extend = function extend(a, b) {
    Object.keys(b).forEach(function (key) {
        if (b[key] !== undefined) {
            a[key] = b[key];
        }
    });
    return a;
};

/*
 * Return a function for re-exporting modules
 * reexport = util.reexport(module);
 * reexport(require('module')
 */
module.exports.reexport = function reexport(module) {
    return function (mod) {
        if (typeof mod === 'function') {
            if (mod.name) {
                module.exports[name] = mod;
            } else {
                console.error(mod);
                throw new Error('Cannot re-export module as it is an annonymouse function');
            }
        } else {
            Object.keys(mod).forEach(function (key) {
                module.exports[key] = mod[key];
            });
        }
    };
};
