(function () {
  // Approximate IANA zones by US state / common region names (handles DST).
  const STATE_TZ = {
    alabama: "America/Chicago",
    alaska: "America/Anchorage",
    arizona: "America/Phoenix",
    arkansas: "America/Chicago",
    california: "America/Los_Angeles",
    colorado: "America/Denver",
    connecticut: "America/New_York",
    delaware: "America/New_York",
    florida: "America/New_York",
    georgia: "America/New_York",
    hawaii: "Pacific/Honolulu",
    idaho: "America/Boise",
    illinois: "America/Chicago",
    indiana: "America/Indiana/Indianapolis",
    iowa: "America/Chicago",
    kansas: "America/Chicago",
    kentucky: "America/New_York",
    louisiana: "America/Chicago",
    maine: "America/New_York",
    maryland: "America/New_York",
    massachusetts: "America/New_York",
    michigan: "America/Detroit",
    minnesota: "America/Chicago",
    mississippi: "America/Chicago",
    missouri: "America/Chicago",
    montana: "America/Denver",
    nebraska: "America/Chicago",
    nevada: "America/Los_Angeles",
    "new hampshire": "America/New_York",
    "new jersey": "America/New_York",
    "new mexico": "America/Denver",
    "new york": "America/New_York",
    "north carolina": "America/New_York",
    "north dakota": "America/Chicago",
    ohio: "America/New_York",
    oklahoma: "America/Chicago",
    oregon: "America/Los_Angeles",
    pennsylvania: "America/New_York",
    "rhode island": "America/New_York",
    "south carolina": "America/New_York",
    "south dakota": "America/Chicago",
    tennessee: "America/Chicago",
    texas: "America/Chicago",
    utah: "America/Denver",
    vermont: "America/New_York",
    virginia: "America/New_York",
    washington: "America/Los_Angeles",
    "west virginia": "America/New_York",
    wisconsin: "America/Chicago",
    wyoming: "America/Denver",
    "district of columbia": "America/New_York",
  };

  const ABBR = {
    al: "alabama",
    ak: "alaska",
    az: "arizona",
    ar: "arkansas",
    ca: "california",
    co: "colorado",
    ct: "connecticut",
    de: "delaware",
    fl: "florida",
    ga: "georgia",
    hi: "hawaii",
    id: "idaho",
    il: "illinois",
    in: "indiana",
    ia: "iowa",
    ks: "kansas",
    ky: "kentucky",
    la: "louisiana",
    me: "maine",
    md: "maryland",
    ma: "massachusetts",
    mi: "michigan",
    mn: "minnesota",
    ms: "mississippi",
    mo: "missouri",
    mt: "montana",
    ne: "nebraska",
    nv: "nevada",
    nh: "new hampshire",
    nj: "new jersey",
    nm: "new mexico",
    ny: "new york",
    nc: "north carolina",
    nd: "north dakota",
    oh: "ohio",
    ok: "oklahoma",
    or: "oregon",
    pa: "pennsylvania",
    ri: "rhode island",
    sc: "south carolina",
    sd: "south dakota",
    tn: "tennessee",
    tx: "texas",
    ut: "utah",
    vt: "vermont",
    va: "virginia",
    wa: "washington",
    wv: "west virginia",
    wi: "wisconsin",
    wy: "wyoming",
    dc: "district of columbia",
  };

  const GMT_TO_OFFSET = {
    "GMT-10": -10,
    "GMT-9": -9,
    "GMT-8": -8,
    "GMT-7": -7,
    "GMT-6": -6,
    "GMT-5": -5,
    "GMT-4": -4,
  };

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\./g, "");
  }

  function offsetLabel(timeZone) {
    if (!timeZone) return "—";
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset",
      }).formatToParts(new Date());
      const name = parts.find((part) => part.type === "timeZoneName");
      if (name && name.value) {
        return name.value.replace("GMT", "GMT").replace("UTC", "GMT");
      }
    } catch (_) {
      /* fall through */
    }
    return "—";
  }

  function fromState(state) {
    const key = normalize(state);
    if (!key) return "";
    if (STATE_TZ[key]) return STATE_TZ[key];
    if (ABBR[key] && STATE_TZ[ABBR[key]]) return STATE_TZ[ABBR[key]];
    return "";
  }

  function fromLocation(location, state) {
    const fromStateValue = fromState(state);
    if (fromStateValue) return fromStateValue;

    const text = normalize(location);
    if (!text) return "";

    for (const [abbr, name] of Object.entries(ABBR)) {
      const pattern = new RegExp("\\b" + abbr + "\\b", "i");
      if (pattern.test(text) || text.includes(name)) {
        return STATE_TZ[name];
      }
    }

    return "";
  }

  function resolveTimeZone(rawTimezone, location, state) {
    const raw = String(rawTimezone || "").trim();
    if (raw && STATE_TZ[normalize(raw)]) return STATE_TZ[normalize(raw)];
    if (raw && /^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\//.test(raw)) {
      return raw;
    }

    const resolved = fromLocation(location, state);
    if (resolved) return resolved;

    const gmtMatch = raw.toUpperCase().match(/^GMT([+-]\d{1,2})$/);
    if (gmtMatch) return raw.toUpperCase();

    return "";
  }

  function formatLocalTime(timeZone, date) {
    const when = date instanceof Date ? date : new Date();
    const zone = String(timeZone || "").trim();
    if (!zone || zone === "—") return "—";

    if (/^GMT[+-]\d{1,2}$/i.test(zone)) {
      const offset = GMT_TO_OFFSET[zone.toUpperCase()];
      if (offset == null) return "—";
      const utc = when.getTime() + when.getTimezoneOffset() * 60000;
      const local = new Date(utc + offset * 3600000);
      return local.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    try {
      return new Intl.DateTimeFormat([], {
        timeZone: zone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(when);
    } catch (_) {
      return "—";
    }
  }

  // Back-compat helpers used elsewhere
  function fromStateGmt(state) {
    const zone = fromState(state);
    return zone ? offsetLabel(zone) : "";
  }

  function fromLocationGmt(location, state) {
    const zone = fromLocation(location, state);
    return zone ? offsetLabel(zone) : "—";
  }

  window.SheetlineTimezone = {
    fromState: fromStateGmt,
    fromLocation: fromLocationGmt,
    resolveTimeZone,
    formatLocalTime,
    offsetLabel,
  };
})();
