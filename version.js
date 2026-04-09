// Single source of truth for the MyGoldFolio app version shown on the website.
// Update only this file when releasing a new version.
// All pages include this script and use data-mgf-version / data-mgf-version-bare
// attributes as placeholders — this script populates them at load time.
(function () {
  var VERSION = '2.1.0';
  document.querySelectorAll('[data-mgf-version]').forEach(function (el) {
    el.textContent = 'v' + VERSION;
  });
  document.querySelectorAll('[data-mgf-version-bare]').forEach(function (el) {
    el.textContent = VERSION;
  });
})();
