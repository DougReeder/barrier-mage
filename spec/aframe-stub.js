// aframe-stub.js - allows testing app code that uses A-Frame
// Copyright © 2017–2024 Doug Reeder; Licensed under the GNU GPL-3.0

AFRAME = {
    scenes: [{
        is: () => false,
        emit: () => false,
        appendChild: child => child
    }],

    elementParam: {},   // keyed by name

    registerElement: function (name, param) {
        this.elementParam[name] = param;
    },

    componentParam: {},   // keyed by name

    registerComponent: function (name, param) {
        this.componentParam[name] = param;
    },

    geometryParam: {},   // keyed by name

    registerGeometry: function (name, param) {
        this.geometryParam[name] = param;
    },

    primitiveParam: {},   // keyed by name

    registerPrimitive: function (name, param) {
        this.primitiveParam[name] = param;
    },

    shaderParam: {},   // keyed by name

    registerShader: function (name, param) {
        shaderParam[name] = param;
    },

    stateParam: null,

    registerState: function(param) {
        this.stateParam = param;
    },

    utils: {
        device: {
            isMobile: function () {return false;},
            isMobileVR: function () {return false;},
            isGearVR: function () {return false;},
            checkHeadsetConnected: function () {return false;}
        }
    }
};

class MockComponent {
    playSound() {}
}

class MockElement {
    constructor(attributes) {
        this.components = {};
        if (attributes instanceof Object) {
            this._attributes = attributes;
            for (const attrName of Object.keys(attributes)) {
                if (! ['tagName'].includes(attrName)) {
                    this.components[attrName] = new MockComponent();
                }
            }
        } else {
            this._attributes = {};
        }
        this.object3D = new THREE.Object3D();
        this.removeObject3D = function () {};
        this.parentNode = {
            removeChild: function () {}
        }
        this.classList = [];   // DOMTokenList isn't defined in Node.JS
        this.classList.add = function (token) {
            this.push(token);
        }
    }

    setAttribute(name, value) {
        this._attributes[name] = value;
        this.components[name] = new MockComponent();
        switch (name) {
            case 'position':
                if (value instanceof THREE.Vector3) {
                    this.object3D.position.copy(value);
                }
                break;
        }
    }

    getAttribute(name) {
        return this._attributes[name];
    }

    querySelector(selector) {
        return new MockElement();
    }

    setObject3D() {
    }
}

document = {
    createElement: function (tagName) {
        return new MockElement({tagName: tagName});
    }
};

module.exports = {
    AFRAME: AFRAME,
    MockElement: MockElement
};
