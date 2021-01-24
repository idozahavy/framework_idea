"use strict";

function objectPropFunc(value, property_name = "", object = {}) {}
function objectPropFuncPredicate(newValue, oldValue, property_name = "", object = {}) {
  return false;
}
function objectPropFuncGetter(value, property_name = "", object = {}) {
  return {};
}

function createObjectPropSetterFunc(store, prop_name, object) {
  var func = function (value) {
    if (store[prop_name].pre_setter_array.length > 0) {
      if (predicateArray4Args(store[prop_name].pre_setter_array,value, store[prop_name].value, prop_name, this) === false) {
        return;
      }
    }
    store[prop_name].value = value;
    if (store[prop_name].post_setter_array.length > 0) {
      funcArray3Args(store[prop_name].post_setter_array, store[prop_name].value, prop_name, this);
    }
  };
  func.bind(object);
  return func;
}

function createObjectPropGetterFunc(store, prop_name, object) {
  var func = function () {
    if (store[prop_name].pre_getter_array.length > 0) {
      funcArray3Args(store[prop_name].pre_getter_array, store[prop_name].value, prop_name, this);
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

  if (!object.__vm_store[property_name]) {
    // first time initialization for property name

    object.__vm_store[property_name] = {
      value: object[property_name],
      pre_setter_array: [],
      pre_getter_array: [],
      post_setter_array: [],
    }
    object.__vm_store[property_name].set = createObjectPropSetterFunc(object.__vm_store, property_name, object);
    object.__vm_store[property_name].get = createObjectPropGetterFunc(object.__vm_store, property_name, object);

    Object.defineProperty(object, property_name, {
      set: object.__vm_store[property_name].set,
      get: object.__vm_store[property_name].get,
      enumerable: true,
      configurable: true,
    });
  }
  if (methods.getter) object.__vm_store[property_name].getter = methods.getter;
  if (methods.pre_setter) object.__vm_store[property_name].pre_setter_array.push(methods.pre_setter);
  if (methods.post_setter) object.__vm_store[property_name].post_setter_array.push(methods.post_setter);
  if (methods.pre_getter) object.__vm_store[property_name].pre_getter_array.push(methods.pre_getter);

  return object;
}

function predicateArray4Args(array, arg0, arg1, arg2, arg3) {
  return array.reduce((result, value) => value(arg0, arg1, arg2,arg3)!==false && result, true);
}

function funcArray3Args(array, arg0, arg1, arg2) {
  var idx;
  for (idx in array) {
    array[idx](arg0, arg1, arg2);
  }
}
