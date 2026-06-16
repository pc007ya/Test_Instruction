/* Admin management: CRUD for test items and vendors. Admin-only routes. */
const { useState: mState, useEffect: mEffect } = React;

/* ---------- reusable form fields ---------- */
function Field({ label, children, hint, wide }) {
  return (
    <label className={"fld" + (wide ? " fld-wide" : "")}>
      <span className="fld-label">{label}{hint && <em className="fld-hint">{hint}</em>}</span>
      {children}
    </label>
  );
}
function BiField({ label, value, onChange, area, ph }) {
  const Tag = area ? "textarea" : "input";
  return (
    <div className="fld fld-wide">
      <span className="fld-label">{label}</span>
      <div className="bi">
        <div className="bi-col">
          <span className="bi-tag">中</span>
          <Tag className="inp" value={value.zh} placeholder={ph && ph.zh} rows={area ? 3 : undefined}
            onChange={(e) => onChange({ ...value, zh: e.target.value })} />
        </div>
        <div className="bi-col">
          <span className="bi-tag">EN</span>
          <Tag className="inp" value={value.en} placeholder={ph && ph.en} rows={area ? 3 : undefined}
            onChange={(e) => onChange({ ...value, en: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Test editor ---------- */
function TestEditor({ id, lang, t, onDone }) {
  const isNew = id === "__new__";
  const [d, setD] = mState(() => isNew ? window.STORE.blankItem() : window.STORE.clone(window.STORE.items_get(id)));
  const [err, setErr] = mState("");
  mEffect(() => { window.scrollTo(0, 0); }, []);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const L = (o) => (o && o[lang] != null ? o[lang] : o);
  const parts = window.DATA.PARTS;
  const partKeys = Object.keys(parts);

  /* params */
  const addParam = () => set({ params: [...d.params, { label: { zh: "", en: "" }, value: "", unit: "" }] });
  const setParam = (i, patch) => set({ params: d.params.map((p, j) => j === i ? { ...p, ...patch } : p) });
  const delParam = (i) => set({ params: d.params.filter((_, j) => j !== i) });

  /* fixtures */
  const addFixture = () => set({ fixtures: [...d.fixtures, window.STORE.fxObj(partKeys[0], 1, "")] });
  const setFixture = (i, key, qty, torque) => set({ fixtures: d.fixtures.map((f, j) => j === i ? window.STORE.fxObj(key, qty, torque) : f) });
  const delFixture = (i) => set({ fixtures: d.fixtures.filter((_, j) => j !== i) });

  /* steps */
  const addStep = () => set({ steps: [...d.steps, { title: { zh: "", en: "" }, desc: { zh: "", en: "" }, image: window.DATA.IMG.frameSchematic }] });
  const setStep = (i, patch) => set({ steps: d.steps.map((s, j) => j === i ? { ...s, ...patch } : s) });
  const delStep = (i) => set({ steps: d.steps.filter((_, j) => j !== i) });
  const moveStep = (i, dir) => {
    const j = i + dir; if (j < 0 || j >= d.steps.length) return;
    const arr = d.steps.slice(); const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; set({ steps: arr });
  };
  function loadStepImg(i, file) {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setStep(i, { image: r.result });
    r.readAsDataURL(file);
  }
  function loadSchematic(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => set({ schematic: r.result });
    r.readAsDataURL(file);
  }

  function save() {
    if (!d.code.trim()) { setErr(lang === "zh" ? "請輸入測試代號" : "Enter a test code"); return; }
    if (!d.name.zh.trim() && !d.name.en.trim()) { setErr(lang === "zh" ? "請輸入測試名稱" : "Enter a test name"); return; }
    window.STORE.items_save(window.STORE.clone(d));
    onDone();
  }

  return (
    <div className="detail editor">
      <div className="detail-bar">
        <button className="back" onClick={onDone}><Icon name="arrowLeft" size={18} />{lang === "zh" ? "返回管理" : "Back to manage"}</button>
        <div className="ed-actions">
          <button className="btn ghost" onClick={onDone}>{lang === "zh" ? "取消" : "Cancel"}</button>
          <button className="btn" onClick={save}><Icon name="check" size={16} />{lang === "zh" ? "儲存" : "Save"}</button>
        </div>
      </div>

      <h1 className="ed-title">{isNew ? (lang === "zh" ? "新增測試項目" : "New test item") : (lang === "zh" ? "編輯測試項目" : "Edit test item")}
        {!isNew && <span className="ed-code mono">{d.code}</span>}</h1>
      {err && <div className="login-err"><Icon name="x" size={14} />{err}</div>}

      <section className="ed-block">
        <h2 className="ed-h">{lang === "zh" ? "基本資料" : "Basics"}</h2>
        <div className="ed-grid">
          <Field label={lang === "zh" ? "測試代號" : "Code"}><input className="inp mono" value={d.code} onChange={(e) => set({ code: e.target.value })} placeholder="B-04" /></Field>
          <Field label={lang === "zh" ? "狀態" : "Status"}>
            <select className="inp" value={d.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="ready">{lang === "zh" ? "可測" : "Ready"}</option>
              <option value="draft">{lang === "zh" ? "草稿" : "Draft"}</option>
            </select>
          </Field>
          <Field label={lang === "zh" ? "對應標準" : "Standard"}><input className="inp mono" value={d.standard} onChange={(e) => set({ standard: e.target.value })} placeholder="ISO 4210-6:2023" /></Field>
          <Field label={lang === "zh" ? "標準條文" : "Clause"}><input className="inp mono" value={d.clause} onChange={(e) => set({ clause: e.target.value })} placeholder="§4.4" /></Field>
        </div>
        <BiField label={lang === "zh" ? "分類" : "Category"} value={d.category} onChange={(v) => set({ category: v })} ph={{ zh: "車架", en: "Frame" }} />
        <BiField label={lang === "zh" ? "測試名稱" : "Test name"} value={d.name} onChange={(v) => set({ name: v })} />
        <BiField label={lang === "zh" ? "概述" : "Summary"} value={d.summary} onChange={(v) => set({ summary: v })} area />
        <div className="fld fld-wide">
          <span className="fld-label">{lang === "zh" ? "設定示意圖" : "Setup schematic"}<em className="fld-hint">{lang === "zh" ? "顯示於測試詳情頁" : "shown on the test detail page"}</em></span>
          <div className="sch-edit">
            <img className="sch-img" src={d.schematic} alt="" />
            <div className="sch-tools">
              <label className="mini-btn"><Icon name="upload" size={13} />{lang === "zh" ? "上傳示意圖" : "Upload schematic"}
                <input type="file" accept="image/*" hidden onChange={(e) => loadSchematic(e.target.files[0])} /></label>
              {d.schematic !== window.DATA.IMG.frameSchematic &&
                <button className="mini-btn ghost" onClick={() => set({ schematic: window.DATA.IMG.frameSchematic })}>{lang === "zh" ? "還原預設" : "Revert"}</button>}
            </div>
          </div>
        </div>
      </section>

      <section className="ed-block">
        <h2 className="ed-h">{lang === "zh" ? "測試參數" : "Test parameters"}<button className="addrow" onClick={addParam}><Icon name="plus" size={14} />{lang === "zh" ? "新增參數" : "Add"}</button></h2>
        {d.params.length === 0 && <p className="ed-empty">{lang === "zh" ? "尚無參數" : "No parameters yet"}</p>}
        <div className="ed-rows">
          {d.params.map((p, i) => (
            <div className="prow" key={i}>
              <input className="inp" placeholder={lang === "zh" ? "項目（中）" : "Label (zh)"} value={p.label.zh} onChange={(e) => setParam(i, { label: { ...p.label, zh: e.target.value } })} />
              <input className="inp" placeholder={lang === "zh" ? "項目（EN）" : "Label (en)"} value={p.label.en} onChange={(e) => setParam(i, { label: { ...p.label, en: e.target.value } })} />
              <input className="inp mono" placeholder={lang === "zh" ? "數值" : "Value"} value={typeof p.value === "object" ? (p.value[lang] || "") : p.value} onChange={(e) => setParam(i, { value: e.target.value })} />
              <input className="inp mono se-unit" placeholder={lang === "zh" ? "單位" : "Unit"} value={p.unit} onChange={(e) => setParam(i, { unit: e.target.value })} />
              <button className="delrow" onClick={() => delParam(i)} aria-label="delete"><Icon name="trash" size={15} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="ed-block">
        <h2 className="ed-h">{lang === "zh" ? "所需制具清單" : "Required fixtures"}<button className="addrow" onClick={addFixture}><Icon name="plus" size={14} />{lang === "zh" ? "新增制具" : "Add"}</button></h2>
        {d.fixtures.length === 0 && <p className="ed-empty">{lang === "zh" ? "尚無制具" : "No fixtures yet"}</p>}
        <div className="ed-rows">
          {d.fixtures.map((f, i) => (
            <div className="frow" key={i}>
              <img className="frow-img" src={f.image} alt="" />
              <select className="inp" value={f.key} onChange={(e) => setFixture(i, e.target.value, f.qty, f.torque)}>
                {partKeys.map((k) => <option key={k} value={k}>{L(parts[k].name)} — {parts[k].code}</option>)}
              </select>
              <span className="frow-qty">
                <span className="qlab">{lang === "zh" ? "數量" : "Qty"}</span>
                <input className="inp mono" type="number" min="0" value={f.qty} onChange={(e) => setFixture(i, f.key, e.target.value, f.torque)} />
              </span>
              <input className="inp mono frow-torque" placeholder={lang === "zh" ? "扭矩" : "Torque"} value={f.torque || ""} onChange={(e) => setFixture(i, f.key, f.qty, e.target.value)} />
              <button className="delrow" onClick={() => delFixture(i)} aria-label="delete"><Icon name="trash" size={15} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="ed-block">
        <h2 className="ed-h">{lang === "zh" ? "安裝步驟" : "Installation steps"}<button className="addrow" onClick={addStep}><Icon name="plus" size={14} />{lang === "zh" ? "新增步驟" : "Add"}</button></h2>
        {d.steps.length === 0 && <p className="ed-empty">{lang === "zh" ? "尚無步驟" : "No steps yet"}</p>}
        <div className="ed-rows">
          {d.steps.map((s, i) => (
            <div className="srow" key={i}>
              <div className="srow-head">
                <span className="srow-n mono">{lang === "zh" ? "步驟" : "Step"} {String(i + 1).padStart(2, "0")}</span>
                <div className="srow-tools">
                  <button className="icobtn" disabled={i === 0} onClick={() => moveStep(i, -1)} aria-label="up"><Icon name="arrowUp" size={14} /></button>
                  <button className="icobtn" disabled={i === d.steps.length - 1} onClick={() => moveStep(i, 1)} aria-label="down"><Icon name="arrowDown" size={14} /></button>
                  <button className="delrow" onClick={() => delStep(i)} aria-label="delete"><Icon name="trash" size={15} /></button>
                </div>
              </div>
              <div className="srow-body">
                <div className="srow-fields">
                  <BiField label={lang === "zh" ? "標題" : "Title"} value={s.title} onChange={(v) => setStep(i, { title: v })} />
                  <BiField label={lang === "zh" ? "說明" : "Description"} value={s.desc} onChange={(v) => setStep(i, { desc: v })} area />
                </div>
                <div className="srow-img">
                  <img src={s.image} alt="" />
                  <label className="mini-btn">
                    <Icon name="upload" size={13} />{lang === "zh" ? "更換圖片" : "Replace image"}
                    <input type="file" accept="image/*" hidden onChange={(e) => loadStepImg(i, e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ed-foot">
        <button className="btn ghost" onClick={onDone}>{lang === "zh" ? "取消" : "Cancel"}</button>
        <button className="btn" onClick={save}><Icon name="check" size={16} />{lang === "zh" ? "儲存測試項目" : "Save test item"}</button>
      </div>
    </div>
  );
}

/* ---------- Vendor editor row (inline) ---------- */
function VendorRow({ v, lang, onSave, onDelete }) {
  const [edit, setEdit] = mState(false);
  const [draft, setDraft] = mState(v);
  mEffect(() => setDraft(v), [v]);
  const L = (o) => (o && o[lang] != null ? o[lang] : o);
  if (!edit) {
    return (
      <div className="vrow">
        <span className="vrow-ava">{L(v.name).trim().charAt(0)}</span>
        <span className="vrow-main"><span className="vrow-name">{L(v.name)}</span><span className="vrow-id mono">{v.id}</span></span>
        <span className="vrow-code mono">{lang === "zh" ? "存取碼" : "Code"} {v.code}</span>
        <button className="icobtn" onClick={() => { setDraft(v); setEdit(true); }} aria-label="edit"><Icon name="pencil" size={15} /></button>
        <button className="delrow" onClick={() => onDelete(v)} aria-label="delete"><Icon name="trash" size={15} /></button>
      </div>
    );
  }
  return (
    <div className="vrow vrow-edit">
      <div className="vrow-inputs">
        <input className="inp" placeholder={lang === "zh" ? "公司名稱（中）" : "Name (zh)"} value={draft.name.zh} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, zh: e.target.value } })} />
        <input className="inp" placeholder={lang === "zh" ? "公司名稱（EN）" : "Name (en)"} value={draft.name.en} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, en: e.target.value } })} />
        <input className="inp mono vrow-codein" placeholder={lang === "zh" ? "存取碼" : "Code"} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
      </div>
      <button className="btn sm" onClick={() => { onSave(draft); setEdit(false); }}><Icon name="check" size={14} />{lang === "zh" ? "儲存" : "Save"}</button>
      <button className="btn ghost sm" onClick={() => setEdit(false)}>{lang === "zh" ? "取消" : "Cancel"}</button>
    </div>
  );
}

/* ---------- Part (fixture library) editor modal ---------- */
function PartEditor({ pkey, lang, onClose }) {
  const isNew = pkey === "__new__";
  const [key] = mState(() => isNew ? window.STORE.newPartKey() : pkey);
  const [d, setD] = mState(() => isNew ? window.STORE.blankPart() : window.STORE.clone(window.STORE.parts_get(pkey)));
  const [err, setErr] = mState("");
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  function loadImg(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => set({ image: r.result });
    r.readAsDataURL(file);
  }
  function save() {
    if (!d.code.trim()) { setErr(lang === "zh" ? "請輸入制具編號" : "Enter a part number"); return; }
    if (!d.name.zh.trim() && !d.name.en.trim()) { setErr(lang === "zh" ? "請輸入制具名稱" : "Enter a name"); return; }
    window.STORE.parts_save(key, window.STORE.clone(d));
    onClose();
  }
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isNew ? (lang === "zh" ? "新增制具" : "New fixture") : (lang === "zh" ? "編輯制具" : "Edit fixture")}</h3>
          <button className="icobtn" onClick={onClose} aria-label="close"><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="pe-img">
            <img src={d.image} alt="" />
            <label className="mini-btn"><Icon name="upload" size={13} />{lang === "zh" ? "上傳制具圖" : "Upload image"}
              <input type="file" accept="image/*" hidden onChange={(e) => loadImg(e.target.files[0])} /></label>
          </div>
          <div className="pe-fields">
            <div className="ed-grid">
              <Field label={lang === "zh" ? "制具編號" : "Part no."}><input className="inp mono" value={d.code} onChange={(e) => set({ code: e.target.value })} placeholder="DIN912 M12×35" /></Field>
              <Field label={lang === "zh" ? "系統庫存" : "Default stock"}><input className="inp mono" type="number" min="0" value={d.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>
              <Field label={lang === "zh" ? "儲位" : "Location"}><input className="inp mono" value={d.loc} onChange={(e) => set({ loc: e.target.value })} placeholder="C4-02" /></Field>
            </div>
            <BiField label={lang === "zh" ? "名稱" : "Name"} value={d.name} onChange={(v) => set({ name: v })} />
            <BiField label={lang === "zh" ? "類別" : "Kind"} value={d.kind} onChange={(v) => set({ kind: v })} ph={{ zh: "緊固件", en: "Fastener" }} />
          </div>
        </div>
        {err && <div className="login-err modal-err"><Icon name="x" size={14} />{err}</div>}
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>{lang === "zh" ? "取消" : "Cancel"}</button>
          <button className="btn" onClick={save}><Icon name="check" size={16} />{lang === "zh" ? "儲存" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Backup / restore panel ---------- */
function BackupPanel({ lang }) {
  const [msg, setMsg] = mState(null);
  function exportFile() {
    const snap = window.STORE.exportSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fixture-system-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setMsg({ ok: true, t: lang === "zh" ? "已匯出備份檔。放到共用 Google 雲端硬碟即可分享。" : "Backup exported. Drop it in shared Google Drive to share." });
  }
  function importFile(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const snap = JSON.parse(r.result);
        if (!window.confirm(lang === "zh" ? "還原將覆蓋目前所有資料，確定繼續？" : "Restore will overwrite all current data. Continue?")) return;
        window.STORE.importSnapshot(snap);
        setMsg({ ok: true, t: lang === "zh" ? "已從備份檔還原全部資料。" : "All data restored from backup." });
      } catch (e) {
        setMsg({ ok: false, t: (lang === "zh" ? "還原失敗：" : "Restore failed: ") + e.message });
      }
    };
    r.readAsText(file);
  }
  return (
    <div className="backup">
      <div className="bk-card">
        <div className="bk-icon"><Icon name="download" size={22} /></div>
        <div className="bk-main">
          <h3 className="bk-h">{lang === "zh" ? "匯出備份" : "Export backup"}</h3>
          <p className="bk-p">{lang === "zh" ? "將測試項目、制具庫、供應商、盤點與變更歷史打包成單一 JSON 檔。" : "Package tests, fixtures, vendors, stock-takes and history into one JSON file."}</p>
          <button className="btn" onClick={exportFile}><Icon name="download" size={16} />{lang === "zh" ? "匯出 JSON 備份" : "Export JSON"}</button>
        </div>
      </div>
      <div className="bk-card">
        <div className="bk-icon"><Icon name="upload" size={22} /></div>
        <div className="bk-main">
          <h3 className="bk-h">{lang === "zh" ? "還原備份" : "Restore backup"}</h3>
          <p className="bk-p">{lang === "zh" ? "從備份 JSON 還原全部資料（會覆蓋目前內容）。可在另一台機器匯入以同步。" : "Restore everything from a backup JSON (overwrites current data). Import on another machine to sync."}</p>
          <label className="btn ghost"><Icon name="upload" size={16} />{lang === "zh" ? "選擇備份檔還原" : "Choose file to restore"}
            <input type="file" accept="application/json,.json" hidden onChange={(e) => importFile(e.target.files[0])} /></label>
        </div>
      </div>
      {msg && <div className={"bk-msg" + (msg.ok ? " ok" : " bad")}><Icon name={msg.ok ? "check" : "x"} size={15} />{msg.t}</div>}
      <div className="bk-note">
        <Icon name="cloud" size={15} />
        <span>{lang === "zh"
          ? "雲端共用：此示範以本機儲存為主。要做即時 Google 雲端同步需搭配後端服務（如 Google Drive API / Firebase）；在此之前，以上備份檔放於共用雲端硬碟即可在團隊間傳遞同一份資料。"
          : "Cloud sharing: this demo is local-first. Live Google Drive sync needs a backend (Drive API / Firebase). Until then, share the backup file via a shared Drive to pass the same dataset across the team."}</span>
      </div>
    </div>
  );
}

/* ---------- Management hub ---------- */
function AdminManage({ lang, t, onEdit }) {
  const [tab, setTab] = mState("tests");
  const [partEdit, setPartEdit] = mState(null);
  const [, bump] = mState(0);
  mEffect(() => { window.scrollTo(0, 0); }, [tab]);
  mEffect(() => {
    const h = () => bump((n) => n + 1);
    window.addEventListener("bff:datachange", h);
    return () => window.removeEventListener("bff:datachange", h);
  }, []);
  const L = (o) => (o && o[lang] != null ? o[lang] : o);
  const items = window.STORE.items_list();
  const vendors = window.STORE.vendors_list();
  const parts = window.STORE.parts_list();

  function delItem(it) {
    if (!window.confirm(lang === "zh" ? `確定刪除測試項目「${L(it.name)}」？` : `Delete test "${L(it.name)}"?`)) return;
    window.STORE.items_delete(it.id);
  }
  function addVendor() {
    const v = { id: "v" + Date.now().toString(36), name: { zh: lang === "zh" ? "新供應商" : "New vendor", en: "New vendor" }, code: "1234" };
    window.STORE.vendors_save(v);
  }
  function delVendor(v) {
    if (!window.confirm(lang === "zh" ? `確定刪除供應商「${L(v.name)}」？其盤點資料將一併移除。` : `Delete vendor "${L(v.name)}"? Their stock-take will be removed.`)) return;
    window.STORE.vendors_delete(v.id);
  }
  function delPart(p) {
    if (!window.confirm(lang === "zh" ? `確定刪除制具「${L(p.name)}」？使用到的測試將同步移除此制具。` : `Delete fixture "${L(p.name)}"? It will be removed from tests that use it.`)) return;
    window.STORE.parts_delete(p.key);
  }

  return (
    <div className="home admin">
      <section className="hero hero-sm">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-kicker"><span className="kick-dot" />{lang === "zh" ? "管理員 · 資料維護" : "Admin · data management"}</div>
          <h1 className="hero-title">{lang === "zh" ? "管理中心" : "Management"}</h1>
          <div className="mtabs">
            <button className={"mtab" + (tab === "tests" ? " on" : "")} onClick={() => setTab("tests")}><Icon name="grid" size={15} />{lang === "zh" ? "測試項目" : "Test items"}<span className="mtab-c">{items.length}</span></button>
            <button className={"mtab" + (tab === "vendors" ? " on" : "")} onClick={() => setTab("vendors")}><Icon name="cube" size={15} />{lang === "zh" ? "供應商名單" : "Vendors"}<span className="mtab-c">{vendors.length}</span></button>
            <button className={"mtab" + (tab === "parts" ? " on" : "")} onClick={() => setTab("parts")}><Icon name="cube" size={15} />{lang === "zh" ? "制具庫" : "Fixtures"}<span className="mtab-c">{parts.length}</span></button>
            <button className={"mtab" + (tab === "backup" ? " on" : "")} onClick={() => setTab("backup")}><Icon name="cloud" size={15} />{lang === "zh" ? "備份與雲端" : "Backup"}</button>
          </div>
        </div>
      </section>

      <section className="list-section">
        {tab === "tests" ? (
          <React.Fragment>
            <div className="mhead">
              <span className="result-count"><strong>{items.length}</strong> {lang === "zh" ? "項測試" : "tests"}</span>
              <button className="btn" onClick={() => onEdit("__new__")}><Icon name="plus" size={16} />{lang === "zh" ? "新增測試項目" : "New test"}</button>
            </div>
            <div className="mlist">
              {items.map((it) => (
                <div className="mitem" key={it.id}>
                  <img className="mitem-img" src={it.schematic} alt="" loading="lazy" />
                  <div className="mitem-main">
                    <div className="mitem-top">
                      <span className="mitem-code mono">{it.code || "—"}</span>
                      <span className="mitem-cat">{L(it.category)}</span>
                      <StatusBadge status={it.status} t={t} />
                    </div>
                    <div className="mitem-name">{L(it.name) || <em className="muted">{lang === "zh" ? "（未命名）" : "(untitled)"}</em>}</div>
                    <div className="mitem-meta mono">{it.standard} {it.clause} · {it.fixtures.length} {lang === "zh" ? "件制具" : "fixtures"} · {it.steps.length} {lang === "zh" ? "步驟" : "steps"}</div>
                  </div>
                  <div className="mitem-actions">
                    <button className="icobtn" onClick={() => onEdit(it.id)} aria-label="edit"><Icon name="pencil" size={16} /></button>
                    <button className="delrow" onClick={() => delItem(it)} aria-label="delete"><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        ) : tab === "vendors" ? (
          <React.Fragment>
            <div className="mhead">
              <span className="result-count"><strong>{vendors.length}</strong> {lang === "zh" ? "家供應商" : "vendors"}</span>
              <button className="btn" onClick={addVendor}><Icon name="plus" size={16} />{lang === "zh" ? "新增供應商" : "Add vendor"}</button>
            </div>
            <div className="vlist">
              {vendors.map((v) => (
                <VendorRow key={v.id} v={v} lang={lang}
                  onSave={(nv) => window.STORE.vendors_save(nv)}
                  onDelete={delVendor} />
              ))}
            </div>
            <p className="se-foot">{lang === "zh" ? "供應商以此名單登入；刪除後其帳號與盤點資料一併移除。" : "Vendors sign in from this list; deleting one removes their account and stock-take."}</p>
          </React.Fragment>
        ) : tab === "parts" ? (
          <React.Fragment>
            <div className="mhead">
              <span className="result-count"><strong>{parts.length}</strong> {lang === "zh" ? "項制具" : "fixtures"}</span>
              <button className="btn" onClick={() => setPartEdit("__new__")}><Icon name="plus" size={16} />{lang === "zh" ? "新增制具" : "New fixture"}</button>
            </div>
            <div className="plist">
              {parts.map((p) => (
                <div className="pcard" key={p.key}>
                  <img className="pcard-img" src={p.image} alt="" loading="lazy" />
                  <div className="pcard-main">
                    <div className="pcard-kind">{L(p.kind)}</div>
                    <div className="pcard-name">{L(p.name) || <em className="muted">{lang === "zh" ? "（未命名）" : "(untitled)"}</em>}</div>
                    <div className="pcard-meta mono">{p.code || "—"}</div>
                    <div className="pcard-stat mono">{lang === "zh" ? "庫存" : "Stock"} {p.stock} · {lang === "zh" ? "儲位" : "Loc"} {p.loc || "—"}</div>
                  </div>
                  <div className="pcard-actions">
                    <button className="icobtn" onClick={() => setPartEdit(p.key)} aria-label="edit"><Icon name="pencil" size={16} /></button>
                    <button className="delrow" onClick={() => delPart(p)} aria-label="delete"><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="se-foot">{lang === "zh" ? "制具庫供測試項目選用；編輯會同步更新所有使用該制具的測試。" : "The fixture library feeds the test editor; edits propagate to every test that uses the part."}</p>
          </React.Fragment>
        ) : (
          <BackupPanel lang={lang} />
        )}
      </section>
      {partEdit && <PartEditor pkey={partEdit} lang={lang} onClose={() => setPartEdit(null)} />}
    </div>
  );
}

Object.assign(window, { TestEditor, AdminManage });
