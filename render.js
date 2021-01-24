function jsRender(origin, reversedNotes, dict = {}, func_dict = {}) {
  var rendered = origin;
  var note, replacement;
  for (idx in reversedNotes) {
    note = reversedNotes[idx];
    replacement = "";
    switch (note.type) {
      case "variable":
        {
          if (note.name in dict && dict[note.name] !== undefined) replacement = dict[note.name];
          // console.log(dict,note.name, dict[note.name]);
          rendered = rendered.substring(0, note.start) + replacement + rendered.substring(note.end + 1, rendered.length);
        }
        break;
      case "function":
        {
          if (note.name in func_dict) {
            rendered = rendered.substring(0, note.start) + func_dict[note.name](dict) + rendered.substring(note.end + 1, rendered.length);
          } else {
            rendered = rendered.substring(0, note.start) + rendered.substring(note.end + 1, rendered.length);
          }
        }
        break;
    }
  }
  return rendered;
}

function getNotes(origin = "") {
  var placements = [];
  var start = origin.indexOf("{");
  var end = indexOfClosing(origin, start + 1);
  var inner, type;
  while (start !== -1 && end !== -1) {
    // if start and end are correct, adds to placements
    inner = origin.substring(start + 1, end).trim();
    type = getNoteType(inner);
    placements.push({
      outer: origin.substring(start, end + 1),
      inner: inner,
      type: type,
      name: getNoteName(inner, type),
      start: start,
      end: end,
    });

    // get next note and repeat
    start = origin.indexOf("{", end);
    end = indexOfClosing(origin, start + 1);
  }
  return placements;
}

/**
 * tested, finds the the closing char starting from, 'start'.
 * @param {string} origin
 * @param {int} start
 */
function indexOfClosing(origin, start, openingChar = "{", closingChar = "}") {
  var nextOpening = origin.indexOf(openingChar, start);
  var nextClosing = origin.indexOf(closingChar, start);
  while (nextOpening != -1 && nextOpening < nextClosing) {
    nextOpening = origin.indexOf(openingChar, nextOpening + 1);
    nextClosing = origin.indexOf(closingChar, nextClosing + 1);
  }
  return nextClosing;
}

/**
 * find the note type, if starting with '{' it is a variable else its a function.
 * @param {string} inner
 */
function getNoteType(inner) {
  if (inner.startsWith("{")) {
    return "variable";
  }
  return "function";
}

/**
 *
 * @param {string} inner
 * @param {string} type
 */
function getNoteName(inner, type) {
  switch (type) {
    case "variable":
      return inner.substring(1, inner.length - 1).trim();
    case "function":
      return inner.substring(1, inner.indexOf("(")).trim();
  }
}

// module.exports.jsRender = jsRender;
// module.exports.getNotes = getNotes;

// console.log(module);

// var text = `<div render="{{name}}">
// my name is {{ name }} {{lname}}
// </div>`;
// var notes = getNotes(text);

// var start_time = new Date().getTime();
// for (var i = 0; i < 4_000_000; i++) {
//   notes = getNotes(text);
// }
// var end_time = new Date().getTime();
// console.log("notes 4mil milliseconds", end_time - start_time);

// var output = "";

// var reversedNotes = Object.assign([], notes).reverse();

// start_time = new Date().getTime();
// for (var i = 0; i < 4_000_000; i++) {
//   output = jsRender(text, reversedNotes, {name: "ido", lname:"zahavy"});
// }
// end_time = new Date().getTime();
// console.log("jsRender 4mil milliseconds", end_time - start_time);

// console.log("output", output);
