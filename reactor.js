"use strict";

function objectPropFunc(value, property_name = "", object = {}) {}
function objectPropFuncPredicate(value, property_name = "", object = {}) {
  return false;
}
function objectPropFuncGetter(value, property_name = "", object = {}) {
  return {};
}

function createObjectPropSetterFunc(store, prop_name, object) {
  var func = function (value) {
    if (store[prop_name].pre_setter) {
      if (store[prop_name].pre_setter(store[prop_name].value, prop_name, this) === false) {
        return;
      }
    }
    store[prop_name].value = value;
    if (store[prop_name].post_setter) {
      store[prop_name].post_setter(store[prop_name].value, prop_name, this);
    }
  };
  func.bind(object);
  return func;
}

function createObjectPropGetterFunc(store, prop_name, object) {
  var func = function () {
    if (store[prop_name].pre_getter) {
      store[prop_name].pre_getter(store[prop_name].value, prop_name, this);
    }
    if (store[prop_name].getter) {
      return store[prop_name].getter(store[prop_name].value, prop_name, this);
    }
    return store[prop_name].value;
  };
  func.bind(object);
  return func;
}

/*module.exports.createReactive =*/
function createReactive(
  object,
  property_name = "",
  methods = {
    pre_setter: objectPropFuncPredicate,
    post_setter: objectPropFunc,
    pre_getter: objectPropFunc,
    getter: objectPropFuncGetter,
  },
) {
  if (!object.__vm_store) Object.defineProperty(object, "__vm_store", {value: {}, enumerable: false, configurable: false});
  object.__vm_store[property_name] = {
    value: object[property_name],
    pre_setter: methods.pre_setter,
    pre_getter: methods.pre_getter,
    getter: methods.getter,
    post_setter: methods.post_setter,
    set: createObjectPropSetterFunc(object.__vm_store, property_name, object),
    get: createObjectPropGetterFunc(object.__vm_store, property_name, object),
  };

  Object.defineProperty(object, property_name, {
    set: object.__vm_store[property_name].set,
    get: object.__vm_store[property_name].get,
    enumerable: true,
    configurable: true,
  });
  return object;
};
