/* Luau highlighter.
   Regex-based and deliberately small. It knows three things a generic
   highlighter does not: Luau keywords, Roblox globals, and the executor
   environment's own function names (pulled from the dataset at runtime). */

(function () {
  var KEYWORDS = ("local function end if then else elseif for in while do return break " +
    "continue and or not nil true false repeat until type export").split(" ");

  var ROBLOX = ("game workspace script print warn error pcall xpcall ipairs pairs next " +
    "tostring tonumber typeof type select unpack table string math os task wait spawn " +
    "coroutine Instance Vector2 Vector3 CFrame Color3 UDim2 Enum rawget rawset setmetatable " +
    "getmetatable require newproxy").split(" ");

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function envNames() {
    var out = {};
    var data = window.API_DATA;
    if (!data) return out;
    Object.keys(data.functions).forEach(function (name) {
      // index both `debug.getconstants` and its bare tail, plus namespaces
      out[name] = true;
      var parts = name.split(".");
      if (parts.length === 2) { out[parts[0]] = true; out[parts[1]] = true; }
    });
    return out;
  }

  var ENV = null;

  function highlight(src) {
    if (ENV === null) ENV = envNames();

    var out = "";
    var i = 0;
    var n = src.length;

    while (i < n) {
      var rest = src.slice(i);

      // long comment / long string
      var longCom = rest.match(/^--\[(=*)\[[\s\S]*?\]\1\]/);
      if (longCom) { out += '<span class="tok-com">' + escapeHtml(longCom[0]) + "</span>"; i += longCom[0].length; continue; }

      var lineCom = rest.match(/^--[^\n]*/);
      if (lineCom) { out += '<span class="tok-com">' + escapeHtml(lineCom[0]) + "</span>"; i += lineCom[0].length; continue; }

      var longStr = rest.match(/^\[(=*)\[[\s\S]*?\]\1\]/);
      if (longStr) { out += '<span class="tok-str">' + escapeHtml(longStr[0]) + "</span>"; i += longStr[0].length; continue; }

      var str = rest.match(/^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/);
      if (str) { out += '<span class="tok-str">' + escapeHtml(str[0]) + "</span>"; i += str[0].length; continue; }

      var num = rest.match(/^0[xX][0-9a-fA-F]+|^\d+\.?\d*(?:[eE][+-]?\d+)?/);
      if (num) { out += '<span class="tok-num">' + escapeHtml(num[0]) + "</span>"; i += num[0].length; continue; }

      var word = rest.match(/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?/);
      if (word) {
        var w = word[0];
        var cls = "";
        if (KEYWORDS.indexOf(w) !== -1) cls = "tok-kw";
        else if (ENV[w]) cls = "tok-env";
        else if (ROBLOX.indexOf(w) !== -1 || ROBLOX.indexOf(w.split(".")[0]) !== -1) cls = "tok-gl";
        out += cls ? '<span class="' + cls + '">' + escapeHtml(w) + "</span>" : escapeHtml(w);
        i += w.length;
        continue;
      }

      out += escapeHtml(src[i]);
      i += 1;
    }
    return out;
  }

  window.Luau = { highlight: highlight, escapeHtml: escapeHtml };
})();
