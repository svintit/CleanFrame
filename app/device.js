/* Public Tizen application APIs. No Mac server, network address or credentials. */
(function () {
  'use strict';
  var IDS = {
    stremio: 'IkWsFHtOY9.Stremio', netflix: 'org.tizen.netflix-app',
    disneyplus: 'MCmYXNxgcu.DisneyPlus', youtube: '9Ur5IzDKqV.TizenYouTube',
    appletv: 'com.samsung.tv.aria-video', primevideo: 'org.tizen.primevideo',
    abciview: 'mWK87Xghap.ABCiview', sbs: 'OyE7OuxlUi.SBSOnDemand',
    applemusic: 'org.tizen.apple.apple-music',
    browser: 'org.tizen.browser', luna: 'CmeyUlnhYY.LunaWebApp', xbox: 'com.samsung.tv.xbox'
  };
  var STREAMING = ['as6cYRgkPy.Binge', '73iTZRTc34.Stan', '5b8c3eb16b.BeamCTVDev',
    'KaLitts8bq.tenplaySamsungTizen', 'eYuOiOLYQX.KayoSports', 'Ne2ZsPWdKl.9NOW',
    '3KA0pm7a7V.TubiTV', 'rJeHak5zRg.Spotify', 'icp4AvUPiA.7plus'];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.microsoft.copilot'];
  var EXTRA_BRANDS = {'rJeHak5zRg.Spotify': 'spotify', '5b8c3eb16b.BeamCTVDev': 'hbomax', '3KA0pm7a7V.TubiTV': 'tubi'};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', '25emanual3.emanual',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'svFrameHm1.CleanFrame';
  var VIEWER = 'org.tizen.tv-viewer', SOURCE_POLL_MS = 4000;
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open CleanFrame on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to CleanFrame.' };
  }
  function bounded(done) {
    var finished = false, timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, 8000);
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    return finish;
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try { api().launch(id, function () { finish(null); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({message: 'This app has no launch target.'}); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function home(done) { launchApp('com.samsung.tv.csfs', done); }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      api().getAppsInfo(function (list) {
        var known = {}, seen = {}, result = [];
        Object.keys(IDS).forEach(function (brand) { known[IDS[brand]] = brand; });
        list.forEach(function (a) {
          var primary = !!known[a.id], stream = STREAMING.indexOf(a.id) >= 0;
          var consumer = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/.test(a.id) || CONSUMER_SYSTEM.indexOf(a.id) >= 0;
          if (a.id === SELF || INTERNAL.indexOf(a.id) >= 0 || seen[a.id] || !a.name || (!primary && !stream && (!a.show || !consumer))) return;
          if (!primary && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
          if (/-dummy$/.test(a.id) || a.id === 'com.samsung.tv.cobalt-yt') return;
          seen[a.id] = true;
          result.push({ appId: a.id, name: a.name, brand: known[a.id] || EXTRA_BRANDS[a.id] || '', icon: a.iconPath || '', rank: primary ? Object.keys(IDS).indexOf(known[a.id]) : (stream ? 20 : 30) });
        });
        result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
        finish(null, result);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function sysinfo() { return window.tizen && window.tizen.systeminfo; }
  function tvwindow() { return window.tizen && window.tizen.tvwindow; }
  function sourcesUnavailable() {
    return { message: 'Open CleanFrame on the TV to find its sources.', detail: 'The web preview cannot read TV inputs.' };
  }
  function readSources(done) {
    var finish = bounded(done), info = sysinfo();
    if (!info) { finish(sourcesUnavailable()); return; }
    try { info.getPropertyValue('VIDEOSOURCE', function (raw) { finish(null, raw || {}); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function normaliseSources(raw) {
    var list = [], seen = {};
    function add(src, connected) {
      var type = String(src && src.type || '').toUpperCase(), number = Number(src && src.number) || 0, key = type + ':' + number;
      if ((type !== 'TV' && type !== 'HDMI') || seen[key]) return;
      seen[key] = true; list.push({ type: type, number: number, connected: connected });
    }
    (raw.connected || []).forEach(function (src) { add(src, true); });
    (raw.disconnected || []).forEach(function (src) { add(src, false); });
    list.sort(function (a, b) { return (a.type === 'TV' ? 0 : 1) - (b.type === 'TV' ? 0 : 1) || a.number - b.number; });
    return list;
  }
  function watchSources(onChange) {
    var stopped = false, busy = false, last = null, timer = 0, listener = null;
    function check() {
      if (stopped || busy) return;
      busy = true;
      readSources(function (err, raw) {
        var list = err ? null : normaliseSources(raw), key = err ? 'error:' + (err.message || '') : JSON.stringify(list);
        busy = false;
        if (stopped || key === last) return;
        last = key;
        onChange(err, list);
      });
    }
    setTimeout(check, 0);
    if (sysinfo()) {
      timer = setInterval(function () { if (!document.hidden) check(); }, SOURCE_POLL_MS);
      try { listener = sysinfo().addPropertyValueChangeListener('VIDEOSOURCE', check, null, function () {}); } catch (err) { listener = null; }
    }
    return function () {
      stopped = true; clearInterval(timer);
      if (listener !== null) { try { sysinfo().removePropertyValueChangeListener(listener); } catch (err) { /* already removed */ } }
    };
  }
  function showViewer(finish) {
    launchApp(VIEWER, function (err) {
      if (!err) { finish(null); return; }
      try { api().getCurrentApplication().hide(); finish(null); } catch (hideErr) { finish(err); }
    });
  }
  function openSource(source, done) {
    var finish = bounded(done);
    if (!api() || !sysinfo()) { finish(sourcesUnavailable()); return; }
    if (source.type === 'TV') { showViewer(finish); return; }
    readSources(function (err, raw) {
      var match = null, label = source.type + ' ' + source.number;
      if (err) { finish(err); return; }
      (raw.connected || []).concat(raw.disconnected || []).forEach(function (src) {
        if (!match && String(src.type).toUpperCase() === source.type && Number(src.number) === source.number) match = src;
      });
      if (!match) { finish({ message: label + ' is not available on this TV.' }); return; }
      if (!tvwindow()) { finish({ message: 'This TV cannot switch sources from CleanFrame.', detail: 'The TVWindow API is not available.' }); return; }
      try {
        tvwindow().setSource(match, function () { showViewer(finish); }, function (e) {
          finish({ message: 'The TV could not switch to ' + label + '.', detail: e && (e.message || e.name) || '' });
        }, 'MAIN');
      } catch (e) { finish(failure(e)); }
    });
  }
  window.FrameDevice = { launch: launch, launchApp: launchApp, art: art, home: home, settings: settings, apps: apps, watchSources: watchSources, openSource: openSource };
}());
