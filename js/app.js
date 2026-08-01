/* Application shell: routing, rendering, filtering.
   No framework, no build step. Data comes from window.API_DATA. */

(function () {
  "use strict";

  var DATA = window.API_DATA;
  var main = document.getElementById("main");
  var searchInput = document.getElementById("search");
  var resultsBox = document.getElementById("results");
  var sidebar = document.getElementById("sidebar");
  var navToggle = document.getElementById("navtoggle");

  if (!DATA) {
    main.innerHTML = "<h1>Data did not load</h1><p>data/api.js is missing or failed to parse. " +
      "The site needs it to render anything; check that the folder was unzipped intact.</p>";
    return;
  }

  var ALL = Object.keys(DATA.functions).map(function (k) { return DATA.functions[k]; });
  var LABEL = { "both": "In both", "sunc-only": "sUNC only", "potassium-only": "Potassium only" };

  /* ---------------------------------------------------------- filters */

  var filters = ["both", "sunc-only", "potassium-only"];

  function readFilters() {
    filters = [];
    document.querySelectorAll("[data-avail]").forEach(function (box) {
      if (box.checked) filters.push(box.getAttribute("data-avail"));
    });
    render();
  }
  document.querySelectorAll("[data-avail]").forEach(function (box) {
    box.addEventListener("change", readFilters);
  });

  function visible(list) {
    return list.filter(function (e) { return filters.indexOf(e.availability) !== -1; });
  }

  /* ---------------------------------------------------------- helpers */

  function esc(s) { return window.Luau.escapeHtml(String(s == null ? "" : s)); }

  function availChip(a) {
    return '<span class="avail ' + a + '">' + LABEL[a] + "</span>";
  }

  function code(src) {
    return '<div class="codewrap"><pre><code>' + window.Luau.highlight(src) +
           '</code></pre><button class="copy" type="button" data-code="' +
           esc(src).replace(/"/g, "&quot;") + '">Copy</button></div>';
  }

  function fnLink(name) {
    var e = DATA.functions[name];
    if (!e) return '<span class="chip">' + esc(name) + "</span>";
    return '<a class="chip" href="#/fn/' + encodeURIComponent(name) + '">' + esc(name) + "</a>";
  }

  function inlineMarkdown(text) {
    // deliberately tiny: `code`, **bold**, [text](url)
    return esc(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
  }

  function paragraphs(body) {
    return body.trim().split(/\n\s*\n/).map(function (p) {
      return "<p>" + inlineMarkdown(p.trim()) + "</p>";
    }).join("");
  }

  /* ---------------------------------------------------------- navigation */

  function buildNav() {
    var conceptNav = document.getElementById("conceptnav");
    conceptNav.innerHTML = DATA.concepts.map(function (c) {
      return '<li><a href="#/concept/' + c.slug + '" data-route="#/concept/' + c.slug + '">' +
             esc(c.title) + "</a></li>";
    }).join("");

    var libNav = document.getElementById("libnav");
    libNav.innerHTML = DATA.libraries.map(function (l) {
      return '<li><a href="#/library/' + encodeURIComponent(l.name) + '" data-route="#/library/' +
             encodeURIComponent(l.name) + '"><span>' + esc(l.name) +
             '</span><span class="count">' + l.functions.length + "</span></a></li>";
    }).join("");
  }

  function markActive() {
    var hash = location.hash || "#/";
    document.querySelectorAll("[data-route]").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("data-route") === hash);
    });
  }

  /* ---------------------------------------------------------- views */

  function viewHome() {
    var c = DATA.counts;
    var shown = visible(ALL);

    var cells = shown.map(function (e) {
      return '<a class="cell" data-a="' + e.availability + '" href="#/fn/' +
             encodeURIComponent(e.name) + '" title="' + esc(e.name) + " — " + LABEL[e.availability] +
             '" aria-label="' + esc(e.name) + '"></a>';
    }).join("");

    return '' +
      "<h1>The executor environment, explained</h1>" +
      '<p class="lede">Every function Roblox does not give you: what it does, why it exists, ' +
      "and whether you can rely on it outside one executor. " + c.total +
      " functions across " + DATA.libraries.length + " libraries, each labelled with where it works.</p>" +

      '<div class="matrix-head">' +
        "<h2 style=\"margin:2rem 0 0\">Coverage</h2>" +
        '<span class="dim" style="font-size:.8rem">' + shown.length + " of " + c.total + " shown</span>" +
      "</div>" +
      '<div class="matrix">' + cells + "</div>" +
      '<div class="matrix-legend">' +
        '<span><span class="dot both"></span>' + c.both + " in both — portable</span>" +
        '<span><span class="dot sunc"></span>' + c.sunc_only + " sUNC only</span>" +
        '<span><span class="dot pts"></span>' + c.potassium_only + " Potassium only — not portable</span>" +
      "</div>" +

      "<h2>Start here</h2>" +
      '<p class="dim" style="font-size:.86rem">Ten pages that explain the ideas the function reference assumes you already have.</p>' +
      '<div class="cards">' + DATA.concepts.map(function (con) {
        return '<a class="card" href="#/concept/' + con.slug + '"><h3>' + esc(con.title) +
               "</h3><p>" + esc(con.lede) + "</p></a>";
      }).join("") + "</div>" +

      "<h2>Libraries</h2>" +
      '<div class="cards">' + DATA.libraries.map(function (l) {
        var count = visible(l.functions.map(function (n) { return DATA.functions[n]; })).length;
        return '<a class="card" href="#/library/' + encodeURIComponent(l.name) + '"><h3>' +
               esc(l.name) + ' <span class="dim" style="font-family:var(--mono);font-size:.75rem">' +
               count + "</span></h3><p>" + esc(l.blurb) + "</p></a>";
      }).join("") + "</div>";
  }

  function viewLibrary(name) {
    var lib = DATA.libraries.filter(function (l) { return l.name === name; })[0];
    if (!lib) return "<h1>No such library</h1><p>Nothing is registered under that name. " +
                     '<a href="#/">Back to the index</a>.</p>';

    var fns = visible(lib.functions.map(function (n) { return DATA.functions[n]; }));

    var rows = fns.length ? fns.map(function (e) {
      return "<li><a class=\"fnrow\" href=\"#/fn/" + encodeURIComponent(e.name) + '">' +
             '<span class="n">' + esc(e.name) + "</span>" +
             '<span class="s">' + esc(e.summary) + "</span>" +
             availChip(e.availability) + "</a></li>";
    }).join("") : '<li class="result-empty">Every function here is hidden by the current availability filter.</li>';

    return '<p class="crumb"><a href="#/">Index</a> / Library</p>' +
           "<h1>" + esc(lib.name) + "</h1>" +
           '<p class="lede">' + esc(lib.blurb) + "</p>" +
           '<ul class="fnlist">' + rows + "</ul>";
  }

  function viewFunction(name) {
    var e = DATA.functions[name];
    if (!e) return "<h1>Not documented</h1><p>No entry named <code>" + esc(name) +
                   '</code>. Try the search, or <a href="#/">start from the index</a>.</p>';

    var html = '<p class="crumb"><a href="#/">Index</a> / <a href="#/library/' +
               encodeURIComponent(e.library) + '">' + esc(e.library) + "</a></p>" +
               '<div class="fnhead"><h1>' + esc(e.name) + "</h1>" + availChip(e.availability) + "</div>" +
               '<p class="lede">' + inlineMarkdown(e.summary) + "</p>";

    if (e.signature) html += '<div class="sig">' + window.Luau.highlight(e.signature) + "</div>";
    else html += '<p class="note">No signature is published for this function in the sUNC metadata API. ' +
                 "The Potassium reference documents it in prose only, so nothing authoritative is reproduced here.</p>";

    if (e.alias_note) html += '<p class="note">' + inlineMarkdown(e.alias_note) + "</p>";

    if (e.purpose) html += "<h2>Why it exists</h2><p>" + inlineMarkdown(e.purpose) + "</p>";
    if (e.example) html += "<h2>Example</h2>" + code(e.example);

    if (e.gotchas && e.gotchas.length) {
      html += "<h2>Watch out for</h2><ul class=\"gotchas\">" +
              e.gotchas.map(function (g) { return "<li>" + inlineMarkdown(g) + "</li>"; }).join("") +
              "</ul>";
    }

    var rel = (e.related || []).filter(function (r) { return DATA.functions[r]; });
    if (rel.length) {
      html += "<h3>Related</h3><div class=\"chips\">" + rel.map(fnLink).join("") + "</div>";
    }

    if (e.concepts && e.concepts.length) {
      var pages = e.concepts.map(function (slug) {
        var c = DATA.concepts.filter(function (x) { return x.slug === slug; })[0];
        return c ? '<a class="chip" href="#/concept/' + c.slug + '">' + esc(c.title) + "</a>" : "";
      }).join("");
      if (pages.replace(/\s/g, "")) html += "<h3>Background</h3><div class=\"chips\">" + pages + "</div>";
    }

    html += '<p class="srcline">Signature and summary verified against ' +
            e.sources.map(function (s) {
              return '<a href="' + s.url + '" rel="noreferrer">' + esc(s.label) + "</a>";
            }).join(" and ") + ". Explanation, example and caveats written for this site.</p>";

    return html;
  }

  function viewConcept(slug) {
    var c = DATA.concepts.filter(function (x) { return x.slug === slug; })[0];
    if (!c) return "<h1>No such page</h1><p><a href=\"#/\">Back to the index</a>.</p>";

    var rel = (c.related || []).filter(function (r) { return DATA.functions[r]; });

    return '<p class="crumb"><a href="#/">Index</a> / Concept</p>' +
           "<h1>" + esc(c.title) + "</h1>" +
           '<p class="lede">' + esc(c.lede) + "</p>" +
           '<div class="prose">' + paragraphs(c.body) + "</div>" +
           (rel.length ? "<h3>Functions on this page</h3><div class=\"chips\">" +
                         rel.map(fnLink).join("") + "</div>" : "");
  }

  /* ---------------------------------------------------------- router */

  function render() {
    var hash = decodeURIComponent(location.hash || "#/");
    var html;

    if (hash.indexOf("#/fn/") === 0) html = viewFunction(hash.slice(5));
    else if (hash.indexOf("#/library/") === 0) html = viewLibrary(hash.slice(10));
    else if (hash.indexOf("#/concept/") === 0) html = viewConcept(hash.slice(10));
    else html = viewHome();

    main.innerHTML = html;
    markActive();
    document.title = (main.querySelector("h1") ? main.querySelector("h1").textContent + " — " : "") +
                     "Executor environment reference";
  }

  window.addEventListener("hashchange", function () {
    render();
    main.focus();
    window.scrollTo(0, 0);
    sidebar.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    hideResults();
  });

  /* ---------------------------------------------------------- search UI */

  var activeIndex = -1;

  function hideResults() {
    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
    activeIndex = -1;
  }

  function runSearch() {
    var hits = window.Search.run(searchInput.value, ALL, filters);
    if (!searchInput.value.trim()) return hideResults();

    if (!hits.length) {
      resultsBox.innerHTML = '<p class="result-empty">Nothing matches. Availability filters ' +
                             "in the sidebar also apply to search.</p>";
      resultsBox.hidden = false;
      return;
    }

    resultsBox.innerHTML = hits.map(function (e, i) {
      return '<a class="result' + (i === 0 ? " active" : "") + '" href="#/fn/' +
             encodeURIComponent(e.name) + '" role="option">' +
             '<span class="result-top"><span class="result-name">' + esc(e.name) + "</span>" +
             availChip(e.availability) + "</span>" +
             '<span class="result-sum">' + esc(e.summary) + "</span></a>";
    }).join("");
    activeIndex = 0;
    resultsBox.hidden = false;
  }

  function moveActive(delta) {
    var items = resultsBox.querySelectorAll(".result");
    if (!items.length) return;
    items[activeIndex] && items[activeIndex].classList.remove("active");
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items[activeIndex].classList.add("active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  searchInput.addEventListener("input", runSearch);
  searchInput.addEventListener("focus", function () { if (searchInput.value) runSearch(); });

  searchInput.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown") { ev.preventDefault(); moveActive(1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); moveActive(-1); }
    else if (ev.key === "Enter") {
      var item = resultsBox.querySelectorAll(".result")[activeIndex];
      if (item) { ev.preventDefault(); location.hash = item.getAttribute("href").slice(1); searchInput.blur(); }
    } else if (ev.key === "Escape") { searchInput.blur(); hideResults(); }
  });

  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".searchwrap")) hideResults();
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && document.activeElement !== searchInput) {
      ev.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  /* ---------------------------------------------------------- copy buttons */

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".copy");
    if (!btn) return;
    var text = btn.getAttribute("data-code");
    var done = function () {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy"; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { btn.textContent = "Press Ctrl+C"; });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { btn.textContent = "Press Ctrl+C"; }
      document.body.removeChild(ta);
    }
  });

  /* ---------------------------------------------------------- chrome */

  navToggle.addEventListener("click", function () {
    var open = sidebar.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  var themeBtn = document.createElement("button");
  themeBtn.className = "navtoggle";
  themeBtn.style.display = "block";
  themeBtn.type = "button";
  themeBtn.textContent = "Light";
  themeBtn.addEventListener("click", function () {
    var root = document.documentElement;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    themeBtn.textContent = next === "dark" ? "Light" : "Dark";
  });
  document.querySelector(".topbar").appendChild(themeBtn);

  buildNav();
  render();
})();
