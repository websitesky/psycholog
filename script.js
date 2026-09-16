(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var get = function (path) {
    return path.split('.').reduce(function (o, k) { return o && o[k] != null ? o[k] : undefined; }, CFG);
  };

  /* ---------- Config → сторінка ---------- */
  $$('[data-cfg]').forEach(function (el) {
    var v = get(el.getAttribute('data-cfg'));
    if (v != null && v !== '') el.textContent = v;
  });
  $$('[data-href]').forEach(function (el) {
    var v = get(el.getAttribute('data-href'));
    if (v) el.href = v;
  });
  $$('[data-mail]').forEach(function (el) {
    var v = get(el.getAttribute('data-mail'));
    if (v) el.href = 'mailto:' + v;
  });
  var art = $('#portrait-art');
  $$('[data-photo]').forEach(function (frame) {
    var src = get(frame.getAttribute('data-photo'));
    var useArt = function () { if (art) frame.appendChild(art.content.cloneNode(true)); };
    if (src) {
      var img = new Image();
      img.alt = (CFG.person && CFG.person.name) || '';
      img.onerror = function () { img.remove(); useArt(); };
      img.src = src;
      frame.appendChild(img);
    } else {
      useArt();
    }
  });
  var heroPhoto = get('person.photo');
  var hero = $('.hero');
  if (hero && heroPhoto) hero.style.setProperty('--hero-photo', 'url("' + heroPhoto + '")');
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header / menu / FAB ---------- */
  var header = $('#header');
  var fab = $('#fab');
  var burger = $('#burger');
  var onScroll = function () {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (fab) fab.classList.toggle('is-on', y > window.innerHeight * 0.8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var setMenu = function (open) {
    document.body.classList.toggle('is-menu', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('is-menu')); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Reveal ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Лічильники ---------- */
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '';
        var t0 = performance.now(), dur = 1600;
        (function tick(t) {
          var p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(to * k)) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Таймер до старту програми ---------- */
  var cd = $('#countdown');
  var start = CFG.program && Date.parse(CFG.program.start);
  if (cd && start) {
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    var tickCd = function () {
      var diff = Math.max(0, start - Date.now());
      var s = Math.floor(diff / 1000);
      $('[data-cd="d"]', cd).textContent = pad(Math.floor(s / 86400));
      $('[data-cd="h"]', cd).textContent = pad(Math.floor(s % 86400 / 3600));
      $('[data-cd="m"]', cd).textContent = pad(Math.floor(s % 3600 / 60));
      $('[data-cd="s"]', cd).textContent = pad(s % 60);
    };
    tickCd();
    setInterval(tickCd, 1000);
  }

  /* ---------- Модальні вікна ---------- */
  var lastFocus = null;
  var openModal = function (m) {
    $$('.modal').forEach(function (x) { x.hidden = true; });
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add('is-locked');
    var c = $('.modal__close', m);
    if (c) c.focus();
  };
  var closeModal = function (m) {
    m.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  $$('.modal').forEach(function (m) {
    $$('[data-close]', m).forEach(function (b) { b.addEventListener('click', function () { closeModal(m); }); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('.modal').forEach(function (m) { if (!m.hidden) closeModal(m); });
    setMenu(false);
  });

  /* ---------- Тест GAD-7 ---------- */
  var QUESTIONS = [
    'Відчуття нервовості, тривоги або сильної напруги',
    'Неможливість зупинити або контролювати занепокоєння',
    'Надмірне занепокоєння з різних приводів',
    'Труднощі з тим, щоб розслабитися',
    'Такий неспокій, що важко всидіти на місці',
    'Легко дратуєтеся або роздратовуєтеся',
    'Страх, ніби може статися щось жахливе'
  ];
  var OPTIONS = ['Зовсім ні', 'Кілька днів', 'Більше половини днів', 'Майже щодня'];
  var LEVELS = [
    { max: 4, title: 'Мінімальна тривожність', color: '#5C8A74',
      text: 'Ваш рівень тривоги зараз у межах норми. Це чудово! Щоб так і залишалося, корисно мати кілька простих технік саморегуляції на складні дні — заберіть безкоштовний гайд і аудіопрактику.' },
    { max: 9, title: 'Легка тривожність', color: '#C9A45C',
      text: 'Тривога вже помітна й може впливати на сон, концентрацію та настрій. Хороша новина: на цьому етапі навички регуляції засвоюються найшвидше. Програма «Тиша всередині» або кілька консультацій можуть суттєво допомогти.' },
    { max: 14, title: 'Помірна тривожність', color: '#B8893F',
      text: 'Тривога суттєво впливає на ваше життя. Рекомендую не відкладати й звернутися до фахівця — з таким рівнем добре працюють індивідуальні консультації за методом КПТ. Перша зустріч-знайомство — зі знижкою 50%.' },
    { max: 21, title: 'Виражена тривожність', color: '#1E3A31',
      text: 'Ваш результат свідчить про високий рівень тривоги. Вам не потрібно справлятися з цим наодинці. Рекомендую звернутися до психолога, а також проконсультуватися з лікарем — поєднання підтримки часто дає найкращий результат.' }
  ];

  var testModal = $('#test-modal');
  var testBody = $('#test-body');
  var answers = [];
  var lastScore = null;

  var renderIntro = function () {
    testBody.innerHTML =
      '<span class="test__meta">Безкоштовний тест · 2 хвилини</span>' +
      '<h3 class="test__q" id="test-title" style="margin-top:14px">Який у вас рівень тривожності?</h3>' +
      '<p class="test__hint">Тест GAD-7 — міжнародна шкала, яку використовують психологи та лікарі. 7 питань про те, як ви почувалися <b>останні 2 тижні</b>.</p>' +
      '<div class="test__actions"><button class="btn btn--primary" data-start>Почати тест</button></div>' +
      '<p class="test__disc">Тест не є діагнозом і не замінює консультацію фахівця. Відповіді нікуди не надсилаються.</p>';
    $('[data-start]', testBody).addEventListener('click', function () { answers = []; renderQ(0); });
  };

  var renderQ = function (i) {
    var html =
      '<span class="test__meta">Питання ' + (i + 1) + ' з ' + QUESTIONS.length + '</span>' +
      '<div class="test__progress"><i style="width:' + (i / QUESTIONS.length * 100) + '%"></i></div>' +
      '<p class="test__hint" style="margin-bottom:6px">Як часто за останні 2 тижні вас турбувало:</p>' +
      '<h3 class="test__q" id="test-title">' + QUESTIONS[i] + '</h3>' +
      '<div class="test__opts" style="margin-top:22px">' +
      OPTIONS.map(function (o, v) {
        return '<button data-v="' + v + '"' + (answers[i] === v ? ' class="is-picked"' : '') + '>' + o + '<span>→</span></button>';
      }).join('') + '</div>' +
      (i > 0 ? '<button class="test__back" data-back>← Назад</button>' : '');
    testBody.innerHTML = html;
    requestAnimationFrame(function () {
      var bar = $('.test__progress i', testBody);
      if (bar) bar.style.width = ((i + 1) / QUESTIONS.length * 100) + '%';
    });
    $$('[data-v]', testBody).forEach(function (b) {
      b.addEventListener('click', function () {
        answers[i] = +b.getAttribute('data-v');
        b.classList.add('is-picked');
        setTimeout(function () { i + 1 < QUESTIONS.length ? renderQ(i + 1) : renderResult(); }, 220);
      });
    });
    var back = $('[data-back]', testBody);
    if (back) back.addEventListener('click', function () { renderQ(i - 1); });
  };

  var renderResult = function () {
    var score = answers.reduce(function (a, b) { return a + b; }, 0);
    var lvl = LEVELS.filter(function (l) { return score <= l.max; })[0];
    lastScore = score + ' з 21 — ' + lvl.title.toLowerCase();
    var high = score >= 10;
    testBody.innerHTML =
      '<span class="test__meta">Ваш результат</span>' +
      '<div class="score"><div class="score__ring" style="--p:' + Math.round(score / 21 * 100) + ';--c:' + lvl.color + '"><div><span><b>' + score + '</b><small>з 21</small></span></div></div>' +
      '<h3 id="test-title">' + lvl.title + '</h3></div>' +
      '<p class="test__text">' + lvl.text + '</p>' +
      '<div class="test__actions">' +
      (high
        ? '<a href="#contact" class="btn btn--primary" data-goto>Записатися на знайомство −50%</a><button class="btn btn--ghost" data-restart>Пройти ще раз</button>'
        : '<a href="' + (get('social.telegramBot') || '#free') + '" target="_blank" rel="noopener" class="btn btn--primary">Забрати гайд і аудіо</a><a href="#program" class="btn btn--ghost" data-goto>Про програму</a>') +
      '</div>' +
      '<p class="test__disc">Результат тесту — орієнтир, а не діагноз. Якщо вам зараз дуже важко або з\'являються думки про самоушкодження — телефонуйте на лінію Lifeline Ukraine <a href="tel:7333">7333</a> (цілодобово, безкоштовно).</p>';
    $$('[data-goto]', testBody).forEach(function (a) { a.addEventListener('click', function () { closeModal(testModal); }); });
    var r = $('[data-restart]', testBody);
    if (r) r.addEventListener('click', function () { answers = []; renderQ(0); });
  };

  $$('[data-open-test]').forEach(function (b) {
    b.addEventListener('click', function () { renderIntro(); openModal(testModal); });
  });

  /* ---------- Кнопки, що попередньо обирають формат у формі ---------- */
  var form = $('#lead-form');
  var pickedNote = '';
  $$('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      var val = a.getAttribute('data-pick');
      var radio = form && $('input[name="format"][value="' + val + '"]', form);
      if (radio) radio.checked = true;
      pickedNote = a.getAttribute('data-note') || '';
    });
  });

  /* ---------- Відправлення заявки ---------- */
  var send = function (data) {
    var lead = CFG.lead || {};
    if (lead.endpoint) {
      return fetch(lead.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
    }
    var tg = lead.telegram || {};
    if (tg.botToken && tg.chatId) {
      var text = [
        '🌿 Нова заявка з сайту',
        '',
        '👤 ' + data.name,
        '📞 ' + data.phone,
        data.telegram ? '✈️ ' + data.telegram : '',
        '📌 ' + data.format + (data.tariff ? ' · ' + data.tariff : ''),
        data.message ? '💬 ' + data.message : '',
        data.test ? '🧭 Тест GAD-7: ' + data.test : ''
      ].filter(Boolean).join('\n');
      return fetch('https://api.telegram.org/bot' + tg.botToken + '/sendMessage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tg.chatId, text: text })
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
    }
    console.info('[Демо-режим] Заявка:', data);
    return new Promise(function (res) { setTimeout(res, 600); });
  };

  if (form) {
    var fieldOf = function (name) { return form.elements[name].closest('.field'); };
    ['name', 'phone'].forEach(function (n) {
      form.elements[n].addEventListener('input', function () { fieldOf(n).classList.remove('is-error'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var ok = true;
      if (name.length < 2) { fieldOf('name').classList.add('is-error'); ok = false; }
      if (phone.replace(/\D/g, '').length < 10) { fieldOf('phone').classList.add('is-error'); ok = false; }
      if (!ok) { $('.is-error input', form).focus(); return; }

      var btn = $('button[type="submit"]', form);
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Надсилаю…';

      var checked = $('input[name="format"]:checked', form);
      send({
        name: name,
        phone: phone,
        telegram: form.elements.telegram.value.trim(),
        format: checked ? checked.value : '',
        tariff: pickedNote,
        message: form.elements.message.value.trim(),
        test: lastScore || '',
        page: location.href
      }).then(function () {
        form.reset();
        pickedNote = '';
        openModal($('#thanks-modal'));
      }).catch(function (err) {
        console.error(err);
        alert('Не вдалося надіслати заявку. Спробуйте ще раз або напишіть мені в Telegram.');
      }).then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  }

  /* ---------- Подарунок: гайд ---------- */
  var guideModal = $('#guide-modal');
  $$('[data-open-guide]').forEach(function (b) {
    b.addEventListener('click', function () { openModal(guideModal); });
  });
  var printBtn = $('[data-print-guide]');
  if (printBtn) printBtn.addEventListener('click', function () {
    document.body.classList.add('print-guide');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-guide'); });

  /* ---------- Подарунок: практика «Заземлення 5-4-3-2-1» ---------- */
  var STEPS = [
    { n: '✦', title: 'Налаштування', sec: 30, text: 'Сядьте зручно й поставте стопи на підлогу. Зробіть три повільні вдихи носом і довгі видихи ротом. Нікуди не поспішайте.' },
    { n: '5', title: '5 речей, які ви бачите', sec: 60, text: 'Подивіться навколо й назвіть подумки п’ять речей, які ви бачите. Помічайте деталі: колір, форму, світло, тінь.' },
    { n: '4', title: '4 речі, яких можна торкнутися', sec: 60, text: 'Відчуйте чотири речі, яких торкається ваше тіло: тканину одягу, поверхню стільця, підлогу під ногами, власні долоні.' },
    { n: '3', title: '3 звуки, які ви чуєте', sec: 60, text: 'Прислухайтеся й знайдіть три звуки: далекі й близькі, гучні й ледь помітні. Просто помічайте їх, не оцінюючи.' },
    { n: '2', title: '2 запахи', sec: 45, text: 'Знайдіть два запахи навколо: повітря в кімнаті, одяг, чай чи кава. Якщо запахів немає, згадайте два улюблені.' },
    { n: '1', title: '1 смак', sec: 45, text: 'Помітьте смак у роті або зробіть ковток води. Зосередьтеся на цьому відчутті кілька подихів.' },
    { n: '✓', title: 'Завершення', sec: 30, text: 'Ще раз відчуйте опору під ногами. Ви тут, у цьому моменті, і ви в безпеці. Подякуйте собі за цю хвилину турботи.' }
  ];
  var practiceModal = $('#practice-modal');
  if (practiceModal) {
    var pStep = 0, pLeft = STEPS[0].sec, pTimer = null, pVoice = null;
    var arc = $('#practice-arc'), CIRC = 2 * Math.PI * 54;
    var playBtn = $('#practice-play'), voiceBox = $('#practice-voice');
    var synth = window.speechSynthesis;

    var pickVoice = function () {
      if (!synth) return null;
      var v = synth.getVoices().filter(function (x) { return /^uk/i.test(x.lang); });
      return v[0] || null;
    };
    var updateVoiceUi = function () {
      var label = voiceBox.closest('label');
      if (!pVoice) {
        label.hidden = true;
        $('#practice-note').textContent = 'Сядьте зручно. Читайте підказку — таймер сам перейде до наступного кроку. Голосовий супровід у цьому браузері недоступний (працює, наприклад, у Microsoft Edge).';
      } else {
        label.hidden = false;
        $('#practice-note').textContent = 'Сядьте зручно. Можна заплющити очі й слухати підказки. Практику можна проходити в будь-якому темпі.';
      }
    };
    if (synth) {
      pVoice = pickVoice();
      synth.onvoiceschanged = function () { pVoice = pickVoice(); updateVoiceUi(); };
    }
    var speak = function (t) {
      if (!synth || !pVoice || !voiceBox.checked) return;
      synth.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.voice = pVoice; u.lang = pVoice.lang; u.rate = .88;
      synth.speak(u);
    };
    var drawArc = function () {
      arc.style.strokeDasharray = CIRC;
      arc.style.strokeDashoffset = CIRC * (pLeft / STEPS[pStep].sec);
    };
    var renderStep = function (say) {
      var st = STEPS[pStep];
      $('#practice-num').textContent = st.n;
      $('#practice-step').textContent = 'Крок ' + (pStep + 1) + ' з ' + STEPS.length + ' · ' + st.title;
      $('#practice-text').textContent = st.text;
      $('#practice-dots').innerHTML = STEPS.map(function (_, k) {
        return '<i class="' + (k < pStep ? 'done' : k === pStep ? 'on' : '') + '"></i>';
      }).join('');
      $('#practice-prev').disabled = pStep === 0;
      $('#practice-next').textContent = pStep === STEPS.length - 1 ? 'Завершити' : 'Далі →';
      drawArc();
      if (say) speak(st.title + '. ' + st.text);
    };
    var stop = function () {
      clearInterval(pTimer); pTimer = null;
      practiceModal.classList.remove('is-playing');
      if (!playBtn.dataset.restart) playBtn.textContent = 'Продовжити';
    };
    var finish = function () {
      playBtn.dataset.restart = '1';
      stop(); if (synth) synth.cancel();
      pStep = STEPS.length - 1; pLeft = 0; renderStep(false);
      $('#practice-text').textContent = 'Практику завершено. Повертайтеся до неї щоразу, коли думки несуть. А якщо тривога з’являється часто — запишіться на знайомство, розберемо, що з вами відбувається.';
      playBtn.textContent = 'Пройти ще раз';
    };
    var go = function (k) {
      if (k >= STEPS.length) { finish(); return; }
      pStep = Math.max(0, k); pLeft = STEPS[pStep].sec;
      renderStep(!!pTimer);
    };
    var reset = function () {
      delete playBtn.dataset.restart;
      clearInterval(pTimer); pTimer = null;
      practiceModal.classList.remove('is-playing');
      pStep = 0; pLeft = STEPS[0].sec; playBtn.textContent = 'Почати';
      renderStep(false);
    };

    playBtn.addEventListener('click', function () {
      if (playBtn.dataset.restart) reset();
      if (pTimer) { stop(); if (synth) synth.cancel(); return; }
      practiceModal.classList.add('is-playing');
      playBtn.textContent = 'Пауза';
      if (pLeft === STEPS[pStep].sec) speak(STEPS[pStep].title + '. ' + STEPS[pStep].text);
      pTimer = setInterval(function () {
        pLeft -= 1; drawArc();
        if (pLeft <= 0) go(pStep + 1);
      }, 1000);
    });
    $('#practice-next').addEventListener('click', function () { go(pStep + 1); });
    $('#practice-prev').addEventListener('click', function () { go(pStep - 1); });
    voiceBox.addEventListener('change', function () { if (!voiceBox.checked && synth) synth.cancel(); });
    $$('[data-open-practice]').forEach(function (b) {
      b.addEventListener('click', function () { reset(); updateVoiceUi(); openModal(practiceModal); });
    });
    var halt = function () { clearInterval(pTimer); pTimer = null; practiceModal.classList.remove('is-playing'); if (synth) synth.cancel(); };
    $$('[data-close]', practiceModal).forEach(function (b) { b.addEventListener('click', halt); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') halt(); });
  }
})();
