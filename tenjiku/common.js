/**
 * 天竺 広東倶楽部 — 单店后台共用
 */
(function (global) {
  const STORE_ID = 'tenjiku-kanton';
  const STORE_NAME = '天竺 広東倶楽部';
  const PASS = 'tenjiku2026';
  const AUTH_KEY = STORE_ID + '_auth';
  const LANG_KEY = STORE_ID + '_lang';
  const KEY_TABLES = STORE_ID + '_tables';
  const KEY_LOGS = STORE_ID + '_logs_';
  const MAP = 'https://maps.app.goo.gl/UBGXEeJifYKAGybHA';
  const TAGS = ['宴会', '常連', '初来', '会社', '記念日', 'VIP', 'アレルギー'];

  function tokyoYmd(offsetDays) {
    const d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const g = (t) => p.find((i) => i.type === t).value;
    return g('year') + '-' + g('month') + '-' + g('day');
  }

  function jpDate(ymd) {
    const [y, m, d] = String(ymd).split('-');
    return y + '年' + Number(m) + '月' + Number(d) + '日';
  }

  function yen(n) {
    return '¥' + Number(n || 0).toLocaleString('ja-JP');
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'ja';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }

  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }

  function login(pwd) {
    if (String(pwd || '').trim() !== PASS) return false;
    sessionStorage.setItem(AUTH_KEY, '1');
    return true;
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function requireAuth() {
    if (!isAuthed()) {
      location.replace('index.html');
      return false;
    }
    return true;
  }

  const TODAY_ORDERS = [
    {
      start: '18:00',
      end: '20:00',
      title: '2人，点心コース 12800',
      description: 'Chen · +81 90-1111-2222',
      people: 2,
      project: 12800,
      settle: 1280,
    },
    {
      start: '19:00',
      end: '21:30',
      title: '4人，宴会コース 24600',
      description: '田中 · 誕生日',
      people: 4,
      project: 24600,
      settle: 2460,
    },
    {
      start: '19:30',
      end: '21:00',
      title: '3人，会社接待 19600',
      description: '山田商事',
      people: 3,
      project: 19600,
      settle: 1960,
    },
  ];

  const YESTERDAY_ORDERS = [
    {
      start: '17:30',
      end: '19:30',
      title: '2人，ランチコース 9800',
      description: 'Imogen · +81 80-3333-4444',
      people: 2,
      project: 9800,
      settle: 980,
    },
    {
      start: '18:30',
      end: '20:30',
      title: '5人，宴会 32800',
      description: '京都観光団体',
      people: 5,
      project: 32800,
      settle: 3280,
    },
    {
      start: '19:00',
      end: '21:00',
      title: '2人，記念日 15800',
      description: '佐藤',
      people: 2,
      project: 15800,
      settle: 1580,
    },
  ];

  const MONTH_STATS = {
    orders: 42,
    sales: 1280400,
    settle: 128040,
  };

  const TREND = {
    labels: ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
    orders: [28, 31, 36, 40, 38, 42],
    settle: [98000, 110000, 125000, 140000, 132000, 148000],
  };

  function defaultTables() {
    return [
      { id: 't1', name: '1', seats: 2, status: 'busy', guests: 2, spend: 12800, tags: ['常連'], note: '' },
      { id: 't2', name: '2', seats: 2, status: 'free', guests: 0, spend: 0, tags: [], note: '' },
      { id: 't3', name: '3', seats: 4, status: 'busy', guests: 4, spend: 24600, tags: ['宴会'], note: '誕生日ケーキ' },
      { id: 't4', name: '4', seats: 4, status: 'free', guests: 0, spend: 0, tags: [], note: '' },
      { id: 't5', name: '5', seats: 4, status: 'reserved', guests: 3, spend: 0, tags: ['会社'], note: '19:30 予約' },
      { id: 't6', name: '6', seats: 6, status: 'free', guests: 0, spend: 0, tags: [], note: '' },
      { id: 't7', name: '7', seats: 6, status: 'free', guests: 0, spend: 0, tags: [], note: '' },
      { id: 't8', name: '8', seats: 8, status: 'free', guests: 0, spend: 0, tags: [], note: '' },
    ];
  }

  function loadTables() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_TABLES) || 'null');
      if (Array.isArray(raw) && raw.length) return raw;
    } catch (e) {}
    const seed = defaultTables();
    saveTables(seed);
    return seed;
  }

  function saveTables(list) {
    localStorage.setItem(KEY_TABLES, JSON.stringify(list));
  }

  function loadLogs(ymd) {
    try {
      return JSON.parse(localStorage.getItem(KEY_LOGS + (ymd || tokyoYmd(0))) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveLogs(list, ymd) {
    localStorage.setItem(KEY_LOGS + (ymd || tokyoYmd(0)), JSON.stringify(list));
  }

  function bindLangButtons(root) {
    const lang = getLang();
    (root || document).querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === lang);
      b.addEventListener('click', () => {
        setLang(b.dataset.lang);
        location.reload();
      });
    });
  }

  global.Tenjiku = {
    STORE_ID,
    STORE_NAME,
    PASS,
    MAP,
    TAGS,
    TODAY_ORDERS,
    YESTERDAY_ORDERS,
    MONTH_STATS,
    TREND,
    tokyoYmd,
    jpDate,
    yen,
    getLang,
    setLang,
    isAuthed,
    login,
    logout,
    requireAuth,
    loadTables,
    saveTables,
    loadLogs,
    saveLogs,
    bindLangButtons,
  };
})(window);
