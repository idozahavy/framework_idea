function InitElement(element, dict) {
  var render = element.getAttribute("render");
  element.render = render === null || render == undefined || render.trim().startsWith("{") || !(render == "false" || render == "0");
  element.render = element.render && element.outerHTML.indexOf("{");
  if (!element.render) return element;

  console.log("element", element);

  element.originalOuterHTML = element.outerHTML;
  element.notes = {};
  element.reversedNotes = {};

  var idx, attr, attrNote;
  for (idx = 0; idx < element.attributes.length; idx++) {
    attr = element.attributes[idx];
    attrNote = getNotes(attr.textContent || attr.value);
    if (attrNote.length > 0) {
      attr.originalValue = attr.value;
      element.notes[idx] = attrNote;
      element.reversedNotes[idx] = Object.assign([], attrNote).reverse();
      attr.value = jsRender(attr.originalValue, element.reversedNotes[idx], dict);
    }
  }
  var child, idx, textNotes;
  for (idx in element.childNodes) {
    child = element.childNodes[idx];

    // console.log("child node", child.nodeType, child);
    if (child.nodeType === 3) {
      // child node text
      textNotes = getNotes(child.nodeValue);
      if (textNotes.length > 0) {
        child.notes = textNotes;
        child.reversedNotes = Object.assign([], textNotes).reverse();
        child.originalValue = child.nodeValue;
        console.log("text notes ", textNotes);
				child.nodeValue = jsRender(child.nodeValue, child.textReversedNotes, dict);
        for (var noteIdx in child.notes) {

          reactiveBind(child, "nodeValue", dict, child.notes[noteIdx].name, child.notes);
        }
      }
    } else if (child.nodeName !== "SCRIPT" && child.nodeType === 1) {
      // child node element
      InitElement(child,dict);
    }
  }
}

function reactiveBind(element, element_prop, dict, dict_prop, notes) {
  createReactive(dict, dict_prop, {
    post_setter: (val, propName, object) => {
      var thisDict = {};
			thisDict[propName] = val;
			// console.log("reactive element",element);
			// console.log("reactive element prop",element_prop);
			// console.log("reactive dict", thisDict);
      element[element_prop] = jsRender(element.originalValue, notes, thisDict);
    },
  });
}

function reRenderElement(element, propName) {}
