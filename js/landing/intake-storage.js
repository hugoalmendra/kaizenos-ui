/** Persist founder intake draft + final submission in localStorage */
window.KaisoIntakeStorage = (function () {
  var DRAFT_KEY = 'kaiso:intake-draft';
  var FINAL_KEY = 'kaiso:founder-intake';

  function read(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    loadDraft: function () { return read(DRAFT_KEY); },
    saveDraft: function (data) { return write(DRAFT_KEY, data); },
    clearDraft: function () { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} },
    loadFinal: function () { return read(FINAL_KEY); },
    saveFinal: function (payload) {
      write(FINAL_KEY, payload);
      this.clearDraft();
      return true;
    }
  };
})();
