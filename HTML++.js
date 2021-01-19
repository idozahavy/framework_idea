function InitElement(element, dict, parentRenders = true) {
  var render = element.getAttribute("render");
  element.render = render === null || render == undefined || render.trim().startsWith("{") || !(render == "false" || render == "0");

  console.log("element", element);

  element.originalOuterHTML = element.outerHTML;
  element.attrNotesDict = {};
  element.attrReversedNotes = {};

  var idx, attr, attrNote;
  for (idx = 0; idx < element.attributes.length; idx++) {
    attr = element.attributes[idx];
    console.log("attr",attr);
    attrNotes = getNotes(attr.textContent || attr.value);
    if (attrNotes.length > 0) {
      attr.originalValue = attr.value;
      element.attrNotesDict[attr.name] = attrNotes;
      element.attrReversedNotes[attr.name] = Object.assign([], attrNote).reverse();
      if (parentRenders){
        if (attr.name === "render"){ // renders the render attribute to see if needs to be rendered
          attr.value = jsRender(attr.originalValue, element.attrReversedNotes[attr.name], dict);
          createReactive(attr,"value",{pre_setter:(newValue) => {element.render = newValue=="true";console.log("render value changed",element, newValue=="true");}} )
          console.log("render attr notes", attrNotes);
          for (var noteKey in attrNotes) {
            reactiveRenderBind(attr,["value","nodeValue"],dict,attrNotes[noteKey].name,attrNotes,true);
          }
        }
        else if (element.render){
          attr.value = jsRender(attr.originalValue, element.attrReversedNotes[attr.name], dict);
          for (var noteKey in attrNotes) {
            reactiveRenderBind(attr,["value","nodeValue"],dict,attrNotes[noteKey].name,attrNotes);
          }
        }
      }
    }
  }
  var child, idx, textNotes;
  for (idx in element.childNodes) {
    child = element.childNodes[idx];

    // child node text
    if (child.nodeType === 3) {
      textNotes = getNotes(child.nodeValue);
      if (textNotes.length > 0) {
        child.notes = textNotes;
        child.reversedNotes = Object.assign([], textNotes).reverse();
        child.originalValue = child.nodeValue;
        console.log("text notes ", textNotes);
        if (parentRenders && element.render){
          child.nodeValue = jsRender(child.nodeValue, child.textReversedNotes, dict);
          for (var noteIdx in child.notes) {
            reactiveRenderBind(child, ["value","nodeValue"], dict, child.notes[noteIdx].name, child.notes);
          }
        }
      }
    } else if (child.nodeName !== "SCRIPT" && child.nodeType === 1) {
      // child node element
      InitElement(child,dict, element.render);
    }
  }
}

function reactiveRenderBind(element, element_props, dict, dict_prop, notes, alwaysRender = false) {
  var func = () => {
    console.log("tries rendering", element, (element.parentNode||element.ownerElement));
    if (alwaysRender || canRender(element.parentNode||element.ownerElement)) {
      console.log("is rendering",element_props, jsRender(element.originalValue, notes, dict));
      element_props.forEach((propName)=> {
        element[propName] = jsRender(element.originalValue, notes, dict);
      })
    }
  };
  createReactive(dict, dict_prop, {
    post_setter: func,
  });
}

function canRender(element){
  if (element.render || element.render == undefined){
    // check if elements with no parent can exist or/and be showed on screen
    if (element == document || (!element.ownerElement && !element.parentNode)){
      // if your top or have no parent
      return true;
    }
    return canRender((element.ownerElement || element.parentNode))
  }
  console.log("cant render, stopped at",element);
  return element.render;
}
