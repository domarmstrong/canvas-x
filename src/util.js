/**
* Inherit from a constructor and extend with properties from properties
*/
export function inherit(parent, constructor, properties) {
    var proto = Object.create(parent.prototype);
    Object.keys(properties).forEach(function (key) {
        proto[key] = properties[key];
    });
    proto.constructor = constructor;
    constructor.prototype = proto;
}

/**
* Extend a with b overwiting properties
*/
export function extend(a, b) {
    Object.keys(b).forEach(function (key) {
        if (b[key] !== undefined) {
            a[key] = b[key];
        }
    });
    return a;
}

/**
 * Extend a classes prototype with a mixin
 */
export function mixin(mixin, Class) {
    var proto = Class.prototype;
    if (typeof mixin === 'function') {
        mixin = mixin();
    } else if (mixin.constructor.name !== 'Object') {
        throw new Error('Unexpected type for mixin: ' + typeof mixin);
    }
    extend(proto, mixin);
};
