/* Persistent data store + audit log (demo — localStorage backed).
   Overlays editable copies of ITEMS and VENDORS onto the static defaults,
   and records every admin change for the History page.
   Must load AFTER data.js + auth.js, BEFORE the babel component scripts. */
(function () {
  const KEYS = { items: "bff:items:v1", vendors: "bff:vendors:v1", parts: "bff:parts:v1", log: "bff:auditlog:v1" };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const load = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const defaults = { items: clone(window.DATA.ITEMS), vendors: clone(window.AUTH.VENDORS), parts: clone(window.DATA.PARTS) };

  // live state (mutated in place so existing window.DATA.* / window.AUTH.* readers stay valid)
  const items = load(KEYS.items, null) || clone(window.DATA.ITEMS);
  const vendors = load(KEYS.vendors, null) || clone(window.AUTH.VENDORS);
  const parts = load(KEYS.parts, null) || clone(window.DATA.PARTS);
  const log = load(KEYS.log, []);
  window.DATA.ITEMS = items;
  window.DATA.PARTS = parts;
  window.AUTH.VENDORS = vendors;

  const emit = () => window.dispatchEvent(new CustomEvent("bff:datachange"));
  const actor = () => { const u = window.AUTH.get && window.AUTH.get(); return u && u.name ? u.name : { zh: "系統", en: "System" }; };

  function addLog(entry) {
    log.unshift(Object.assign(
      { id: "L" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), at: Date.now(), by: actor() },
      entry
    ));
    save(KEYS.log, log);
  }

  /* ---- fixtures helper: build a full embedded fixture object from a part key ---- */
  function fxObj(key, qty, torque) {
    const p = window.DATA.PARTS[key];
    if (!p) return null;
    return { key, code: p.code, name: p.name, image: p.image, kind: p.kind, qty: Math.max(0, Math.round(+qty || 0)), torque: torque && String(torque).trim() ? String(torque).trim() : null };
  }

  /* ---- test items ---- */
  const items_list = () => items;
  const items_get = (id) => items.find((i) => i.id === id);
  function items_save(item) {
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      const changes = diffItem(items[idx], item);
      items[idx] = item;
      save(KEYS.items, items);
      addLog({ action: "update", entity: "test", targetId: item.id, targetName: clone(item.name), changes });
    } else {
      items.push(item);
      save(KEYS.items, items);
      addLog({ action: "create", entity: "test", targetId: item.id, targetName: clone(item.name), changes: [{ zh: "新增測試項目", en: "Created test item" }] });
    }
    emit();
  }
  function items_delete(id) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const it = items[idx];
    items.splice(idx, 1);
    save(KEYS.items, items);
    addLog({ action: "delete", entity: "test", targetId: id, targetName: clone(it.name), changes: [{ zh: "刪除測試項目", en: "Deleted test item" }] });
    emit();
  }

  /* ---- vendors ---- */
  const vendors_list = () => vendors;
  function vendors_save(v) {
    const idx = vendors.findIndex((x) => x.id === v.id);
    if (idx >= 0) {
      const before = vendors[idx];
      const ch = [];
      if (JSON.stringify(before.name) !== JSON.stringify(v.name)) ch.push({ zh: `名稱 → ${v.name.zh}`, en: `Name → ${v.name.en}` });
      if (before.code !== v.code) ch.push({ zh: "更新存取碼", en: "Access code changed" });
      vendors[idx] = v;
      save(KEYS.vendors, vendors);
      addLog({ action: "update", entity: "vendor", targetId: v.id, targetName: clone(v.name), changes: ch.length ? ch : [{ zh: "更新供應商資料", en: "Updated vendor" }] });
    } else {
      vendors.push(v);
      save(KEYS.vendors, vendors);
      addLog({ action: "create", entity: "vendor", targetId: v.id, targetName: clone(v.name), changes: [{ zh: "新增供應商", en: "Added vendor" }] });
    }
    emit();
  }
  function vendors_delete(id) {
    const idx = vendors.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const v = vendors[idx];
    vendors.splice(idx, 1);
    save(KEYS.vendors, vendors);
    try { localStorage.removeItem("bff:stock:" + id); } catch (e) {}
    addLog({ action: "delete", entity: "vendor", targetId: id, targetName: clone(v.name), changes: [{ zh: "刪除供應商", en: "Removed vendor" }] });
    emit();
  }

  /* ---- diff for test item updates ---- */
  function diffItem(a, b) {
    const c = [];
    if (JSON.stringify(a.name) !== JSON.stringify(b.name)) c.push({ zh: `名稱 → ${b.name.zh}`, en: `Name → ${b.name.en}` });
    if (a.standard !== b.standard || a.clause !== b.clause)
      c.push({ zh: `對應標準 ${a.standard} ${a.clause} → ${b.standard} ${b.clause}`, en: `Standard ${a.standard} ${a.clause} → ${b.standard} ${b.clause}` });
    if (JSON.stringify(a.params) !== JSON.stringify(b.params)) c.push(a.params.length !== b.params.length ? { zh: `測試參數已更新（${a.params.length} → ${b.params.length} 項）`, en: `Parameters updated (${a.params.length} → ${b.params.length})` } : { zh: "測試參數已更新", en: "Parameters updated" });
    if (JSON.stringify(a.fixtures) !== JSON.stringify(b.fixtures)) c.push(a.fixtures.length !== b.fixtures.length ? { zh: `所需制具已更新（${a.fixtures.length} → ${b.fixtures.length} 件）`, en: `Fixtures updated (${a.fixtures.length} → ${b.fixtures.length})` } : { zh: "所需制具已更新", en: "Fixtures updated" });
    if (JSON.stringify(a.steps) !== JSON.stringify(b.steps)) c.push(a.steps.length !== b.steps.length ? { zh: `安裝步驟已更新（${a.steps.length} → ${b.steps.length} 步）`, en: `Steps updated (${a.steps.length} → ${b.steps.length})` } : { zh: "安裝步驟已更新", en: "Steps updated" });
    if (a.status !== b.status) c.push({ zh: `狀態 → ${b.status === "ready" ? "可測" : "草稿"}`, en: `Status → ${b.status}` });
    if (JSON.stringify(a.summary) !== JSON.stringify(b.summary)) c.push({ zh: "概述已更新", en: "Summary updated" });
    return c.length ? c : [{ zh: "內容微調", en: "Minor edits" }];
  }

  /* ---- fixture library (PARTS) ---- */
  const parts_list = () => Object.keys(parts).map((key) => Object.assign({ key }, parts[key]));
  const parts_get = (key) => parts[key];
  function refreshEmbedded(key) {
    const p = parts[key];
    if (!p) return;
    items.forEach((it) => it.fixtures.forEach((f) => {
      if (f.key === key) { f.code = p.code; f.name = p.name; f.image = p.image; f.kind = p.kind; }
    }));
    save(KEYS.items, items);
  }
  function parts_save(key, data) {
    const exists = !!parts[key];
    const before = exists ? parts[key] : null;
    parts[key] = { code: data.code, name: data.name, image: data.image, kind: data.kind, stock: Math.max(0, Math.round(+data.stock || 0)), loc: data.loc || "" };
    save(KEYS.parts, parts);
    if (exists) {
      const ch = [];
      if (JSON.stringify(before.name) !== JSON.stringify(data.name)) ch.push({ zh: `名稱 → ${data.name.zh}`, en: `Name → ${data.name.en}` });
      if (before.code !== data.code) ch.push({ zh: `編號 ${before.code} → ${data.code}`, en: `Part no. ${before.code} → ${data.code}` });
      if (before.image !== data.image) ch.push({ zh: "更換制具圖", en: "Image replaced" });
      if ((before.stock || 0) !== (parts[key].stock || 0)) ch.push({ zh: `系統庫存 ${before.stock || 0} → ${parts[key].stock}`, en: `Default stock ${before.stock || 0} → ${parts[key].stock}` });
      if ((before.loc || "") !== (parts[key].loc || "")) ch.push({ zh: `儲位 → ${parts[key].loc || "—"}`, en: `Location → ${parts[key].loc || "—"}` });
      refreshEmbedded(key);
      addLog({ action: "update", entity: "fixture", targetId: key, targetName: clone(data.name), changes: ch.length ? ch : [{ zh: "內容微調", en: "Minor edits" }] });
    } else {
      addLog({ action: "create", entity: "fixture", targetId: key, targetName: clone(data.name), changes: [{ zh: "新增制具", en: "Created fixture" }] });
    }
    emit();
  }
  function parts_delete(key) {
    const p = parts[key];
    if (!p) return;
    let affected = 0;
    items.forEach((it) => {
      const n = it.fixtures.length;
      it.fixtures = it.fixtures.filter((f) => f.key !== key);
      if (it.fixtures.length !== n) affected++;
    });
    delete parts[key];
    save(KEYS.parts, parts); save(KEYS.items, items);
    const ch = [{ zh: "刪除制具", en: "Deleted fixture" }];
    if (affected) ch.push({ zh: `已自 ${affected} 項測試移除`, en: `Removed from ${affected} test(s)` });
    addLog({ action: "delete", entity: "fixture", targetId: key, targetName: clone(p.name), changes: ch });
    emit();
  }
  function blankPart() {
    return { code: "", name: { zh: "", en: "" }, image: window.DATA.IMG.slideTable, kind: { zh: "", en: "" }, stock: 0, loc: "" };
  }
  const newPartKey = () => "p_" + Date.now().toString(36);

  /* ---- snapshot backup / restore (stand-in for cloud sync) ---- */
  function collectStock() {
    const out = {};
    vendors.forEach((v) => { const s = localStorage.getItem("bff:stock:" + v.id); if (s) out[v.id] = JSON.parse(s); });
    return out;
  }
  function exportSnapshot() {
    return { format: "bff-snapshot", version: 1, at: Date.now(),
      items: clone(items), vendors: clone(vendors), parts: clone(parts), log: clone(log), stock: collectStock() };
  }
  function importSnapshot(snap) {
    if (!snap || snap.format !== "bff-snapshot") throw new Error("格式不符 / Invalid snapshot file");
    items.length = 0; (snap.items || []).forEach((i) => items.push(i));
    vendors.length = 0; (snap.vendors || []).forEach((v) => vendors.push(v));
    Object.keys(parts).forEach((k) => delete parts[k]); Object.assign(parts, snap.parts || {});
    log.length = 0; (snap.log || []).forEach((e) => log.push(e));
    save(KEYS.items, items); save(KEYS.vendors, vendors); save(KEYS.parts, parts); save(KEYS.log, log);
    if (snap.stock) Object.keys(snap.stock).forEach((vid) => { try { localStorage.setItem("bff:stock:" + vid, JSON.stringify(snap.stock[vid])); } catch (e) {} });
    addLog({ action: "update", entity: "system", targetId: "restore", targetName: { zh: "資料還原", en: "Data restore" }, changes: [{ zh: "已從備份檔還原全部資料", en: "Restored all data from snapshot" }] });
    emit();
    window.dispatchEvent(new CustomEvent("bff:stockchange"));
  }

  const log_list = () => log;
  function resetAll() {
    [KEYS.items, KEYS.vendors, KEYS.parts, KEYS.log].forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });
    items.length = 0; clone(defaults.items).forEach((i) => items.push(i));
    vendors.length = 0; clone(defaults.vendors).forEach((v) => vendors.push(v));
    Object.keys(parts).forEach((k) => delete parts[k]); Object.assign(parts, clone(defaults.parts));
    log.length = 0;
    emit();
  }

  function blankItem() {
    return {
      id: "new-" + Date.now(),
      code: "",
      category: { zh: "", en: "" },
      name: { zh: "", en: "" },
      standard: "",
      clause: "",
      status: "draft",
      schematic: window.DATA.IMG.frameSchematic,
      summary: { zh: "", en: "" },
      params: [],
      fixtures: [],
      steps: [],
    };
  }

  window.STORE = {
    clone, defaults, fxObj, blankItem, blankPart, newPartKey,
    items_list, items_get, items_save, items_delete,
    vendors_list, vendors_save, vendors_delete,
    parts_list, parts_get, parts_save, parts_delete,
    exportSnapshot, importSnapshot,
    log_list, addLog, resetAll,
  };
})();
