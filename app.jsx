/* App: routing, search, i18n, theme. Mounts #root. */
const { useState: uState, useMemo, useEffect: uEffect } = React;

/* ---------- i18n ---------- */
const STR = {
  appTitle: { zh: "測試制具查詢系統", en: "Test Fixture Finder" },
  appSub: { zh: "供應商專用 · 腳踏車品管部門", en: "Supplier portal · Bicycle QC" },
  searchPlaceholder: { zh: "搜尋測試項目、制具或標準條文…", en: "Search test items, fixtures or clauses…" },
  searchHint: { zh: "可依「測試項目」、「分類」、「制具名稱」或「標準條文編號」即時篩選", en: "Filter live by test item, category, fixture name or standard clause" },
  all: { zh: "全部", en: "All" },
  resultsOne: { zh: "項測試", en: "test" },
  resultsMany: { zh: "項測試", en: "tests" },
  noResults: { zh: "找不到符合條件的測試項目", en: "No matching test items" },
  noResultsHint: { zh: "請嘗試其他關鍵字，或清除搜尋條件", en: "Try another keyword or clear the search" },
  clear: { zh: "清除", en: "Clear" },
  statusReady: { zh: "可測", en: "Ready" },
  statusDraft: { zh: "草稿", en: "Draft" },
  fixturesUnit: { zh: "件制具", en: "fixtures" },
  back: { zh: "返回列表", en: "All tests" },
  overview: { zh: "概述", en: "Overview" },
  testParams: { zh: "測試參數", en: "Test parameters" },
  setupSchematic: { zh: "設定示意圖", en: "Setup schematic" },
  fixtureList: { zh: "所需制具清單", en: "Required fixtures" },
  colFixture: { zh: "制具", en: "Fixture" },
  colPart: { zh: "編號", en: "Part no." },
  colQty: { zh: "數量", en: "Qty" },
  colTorque: { zh: "鎖固扭矩", en: "Torque" },
  installSteps: { zh: "安裝步驟", en: "Installation steps" },
  step: { zh: "步驟", en: "Step" },
  uploadPhoto: { zh: "上傳實拍", en: "Upload photo" },
  replace: { zh: "更換", en: "Replace" },
  revert: { zh: "還原", en: "Revert" },
  yourPhoto: { zh: "已上傳實拍", en: "Your photo" },
  dropHere: { zh: "放開以上傳", en: "Drop to upload" },
  print: { zh: "列印 / 匯出", en: "Print / export" },
  standard: { zh: "對應標準", en: "Standard" },
  totalParts: { zh: "制具件數", en: "Total parts" },
  jumpFixtures: { zh: "制具清單", en: "Fixtures" },
  jumpSteps: { zh: "安裝步驟", en: "Steps" },
};

function makeT(lang) {
  return (key) => {
    const o = STR[key];
    return o ? (o[lang] != null ? o[lang] : o.en) : key;
  };
}

/* ---------- Theme application ---------- */
function applyTheme(name) {
  const th = window.THEMES[name] || window.THEMES.blueprint;
  const root = document.documentElement;
  Object.entries(th.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty("--body-font", th.vars["--body-font"] || th.vars["--font"]);
  root.setAttribute("data-theme", name);
}

/* ================= HOME ================= */
function Home({ lang, t, theme, onOpen }) {
  const [q, setQ] = uState("");
  const [cat, setCat] = uState("all");
  const items = window.DATA.ITEMS;
  const L = (o) => (o && o[lang] != null ? o[lang] : o);

  const cats = useMemo(() => {
    const m = new Map();
    items.forEach((it) => {
      const k = it.category.en;
      if (!m.has(k)) m.set(k, { key: k, label: L(it.category), count: 0 });
      m.get(k).count++;
    });
    return [{ key: "all", label: t("all"), count: items.length }, ...m.values()];
  }, [lang]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (cat !== "all" && it.category.en !== cat) return false;
      if (!needle) return true;
      const hay = [
        it.code, it.standard, it.clause, it.category.zh, it.category.en,
        it.name.zh, it.name.en,
        ...it.fixtures.map((f) => f.name.zh + " " + f.name.en + " " + f.code),
      ].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [q, cat, lang]);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-kicker">
            <span className="kick-dot" />ISO 4210 · {lang === "zh" ? "制具與設定資料庫" : "Fixtures & setup library"}
          </div>
          <h1 className="hero-title">{lang === "zh" ? "查詢任一測試項目所需的制具與安裝步驟" : "Find the fixtures and setup for any test."}</h1>
          <div className="searchbar">
            <Icon name="search" size={20} />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} autoFocus
            />
            {q && <button className="search-clear" onClick={() => setQ("")} aria-label={t("clear")}><Icon name="x" size={16} /></button>}
          </div>
          <p className="hero-hint">{t("searchHint")}</p>
        </div>
      </section>

      <section className="list-section">
        <div className="list-toolbar">
          <FilterChips cats={cats} active={cat} onPick={setCat} t={t} />
          <span className="result-count">
            <strong>{results.length}</strong> {results.length === 1 ? t("resultsOne") : t("resultsMany")}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="empty">
            <Icon name="search" size={30} />
            <p className="empty-title">{t("noResults")}</p>
            <p className="empty-hint">{t("noResultsHint")}</p>
            <button className="btn" onClick={() => { setQ(""); setCat("all"); }}>{t("clear")}</button>
          </div>
        ) : (
          <div className="grid">
            {results.map((it) => <ItemCard key={it.id} item={it} lang={lang} t={t} onOpen={onOpen} />)}
          </div>
        )}
      </section>
    </div>
  );
}

/* ================= DETAIL ================= */
function Detail({ item, lang, t, onBack, onZoom }) {
  const L = (o) => (o && o[lang] != null ? o[lang] : o);
  const totalParts = item.fixtures.reduce((s, f) => s + f.qty, 0);
  uEffect(() => { window.scrollTo(0, 0); }, [item.id]);

  return (
    <div className="detail">
      <div className="detail-bar">
        <button className="back" onClick={onBack}><Icon name="arrowLeft" size={18} />{t("back")}</button>
        <button className="btn ghost no-print" onClick={() => window.print()}><Icon name="print" size={16} />{t("print")}</button>
      </div>

      <header className="detail-head">
        <div className="dh-left">
          <div className="dh-codes">
            <span className="dh-code">{item.code}</span>
            <span className="dh-cat">{L(item.category)}</span>
            <StatusBadge status={item.status} t={t} />
          </div>
          <h1 className="dh-title">{L(item.name)}</h1>
          <p className="dh-summary">{L(item.summary)}</p>
          <div className="dh-meta">
            <span className="meta-pill"><span className="mp-k">{t("standard")}</span><span className="mp-v mono">{item.standard} {item.clause}</span></span>
            <span className="meta-pill"><span className="mp-k">{t("totalParts")}</span><span className="mp-v mono">{totalParts}</span></span>
            <span className="meta-pill"><span className="mp-k">{t("installSteps")}</span><span className="mp-v mono">{item.steps.length}</span></span>
          </div>
        </div>
        <figure className="dh-figure">
          <button className="dh-img" onClick={() => onZoom(item.schematic, L(item.name))}>
            <img src={item.schematic} alt={L(item.name)} />
          </button>
          <figcaption><Icon name="ruler" size={13} />{t("setupSchematic")}</figcaption>
        </figure>
      </header>

      <section className="block">
        <h2 className="block-h"><span className="bh-num">01</span><span className="bh-title">{t("testParams")}</span></h2>
        <ParamGrid params={item.params} lang={lang} />
      </section>

      <section className="block">
        <h2 className="block-h"><span className="bh-num">02</span><span className="bh-title">{t("fixtureList")}</span>
          <span className="block-aside mono">{item.fixtures.length} {t("fixturesUnit")} · {totalParts} pcs</span>
        </h2>
        <FixtureTable fixtures={item.fixtures} lang={lang} t={t} onZoom={onZoom} />
      </section>

      <section className="block">
        <h2 className="block-h"><span className="bh-num">03</span><span className="bh-title">{t("installSteps")}</span></h2>
        <ol className="steps">
          {item.steps.map((s, i) => (
            <li className="step" key={i}>
              <div className="step-text">
                <div className="step-n">{t("step")} {String(i + 1).padStart(2, "0")}</div>
                <h3 className="step-title">{L(s.title)}</h3>
                <p className="step-desc">{L(s.desc)}</p>
              </div>
              <StepImage
                storeKey={"bff:" + item.id + ":step" + i}
                fallback={s.image} t={t} alt={L(s.title)} onZoom={onZoom}
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/* ================= LOGIN ================= */
function Login({ lang, setLang, t, onLogin }) {
  const [mode, setMode] = uState("vendor"); // vendor | admin
  const [sel, setSel] = uState(null);
  const [code, setCode] = uState("");
  const [err, setErr] = uState("");
  const L = (o) => L2(o, lang);
  const isAdmin = mode === "admin";

  function submit(e) {
    if (e) e.preventDefault();
    const target = isAdmin ? window.AUTH.ADMIN : sel;
    if (!isAdmin && !sel) { setErr(lang === "zh" ? "請先選擇貴公司" : "Please select your company"); return; }
    if (!code.trim()) { setErr(lang === "zh" ? "請輸入存取碼" : "Enter the access code"); return; }
    if (code.trim() !== target.code) {
      setErr(isAdmin
        ? (lang === "zh" ? "管理員密碼錯誤（示範碼：admin）" : "Wrong admin password (demo: admin)")
        : (lang === "zh" ? "存取碼錯誤（示範碼：1234）" : "Wrong code (demo code: 1234)"));
      return;
    }
    onLogin(target);
  }

  function switchMode(m) { setMode(m); setErr(""); setCode(""); }

  return (
    <div className="login">
      <div className="login-bg" aria-hidden="true" />
      <header className="login-top">
        <div className="brand">
          <span className="brand-mark"><span /></span>
          <span className="brand-txt">
            <span className="brand-title">{t("appTitle")}</span>
            <span className="brand-sub">{t("appSub")}</span>
          </span>
        </div>
        <div className="langtoggle" role="group" aria-label="language">
          <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </header>

      <form className="login-card" onSubmit={submit}>
        <div className="login-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!isAdmin}
            className={"login-tab" + (!isAdmin ? " on" : "")} onClick={() => switchMode("vendor")}>
            <Icon name="cube" size={15} />{lang === "zh" ? "供應商" : "Vendor"}
          </button>
          <button type="button" role="tab" aria-selected={isAdmin}
            className={"login-tab" + (isAdmin ? " on" : "")} onClick={() => switchMode("admin")}>
            <Icon name="shield" size={15} />{lang === "zh" ? "管理員" : "Admin"}
          </button>
        </div>

        {!isAdmin ? (
          <React.Fragment>
            <h1 className="login-title">{lang === "zh" ? "供應商登入" : "Vendor sign-in"}</h1>
            <p className="login-sub">{lang === "zh" ? "選擇貴公司並輸入存取碼，即可查詢制具、填報庫存盤點。" : "Select your company and enter the access code to query fixtures and file stock-takes."}</p>
            <div className="login-label">{lang === "zh" ? "選擇供應商" : "Select vendor"}</div>
            <div className="vendor-grid">
              {window.AUTH.VENDORS.map((v) => (
                <button type="button" key={v.id}
                  className={"vendor-opt" + (sel && sel.id === v.id ? " on" : "")}
                  onClick={() => { setSel(v); setErr(""); }}>
                  <span className="vo-ava">{L(v.name).trim().charAt(0)}</span>
                  <span className="vo-name">{L(v.name)}</span>
                  {sel && sel.id === v.id && <span className="vo-check"><Icon name="check" size={13} /></span>}
                </button>
              ))}
            </div>
            <div className="login-label">{lang === "zh" ? "存取碼" : "Access code"}</div>
            <input className="login-input mono" type="password" value={code}
              onChange={(e) => { setCode(e.target.value); setErr(""); }}
              placeholder={lang === "zh" ? "示範碼：1234" : "demo: 1234"} autoComplete="off" />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h1 className="login-title">{lang === "zh" ? "管理員登入" : "Admin sign-in"}</h1>
            <p className="login-sub">{lang === "zh" ? "品管部管理員可檢視各供應商回報的制具庫存與需求短缺。" : "QC admins can review every vendor's reported fixture stock and shortages."}</p>
            <div className="admin-id">
              <span className="vo-ava admin-ava"><Icon name="shield" size={16} /></span>
              <span className="vo-name">{L(window.AUTH.ADMIN.name)}</span>
            </div>
            <div className="login-label">{lang === "zh" ? "管理員密碼" : "Admin password"}</div>
            <input className="login-input mono" type="password" value={code} autoFocus
              onChange={(e) => { setCode(e.target.value); setErr(""); }}
              placeholder={lang === "zh" ? "示範碼：admin" : "demo: admin"} autoComplete="off" />
          </React.Fragment>
        )}

        {err && <div className="login-err"><Icon name="x" size={14} />{err}</div>}

        <button className="btn login-btn" type="submit">
          <Icon name="logout" size={16} />{lang === "zh" ? "登入系統" : "Sign in"}
        </button>
        <div className="login-foot">{lang === "zh" ? "示範環境 · 供應商碼 1234 · 管理員碼 admin" : "Demo · vendor code 1234 · admin code admin"}</div>
      </form>
    </div>
  );
}

/* ================= APP ================= */
function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "direction": "blueprint",
    "density": "regular",
    "showSchematic": true
  }/*EDITMODE-END*/;
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [lang, setLang] = uState(() => { try { return localStorage.getItem("bff:lang") || "zh"; } catch (e) { return "zh"; } });
  const [vendor, setVendor] = uState(() => window.AUTH.get());
  const [route, setRoute] = uState(() => parseRoute());
  const [zoom, setZoom] = uState(null);
  const t = makeT(lang);

  uEffect(() => {
    const h = () => setVendor(window.AUTH.get());
    window.addEventListener("bff:authchange", h);
    return () => window.removeEventListener("bff:authchange", h);
  }, []);

  uEffect(() => { applyTheme(tw.direction); }, [tw.direction]);
  uEffect(() => {
    document.documentElement.setAttribute("data-density", tw.density);
  }, [tw.density]);
  uEffect(() => {
    document.documentElement.setAttribute("data-schematic", tw.showSchematic ? "on" : "off");
  }, [tw.showSchematic]);
  uEffect(() => { try { localStorage.setItem("bff:lang", lang); } catch (e) {} }, [lang]);
  uEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const [, bump] = uState(0);
  uEffect(() => {
    const h = () => bump((n) => n + 1);
    window.addEventListener("bff:stockchange", h);
    window.addEventListener("bff:datachange", h);
    return () => { window.removeEventListener("bff:stockchange", h); window.removeEventListener("bff:datachange", h); };
  }, []);

  const open = (id) => { location.hash = "#/item/" + id; };
  const openFixture = (key) => { location.hash = "#/fixture/" + key; };
  const goTests = () => { location.hash = ""; };
  const goFixtures = () => { location.hash = "#/fixtures"; };
  const goStock = () => { location.hash = "#/stock"; };
  const goAdmin = () => { location.hash = "#/admin"; };
  const goManage = () => { location.hash = "#/manage"; };
  const goHistory = () => { location.hash = "#/history"; };
  const editItem = (id) => { location.hash = "#/edit/" + id; };
  const back = () => { location.hash = route.name === "fixtureDetail" ? "#/fixtures" : ""; };
  const item = route.name === "detail" ? window.DATA.ITEMS.find((i) => i.id === route.id) : null;
  const onFixturesArea = route.name === "fixtures" || route.name === "fixtureDetail";
  const dir = window.THEMES[tw.direction];
  const admin = window.AUTH.isAdmin(vendor);

  if (!vendor) {
    return <Login lang={lang} setLang={setLang} t={t} onLogin={(v) => window.AUTH.set(v)} />;
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <button className="brand" onClick={goTests}>
          <span className="brand-mark"><span /></span>
          <span className="brand-txt">
            <span className="brand-title">{t("appTitle")}</span>
            <span className="brand-sub">{t("appSub")}</span>
          </span>
        </button>
        <nav className="topnav" aria-label="sections">
          <button className={"topnav-btn" + (route.name === "list" || route.name === "detail" ? " on" : "")} onClick={goTests}>
            <Icon name="grid" size={15} />{lang === "zh" ? "測試項目" : "Tests"}
          </button>
          <button className={"topnav-btn" + (onFixturesArea ? " on" : "")} onClick={goFixtures}>
            <Icon name="cube" size={15} />{lang === "zh" ? "制具總覽" : "Fixtures"}
          </button>
          {admin ? (
            <React.Fragment>
              <button className={"topnav-btn" + (route.name === "admin" ? " on" : "")} onClick={goAdmin}>
                <Icon name="shield" size={15} />{lang === "zh" ? "供應商盤點" : "Vendor stock"}
              </button>
              <button className={"topnav-btn" + (route.name === "manage" || route.name === "edit" ? " on" : "")} onClick={goManage}>
                <Icon name="pencil" size={15} />{lang === "zh" ? "管理中心" : "Manage"}
              </button>
              <button className={"topnav-btn" + (route.name === "history" ? " on" : "")} onClick={goHistory}>
                <Icon name="clock" size={15} />{lang === "zh" ? "變更歷史" : "History"}
              </button>
            </React.Fragment>
          ) : (
            <button className={"topnav-btn" + (route.name === "stock" ? " on" : "")} onClick={goStock}>
              <Icon name="clipboard" size={15} />{lang === "zh" ? "庫存盤點" : "Stock-take"}
            </button>
          )}
        </nav>
        <div className="topbar-right">
          <div className={"vendor-chip" + (admin ? " is-admin" : "")} title={L2(vendor.name, lang)}>
            <span className="vendor-ava">{admin ? <Icon name="shield" size={15} /> : (L2(vendor.name, lang) || "?").trim().charAt(0)}</span>
            <span className="vendor-txt">
              <span className="vendor-k">{admin ? (lang === "zh" ? "管理員" : "Admin") : (lang === "zh" ? "供應商" : "Vendor")}</span>
              <span className="vendor-n">{L2(vendor.name, lang)}</span>
            </span>
            <button className="vendor-out" onClick={() => window.AUTH.logout()} title={lang === "zh" ? "登出" : "Sign out"}>
              <Icon name="logout" size={15} />
            </button>
          </div>
          <div className="langtoggle" role="group" aria-label="language">
            <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </header>

      <main className="main">
        {route.name === "detail" && item
          ? <Detail item={item} lang={lang} t={t} onBack={goTests} onZoom={(src, cap) => setZoom({ src, cap })} />
          : route.name === "fixtureDetail"
          ? <FixtureDetail fxKey={route.key} lang={lang} t={t} onBack={goFixtures} onOpenTest={open} onZoom={(src, cap) => setZoom({ src, cap })} />
          : route.name === "fixtures"
          ? <FixturesOverview lang={lang} t={t} onOpenFixture={openFixture} onOpenTest={open} />
          : route.name === "admin"
          ? (admin ? <AdminDashboard lang={lang} t={t} onOpenFixture={openFixture} /> : <Home lang={lang} t={t} theme={tw.direction} onOpen={open} />)
          : route.name === "stock"
          ? (admin ? <AdminDashboard lang={lang} t={t} onOpenFixture={openFixture} /> : <StockEntry lang={lang} t={t} goFixtures={goFixtures} />)
          : route.name === "manage"
          ? (admin ? <AdminManage lang={lang} t={t} onEdit={editItem} /> : <Home lang={lang} t={t} theme={tw.direction} onOpen={open} />)
          : route.name === "edit"
          ? (admin ? <TestEditor id={route.id} lang={lang} t={t} onDone={goManage} /> : <Home lang={lang} t={t} theme={tw.direction} onOpen={open} />)
          : route.name === "history"
          ? (admin ? <HistoryPage lang={lang} t={t} /> : <Home lang={lang} t={t} theme={tw.direction} onOpen={open} />)
          : <Home lang={lang} t={t} theme={tw.direction} onOpen={open} />}
      </main>

      <footer className="footer no-print">
        <span>{lang === "zh" ? "腳踏車品管部門 · 測試制具查詢系統 · " + (admin ? "管理員版" : "供應商版") : "Bicycle QC · Test Fixture Finder · " + (admin ? "Admin" : "Supplier") + " edition"}</span>
        <span className="mono foot-dir">{dir && L2(dir.label, lang)}</span>
      </footer>

      <Lightbox img={zoom} onClose={() => setZoom(null)} />

      <TweaksPanel>
        <TweakSection label={lang === "zh" ? "設計方向" : "Design direction"} />
        <div className="dir-cards">
          {Object.entries(window.THEMES).map(([key, th]) => (
            <button key={key}
              className={"dir-card" + (tw.direction === key ? " on" : "")}
              data-dir={key}
              onClick={() => setTweak("direction", key)}>
              <span className="dir-sw"><i /><i /><i /></span>
              <span className="dir-name">{L2(th.label, lang)}</span>
              <span className="dir-blurb">{L2(th.blurb, lang)}</span>
            </button>
          ))}
        </div>
        <TweakSection label={lang === "zh" ? "版面" : "Layout"} />
        <TweakRadio label={lang === "zh" ? "密度" : "Density"} value={tw.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle label={lang === "zh" ? "顯示示意圖" : "Show schematics"} value={tw.showSchematic}
          onChange={(v) => setTweak("showSchematic", v)} />
      </TweaksPanel>
    </div>
  );
}

function L2(o, lang) { return o && o[lang] != null ? o[lang] : (o && o.en) || o; }

function parseRoute() {
  const h = location.hash;
  if (h.startsWith("#/item/")) return { name: "detail", id: h.replace("#/item/", "") };
  if (h.startsWith("#/fixture/")) return { name: "fixtureDetail", key: h.replace("#/fixture/", "") };
  if (h.startsWith("#/fixtures")) return { name: "fixtures" };
  if (h.startsWith("#/stock")) return { name: "stock" };
  if (h.startsWith("#/admin")) return { name: "admin" };
  if (h.startsWith("#/manage")) return { name: "manage" };
  if (h.startsWith("#/edit/")) return { name: "edit", id: h.replace("#/edit/", "") };
  if (h.startsWith("#/history")) return { name: "history" };
  return { name: "list" };
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
