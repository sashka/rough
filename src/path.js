class PathToken {
  constructor(type, text) {
    this.type = type;
    this.text = text;
  }
  isType(type) {
    return this.type === type;
  }
}

class ParsedPath {
  constructor(d) {
    this.PARAMS = {
      A: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
      a: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
      C: ["x1", "y1", "x2", "y2", "x", "y"],
      c: ["x1", "y1", "x2", "y2", "x", "y"],
      H: ["x"],
      h: ["x"],
      L: ["x", "y"],
      l: ["x", "y"],
      M: ["x", "y"],
      m: ["x", "y"],
      Q: ["x1", "y1", "x", "y"],
      q: ["x1", "y1", "x", "y"],
      S: ["x2", "y2", "x", "y"],
      s: ["x2", "y2", "x", "y"],
      T: ["x", "y"],
      t: ["x", "y"],
      V: ["y"],
      v: ["y"],
      Z: [],
      z: []
    };
    this.COMMAND = 0;
    this.NUMBER = 1;
    this.EOD = 2;
    this.segments = [];
    this.d = d || "";
    this.parseData(d);
  }

  parseData(d) {
    var tokens = this.tokenize(d);
    var index = 0;
    var token = tokens[index];
    var mode = "BOD";
    this.segments = new Array();
    while (!token.isType(this.EOD)) {
      var param_length;
      var params = new Array();
      if (mode == "BOD") {
        if (token.text == "M" || token.text == "m") {
          index++;
          param_length = this.PARAMS[token.text].length;
          mode = token.text;
        } else {
          console.error("Path data must begin with a MoveTo command");
          return;
        }
      } else {
        if (token.isType(this.NUMBER)) {
          param_length = this.PARAMS[mode].length;
        } else {
          index++;
          param_length = this.PARAMS[token.text].length;
          mode = token.text;
        }
      }

      if ((index + param_length) < tokens.length) {
        for (var i = index; i < index + param_length; i++) {
          var number = tokens[i];
          if (number.isType(this.NUMBER)) {
            params[params.length] = number.text;
          }
          else {
            console.error("Parameter type is not a number: " + mode + "," + number.text);
            return;
          }
        }
        var segment;
        if (this.PARAMS[mode]) {
          segment = { key: mode, data: params };
        } else {
          console.error("Unsupported segment type: " + mode);
          return;
        }
        this.segments.push(segment);
        index += param_length;
        token = tokens[index];
        if (mode == "M") mode = "L";
        if (mode == "m") mode = "l";
      } else {
        console.error("Path data ended before all parameters were found");
      }
    }
  }

  tokenize(d) {
    var tokens = new Array();
    while (d != "") {
      if (d.match(/^([ \t\r\n,]+)/)) {
        d = d.substr(RegExp.$1.length);
      } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
        tokens[tokens.length] = new PathToken(this.COMMAND, RegExp.$1);
        d = d.substr(RegExp.$1.length);
      } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
        tokens[tokens.length] = new PathToken(this.NUMBER, parseFloat(RegExp.$1));
        d = d.substr(RegExp.$1.length);
      } else {
        console.error("Unrecognized segment command: " + d);
        return null;
      }
    }
    tokens[tokens.length] = new PathToken(this.EOD, null);
    return tokens;
  }
}

export class RoughPath {
  constructor(d) {
    this.d = d;
    this.parsed = new ParsedPath(d);

    this._position = [0, 0];
    this.bezierReflectionPoint = null;
    this.quadReflectionPoint = null;
    this._first = null;
  }

  get segments() {
    return this.parsed.segments;
  }

  get first() {
    return this._first;
  }

  set first(v) {
    this._first = v;
  }

  setPosition(x, y) {
    this._position = [x, y];
    if (!this._first) {
      this._first = [x, y];
    }
  }

  get position() {
    return this._position;
  }

  get x() {
    return this._position[0];
  }

  get y() {
    return this._position[1];
  }
}