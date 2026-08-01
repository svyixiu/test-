/* Fuzzy search over function names and summaries.
   Scoring, highest first:
     exact name > name prefix > name substring > subsequence in name > summary hit */

(function () {
  function subsequenceScore(needle, hay) {
    var hi = 0, streak = 0, best = 0, hits = 0;
    for (var i = 0; i < hay.length && hi < needle.length; i++) {
      if (hay[i] === needle[hi]) {
        hi++; hits++; streak++;
        if (streak > best) best = streak;
      } else {
        streak = 0;
      }
    }
    if (hi < needle.length) return -1;
    return best * 2 + hits;
  }

  function search(query, entries, filters) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var out = [];

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (filters && filters.indexOf(e.availability) === -1) continue;

      var name = e.name.toLowerCase();
      var score = -1;

      if (name === q) score = 1000;
      else if (name.indexOf(q) === 0) score = 800 - name.length;
      else if (name.indexOf(q) !== -1) score = 600 - name.length;
      else {
        var sub = subsequenceScore(q, name);
        if (sub >= 0) score = 300 + sub;
        else if ((e.summary || "").toLowerCase().indexOf(q) !== -1) score = 120;
        else if ((e.purpose || "").toLowerCase().indexOf(q) !== -1) score = 60;
      }

      if (score > 0) out.push({ entry: e, score: score });
    }

    out.sort(function (a, b) {
      return b.score - a.score || a.entry.name.localeCompare(b.entry.name);
    });
    return out.slice(0, 40).map(function (r) { return r.entry; });
  }

  window.Search = { run: search };
})();
