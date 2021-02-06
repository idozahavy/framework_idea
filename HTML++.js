var func_pool = {};

// function* generator for yield purpose

/**
 *
 * @param {Element} element
 * @param {*} dict
 */
function InitElement(element, dict) {
  // async initialization of component because they need to be downloaded first
  if (element.tagName.toLocaleLowerCase() === "component") {
    readUrlFile(element.attributes.getNamedItem("src").value).then((html) => {
      element.innerHTML = html;
      element.originalOuterHTML = element.outerHTML;
      ElementAttributesInitialization(element, dict);
      ElementChildrenInitialization(element, dict);
    });
    return;
  }

  element.originalOuterHTML = element.outerHTML;

  ElementAttributesInitialization(element, dict);
  ElementChildrenInitialization(element, dict);
}

function ElementAttributesInitialization(element, dict) {
  element.attrNotesDict = {};
  element.attrReversedNotes = {};

  var idx, attr, attrNotes;
  for (idx = 0; idx < element.attributes.length; idx++) {
    attr = element.attributes[idx];
    attrNotes = getNotes(attr.textContent || attr.value);
    if (attrNotes.length > 0) {
      attr.originalValue = attr.value;
      element.attrNotesDict[attr.name] = attrNotes;
      element.attrReversedNotes[attr.name] = Object.assign([], attrNotes).reverse();
      attr.nodeValue = jsRender(attr.originalValue, element.attrReversedNotes[attr.name], dict, func_pool);
      for (var noteKey in attrNotes) {
        var attrNote = attrNotes[noteKey];
        if (attrNote.type === "variable") {
          reactiveRenderBind(attr, ["value", "nodeValue"], dict, attrNote.name, attrNotes);
        }
      }
    }
  }
}

function ElementChildrenInitialization(element, dict) {
  var child, idx, textNotes;
  for (idx in element.childNodes) {
    child = element.childNodes[idx];

    // child node text
    if (child.nodeType === 3) {
      textNotes = getNotes(child.nodeValue);
      manipulateNotes(textNotes);
      if (textNotes.length > 0) {
        child.textNotes = textNotes;
        child.textReversedNotes = Object.assign([], textNotes).reverse();
        child.originalValue = child.nodeValue;
        child.nodeValue = jsRender(child.originalValue, child.textReversedNotes, dict, func_pool);
        for (var noteIdx in textNotes) {
          var textNote = textNotes[noteIdx];
          if (textNote.type === "variable") {
            reactiveRenderBind(child, ["value", "nodeValue"], dict, textNote.name, textNotes);
          } else if (textNote.type === "function") {
            // all keys bind
            var beforePar = textNote.inner.split('(')[0];
            // if the first thing is the parenthesis
            if (beforePar.trim().length<1){
              var lexerKeys = textNote.inner.split('(')[1].split(')')[0].split(',').map((val)=>val.trim());
              console.log("lexerKeys",lexerKeys);
              for (var keyIdx in lexerKeys) {
                reactiveRenderBind(child, ["value", "nodeValue"], dict, lexerKeys[keyIdx], textNotes);
              }
            }
          }
        }
      }
    } else if (child.nodeName !== "SCRIPT" && child.nodeType === 1) {
      // child node element
      InitElement(child, dict);
    }
  }
}

function reactiveRenderBind(element, element_props, dict, dict_prop, notes, alwaysRender = false) {
  var func = () => {
    // if (alwaysRender || canRender(element.parentNode || element.ownerElement)) {
    element_props.forEach((propName) => {
      element[propName] = jsRender(element.originalValue, notes, dict, func_pool);
    });
    // }
  };
  createReactive(dict, dict_prop, {
    post_setter: func,
  });
}

function canRender(element) {
  if (element.render || element.render == undefined) {
    // check if elements with no parent can exist or/and be showed on screen
    if (element == document || (!element.ownerElement && !element.parentNode)) {
      // if your top or have no parent
      return true;
    }
    return canRender(element.ownerElement || element.parentNode);
  }
  return element.render;
}

// functions initialization

var globalInitText = "for(var key in dict){globalThis[key]=dict[key]} ";

function manipulateNotes(notes) {
  var idx, note, key;
  for (idx in notes) {
    note = notes[idx];
    if (note.type === "function") {
      console.log(note);
      key = makeKey(35);
      while (key in func_pool) key = makeKey(35);
      func_pool[key] = Function("dict", globalInitText + note.inner);
      note.name = key;
    }
  }
}

function makeKey(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// component download text

function insertUrlElementToElement(selector, url) {
  readUrlFile(url).then((html) => {
    var div = document.createElement("div");
    div.innerHTML = html;
    document.querySelector(selector).appendChild(div);
  });
}

async function createElementFromUrl(url) {
  var html = await readUrlFile(url);
  return new Element(html);
}

async function readUrlFile(url) {
  var res = await fetch(url);
  var reader = res.body.getReader();
  var data = await reader.read();
  var byteArray = [];
  while (!data.done) {
    byteArray = concatTypedArrays(byteArray, data.value);
    data = await reader.read();
  }
  return new TextDecoder("utf-8").decode(byteArray);
}

function concatTypedArrays(a, b) {
  // a, b TypedArray of same type
  var c = new b.constructor(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}
