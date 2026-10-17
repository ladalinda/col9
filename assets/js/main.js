/* ==========================================================================
   Скрипты сайта. Без библиотек, работает на любом телефоне.
   Блоки:
     1. Мобильное меню
     2. Подстановка настроек из config.js
     3. Фото-заглушка
     4. Тест «Подхожу ли я?»
     5. Калькулятор баллов
     6. Таблица городов (поиск, фильтр, сортировка)
     7. Формы (подписка и заявка)
   ========================================================================== */
(function () {
  'use strict';
  var CFG = window.SITE || {};

  /* ---------- 1. Мобильное меню ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Закрыть' : 'Меню';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Меню'; }
    });
  }

  /* ---------- 2. Настройки из config.js ---------- */
  function applyConfig() {
    var map = {
      email: { href: CFG.email ? 'mailto:' + CFG.email : '', text: CFG.email },
      telegram: { href: CFG.telegram, text: CFG.telegramHandle || CFG.telegram },
      instagram: { href: CFG.instagram, text: CFG.instagramHandle || CFG.instagram },
      vk: { href: CFG.vk, text: CFG.vkHandle || CFG.vk },
      esp: { href: CFG.espUrl, text: '' },
      catalog: { href: CFG.catalogUrl, text: '' },
      info: { href: CFG.infoUrl, text: '' }
    };
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var key = el.getAttribute('data-cfg');
      var item = map[key];
      if (!item) return;
      if (item.href) {
        el.setAttribute('href', item.href);
        if (key !== 'catalog' && key !== 'info') el.setAttribute('rel', 'noopener');
        if (/^https?:/.test(item.href)) { el.setAttribute('target', '_blank'); }
        if (item.text && el.hasAttribute('data-cfg-text')) el.textContent = item.text;
        el.classList.remove('is-todo');
      } else {
        el.setAttribute('href', '#');
        el.classList.add('is-todo');
        el.addEventListener('click', function (e) { e.preventDefault(); });
      }
    });
    document.querySelectorAll('[data-cfg-date]').forEach(function (el) {
      el.textContent = CFG.checkedDate ? (CFG.checkedCall + ', ' + CFG.checkedDate) : CFG.checkedCall;
    });
  }
  applyConfig();

  /* ---------- 3. Фото-заглушка ---------- */
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    function fail() { if (!img.dataset.tried && /\.jpg$/.test(img.getAttribute('src') || '')) { img.dataset.tried = '1'; img.src = img.getAttribute('src').replace(/\.jpg$/, '.svg'); return; } img.style.display = 'none'; if (img.hasAttribute('data-hide-figure')) { var fg = img.closest('figure'); if (fg) fg.style.display = 'none'; return; } var ph = img.parentNode.querySelector('.photo-frame__ph, .avatar__ph'); if (ph) ph.hidden = false; }
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---------- 4. Тест «Подхожу ли я?» ---------- */
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var questions = quiz.querySelectorAll('.q');
    var bar = document.getElementById('quiz-bar');
    var barLabel = document.getElementById('quiz-bar-label');
    var okBox = document.getElementById('quiz-ok');
    var noBox = document.getElementById('quiz-no');
    var failList = document.getElementById('quiz-fails');

    function updateQuiz() {
      var answered = 0, fails = [];
      questions.forEach(function (q) {
        var checked = q.querySelector('input:checked');
        q.classList.remove('is-yes', 'is-no');
        if (checked) {
          answered++;
          q.classList.add(checked.value === 'yes' ? 'is-yes' : 'is-no');
          if (checked.value === 'no') fails.push(q.getAttribute('data-short'));
        }
      });
      if (bar) bar.style.width = (answered / questions.length * 100) + '%';
      if (barLabel) barLabel.textContent = 'Отвечено: ' + answered + ' из ' + questions.length;
      var done = answered === questions.length;
      okBox.classList.toggle('is-shown', done && fails.length === 0);
      noBox.classList.toggle('is-shown', done && fails.length > 0);
      if (done && fails.length && failList) {
        failList.innerHTML = '';
        fails.forEach(function (f) { var li = document.createElement('li'); li.textContent = f; failList.appendChild(li); });
      }
      if (done) {
        var target = fails.length ? noBox : okBox;
        if (target.getAttribute('data-scrolled') !== '1') {
          target.setAttribute('data-scrolled', '1');
          setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
        }
      } else { okBox.removeAttribute('data-scrolled'); noBox.removeAttribute('data-scrolled'); }
    }
    quiz.addEventListener('change', updateQuiz);
    var resetBtn = document.getElementById('quiz-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      quiz.querySelectorAll('input:checked').forEach(function (i) { i.checked = false; });
      updateQuiz(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    updateQuiz();
  }

  /* ---------- 5. Калькулятор баллов ---------- */
  var calc = document.getElementById('calc');
  if (calc) {
    var out = document.getElementById('calc-total');
    var meter = document.getElementById('calc-meter');
    var parts = document.getElementById('calc-parts');
    var warn = document.getElementById('calc-warn');
    function val(name) {
      var el = calc.elements[name];
      return el ? parseInt(el.value, 10) : 0;
    }
    function labelOf(name) {
      var el = calc.elements[name];
      return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '';
    }
    function recalc() {
      var gpa = val('gpa'), exp = val('exp'), city = val('city'), country = val('country'), female = val('gender');
      var total = gpa + exp + city + country + female;
      out.textContent = total;
      meter.style.width = Math.min(100, total / 101 * 100) + '%';
      meter.parentNode.setAttribute('aria-valuenow', total);
      parts.innerHTML = '';
      [['Средний балл', gpa, 35], ['Опыт', exp, 30], ['Город', city, 20], ['Страна', country, 15], ['Пол', female, 1]].forEach(function (p) {
        var li = document.createElement('li');
        li.textContent = p[0] + ': ' + p[1] + ' из ' + p[2];
        parts.appendChild(li);
      });
      var problems = [];
      if (calc.elements['gpa'].value === '-1') problems.push('со средним баллом ниже 4.0 подать заявку нельзя');
      if (calc.elements['exp'].value === '-1') problems.push('нужно минимум 12 месяцев опыта после диплома по теме программы');
      warn.hidden = problems.length === 0;
      warn.textContent = problems.length ? 'Важно: ' + problems.join('; ') + '. Сейчас заявка не пройдёт по правилам.' : '';
      // если выбрано «нельзя подавать» (-1), в сумме считаем это как 0
      if (gpa < 0 || exp < 0) {
        total = Math.max(0, gpa) + Math.max(0, exp) + city + country + female;
        out.textContent = total;
        meter.style.width = Math.min(100, total / 101 * 100) + '%';
      }
    }
    calc.addEventListener('change', recalc);
    calc.addEventListener('input', recalc);
    recalc();
  }

  /* ---------- 6. Таблица городов ---------- */
  var cityTable = document.getElementById('city-table');
  if (cityTable) {
    var tbody = cityTable.tBodies[0];
    var rows = Array.prototype.slice.call(tbody.rows);
    var chips = document.querySelectorAll('.chip[data-pts]');
    var search = document.getElementById('city-search');
    var note = document.getElementById('city-count');
    var activePts = 'all';
    var sortKey = 'pts', sortDir = -1;

    function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }
    function applyFilters() {
      var q = norm(search ? search.value : '');
      var shown = 0;
      rows.forEach(function (r) {
        var okPts = activePts === 'all' || r.getAttribute('data-pts') === activePts;
        var okQ = !q || norm(r.textContent).indexOf(q) !== -1;
        r.hidden = !(okPts && okQ);
        if (!r.hidden) shown++;
      });
      if (note) note.textContent = 'Показано городов: ' + shown + ' из ' + rows.length;
    }
    function applySort() {
      rows.sort(function (a, b) {
        if (sortKey === 'name') return sortDir * a.cells[0].textContent.localeCompare(b.cells[0].textContent, 'ru');
        var at = sortKey === 'cost' ? 'data-cost' : 'data-pts';
        var d = parseInt(a.getAttribute(at), 10) - parseInt(b.getAttribute(at), 10);
        return d !== 0 ? sortDir * d : a.cells[0].textContent.localeCompare(b.cells[0].textContent, 'ru');
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        activePts = c.getAttribute('data-pts');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        applyFilters();
      });
    });
    if (search) search.addEventListener('input', applyFilters);
    cityTable.querySelectorAll('button.sort').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-sort');
        if (sortKey === key) sortDir = -sortDir; else { sortKey = key; sortDir = key === 'pts' ? -1 : 1; }
        applySort();
      });
    });
    applySort(); applyFilters();
  }

  /* ---------- 7. Формы ---------- */
  function collectUtm() {
    var p = new URLSearchParams(window.location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
      var v = p.get(k);
      try { if (v) sessionStorage.setItem(k, v); else v = sessionStorage.getItem(k); } catch (e) {}
      if (v) o[k] = v;
    });
    return o;
  }
  var utm = collectUtm();

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var msgOk = form.querySelector('.form__msg--ok');
    var msgErr = form.querySelector('.form__msg--err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (msgOk) msgOk.classList.remove('is-shown');
      if (msgErr) msgErr.classList.remove('is-shown');
      // антиспам: скрытое поле должно остаться пустым
      var hp = form.querySelector('.hp input');
      if (hp && hp.value) return;
      var consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        if (msgErr) { msgErr.textContent = 'Поставьте галочку согласия на обработку данных, иначе я не смогу вам написать.'; msgErr.classList.add('is-shown'); }
        consent.focus();
        return;
      }
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'website') data[k] = v; });
      data.form = form.getAttribute('data-form');
      data.page = window.location.pathname;
      Object.keys(utm).forEach(function (k) { data[k] = utm[k]; });

      if (CFG.sheetEndpoint) {
        var btn0 = form.querySelector('button[type="submit"]');
        if (btn0) btn0.disabled = true;
        fetch(CFG.sheetEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
          .then(function () { form.reset(); if (msgOk) { msgOk.textContent = 'Готово, я получила ваше сообщение и скоро отвечу.'; msgOk.classList.add('is-shown'); } })
          .catch(function () { if (msgErr) { msgErr.textContent = 'Не получилось отправить форму. Попробуйте ещё раз или напишите мне напрямую.'; msgErr.classList.add('is-shown'); } })
          .then(function () { if (btn0) btn0.disabled = false; });
      } else if (CFG.formEndpoint) {
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error('bad status'); form.reset(); if (msgOk) { msgOk.textContent = 'Готово, я получила ваше сообщение и скоро отвечу.'; msgOk.classList.add('is-shown'); } })
          .catch(function () { if (msgErr) { msgErr.textContent = 'Не получилось отправить форму. Попробуйте ещё раз или напишите мне напрямую.'; msgErr.classList.add('is-shown'); } })
          .then(function () { if (btn) btn.disabled = false; });
      } else if (CFG.email) {
        var lines = Object.keys(data).map(function (k) { return k + ': ' + data[k]; });
        window.location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(form.getAttribute('data-subject') || 'Сообщение с сайта') + '&body=' + encodeURIComponent(lines.join('\n'));
      } else if (msgErr) {
        msgErr.textContent = 'Форма пока не подключена: впишите email или адрес формы в файле assets/js/config.js.';
        msgErr.classList.add('is-shown');
      }
    });
  });
  /* ---------- 8. Подсказки на картах и подсветка групп городов ---------- */
  var tip = document.createElement('div');
  tip.className = 'map-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  function showTip(el, x, y) {
    tip.innerHTML = '';
    var imgSrc = el.getAttribute('data-img');
    if (imgSrc) {
      var im = document.createElement('img'); im.className = 'map-tip__img'; im.alt = el.getAttribute('data-tip');
      im.addEventListener('error', function () { if (!im.dataset.tried && /\.jpg$/.test(imgSrc)) { im.dataset.tried = '1'; im.src = imgSrc.replace(/\.jpg$/, '.svg'); } else { im.remove(); } }); im.src = imgSrc; tip.appendChild(im);
    }
    var t = document.createElement('strong'); t.textContent = el.getAttribute('data-tip'); tip.appendChild(t);
    ['data-tip-text', 'data-tip-meta'].forEach(function (a) {
      var v = el.getAttribute(a);
      if (v) v.split('|').forEach(function (part) { var e = document.createElement('em'); e.textContent = part; tip.appendChild(e); });
    });
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var nx = Math.min(Math.max(8, x + 14), window.innerWidth - w - 8);
    var ny = y + 18 + h > window.innerHeight ? y - h - 14 : y + 18;
    tip.style.left = nx + 'px'; tip.style.top = Math.max(8, ny) + 'px';
  }
  function hideTip() { tip.hidden = true; }
  document.addEventListener('mousemove', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el) showTip(el, e.clientX, e.clientY); else hideTip();
  });
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el) showTip(el, e.clientX, e.clientY); else hideTip();
  });
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el) { var r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.top + r.height / 2); }
  });
  document.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  var cmap = document.querySelector('svg.map-cities');
  if (cmap) {
    var listBox = document.getElementById('map-list');
    var NAMES = { '20': 'Малые города, 20 баллов', '10': 'Средние города, 10 баллов', '5': 'Большие города, 5 баллов' };
    var sticky = null;
    function setGroup(g) {
      cmap.classList.remove('is-g20', 'is-g10', 'is-g5');
      cmap.querySelectorAll('.lg').forEach(function (l) { l.classList.toggle('is-on', l.getAttribute('data-grp') === g); });
      document.querySelectorAll('.map-chips .chip').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-grp') === g ? 'true' : 'false'); });
      if (!g) { if (listBox) listBox.textContent = 'Наведите или нажмите на цвет в легенде карты, и я покажу города этой группы.'; return; }
      cmap.classList.add('is-g' + g);
      if (listBox) {
        var names = [];
        cmap.querySelectorAll('.city[data-pts="' + g + '"]').forEach(function (c) { names.push(c.getAttribute('data-name')); });
        listBox.innerHTML = '';
        var b = document.createElement('strong'); b.textContent = NAMES[g] + ': ';
        listBox.appendChild(b); listBox.appendChild(document.createTextNode(names.join(', ') + '.'));
      }
    }
    cmap.querySelectorAll('.lg').forEach(function (l) {
      var g = l.getAttribute('data-grp');
      l.addEventListener('mouseenter', function () { setGroup(g); });
      l.addEventListener('mouseleave', function () { setGroup(sticky); });
      l.addEventListener('click', function () { sticky = sticky === g ? null : g; setGroup(sticky); });
      l.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sticky = sticky === g ? null : g; setGroup(sticky); } });
    });
    document.querySelectorAll('.map-chips .chip').forEach(function (c) {
      c.addEventListener('click', function () { var g = c.getAttribute('data-grp'); sticky = sticky === g ? null : g; setGroup(sticky); });
    });
    setGroup(null);
  }
  /* ---------- 9. Каталог программ: поиск и фильтры ---------- */
  var progQ = document.getElementById('prog-q');
  if (progQ) {
    var pLevel = document.getElementById('prog-level'), pCity = document.getElementById('prog-city'), pMode = document.getElementById('prog-mode');
    var pCount = document.getElementById('prog-count'), pToggle = document.getElementById('prog-toggle');
    var areas = Array.prototype.slice.call(document.querySelectorAll('details.area'));
    var allRows = Array.prototype.slice.call(document.querySelectorAll('.prog-table tbody tr'));
    var expanded = false;
    function nrm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    allRows.forEach(function (r) { r._t = nrm(r.textContent); });
    function applyProg() {
      var q = nrm(progQ.value.trim()), lv = pLevel.value, ct = pCity.value, md = pMode.value;
      var active = !!(q || lv || ct || md), total = 0;
      allRows.forEach(function (r) {
        var ok = (!q || r._t.indexOf(q) !== -1) && (!lv || r.getAttribute('data-level') === lv) && (!ct || r.getAttribute('data-city') === ct) && (!md || r.getAttribute('data-mode') === md);
        r.hidden = !ok; if (ok) total++;
      });
      areas.forEach(function (a) {
        var n = a.querySelectorAll('tbody tr:not([hidden])').length;
        a.querySelector('.area__count').textContent = n;
        a.hidden = n === 0;
        if (active) a.open = n > 0; else a.open = expanded;
      });
      if (pCount) pCount.textContent = 'Найдено программ: ' + total + ' из ' + allRows.length;
    }
    [progQ, pLevel, pCity, pMode].forEach(function (el) { el.addEventListener('input', applyProg); el.addEventListener('change', applyProg); });
    if (pToggle) pToggle.addEventListener('click', function () {
      expanded = !expanded; pToggle.textContent = expanded ? 'Свернуть все области' : 'Раскрыть все области';
      areas.forEach(function (a) { if (!a.hidden) a.open = expanded; });
    });
    applyProg();
  }
})();
