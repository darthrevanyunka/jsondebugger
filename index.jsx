import { useState, useCallback, useMemo, useRef } from "react";
import { resolvePath, tryFilter, tryParseJSON } from "./src/lib/jsonTools.js";

const SAMPLE = JSON.stringify({
  status: "success",
  meta: {
    page: 1,
    per_page: 5,
    total: 5,
    links: {
      self: "/api/v1/orders?page=1",
      next: "/api/v1/orders?page=2",
      prev: null
    }
  },
  data: {
    orders: [
      {
        id: "ord_001",
        customer: { id: "cust_11", name: "Alice Meyers", tier: "gold" },
        reason: 0,
        status: "fulfilled",
        retries: 0,
        amount: 149.99,
        _links: { self: "/api/v1/orders/ord_001", customer: "/api/v1/customers/cust_11" }
      },
      {
        id: "ord_002",
        customer: { id: "cust_22", name: "Bob Trenton", tier: "silver" },
        reason: 3,
        status: "failed",
        retries: 2,
        amount: 89.50,
        _links: { self: "/api/v1/orders/ord_002", customer: "/api/v1/customers/cust_22" }
      },
      {
        id: "ord_003",
        customer: { id: "cust_33", name: "Carol Vance", tier: "bronze" },
        reason: 0,
        status: "fulfilled",
        retries: 0,
        amount: 220.00,
        _links: { self: "/api/v1/orders/ord_003", customer: "/api/v1/customers/cust_33" }
      },
      {
        id: "ord_004",
        customer: { id: "cust_44", name: "Dave Ochoa", tier: "gold" },
        reason: 7,
        status: "pending",
        retries: 1,
        amount: 310.75,
        _links: { self: "/api/v1/orders/ord_004", customer: "/api/v1/customers/cust_44" }
      },
      {
        id: "ord_005",
        customer: { id: "cust_55", name: "Eve Larkin", tier: "silver" },
        reason: 0,
        status: "fulfilled",
        retries: 0,
        amount: 55.00,
        _links: { self: "/api/v1/orders/ord_005", customer: "/api/v1/customers/cust_55" }
      }
    ]
  }
}, null, 2);

const SAMPLE_PATH = "data.orders";

const PRESET_FILTERS = [
  { label: "reason !== 0", expr: "item.reason !== 0" },
  { label: "status === 'failed'", expr: "item.status === 'failed'" },
  { label: "has errors", expr: "item.error || item.errors?.length > 0" },
  { label: "retries > 0", expr: "item.retries > 0" },
  { label: "customer.tier === 'gold'", expr: "item.customer?.tier === 'gold'" },
  { label: "amount > 100", expr: "item.amount > 100" },
];

function JSONNode({ value, depth = 0, collapsed: initialCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(depth > 2 || initialCollapsed);
  const indent = depth * 14;

  if (value === null) return <span style={{ color: "#64b5f6" }}>null</span>;
  if (typeof value === "boolean") return <span style={{ color: "#ce93d8" }}>{String(value)}</span>;
  if (typeof value === "number") return <span style={{ color: "#80cbc4" }}>{value}</span>;
  if (typeof value === "string") return <span style={{ color: "#a5d6a7" }}>"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: "#90a4ae" }}>[]</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(c => !c)} style={toggleBtn}>
          {collapsed ? "▶" : "▼"}
        </button>
        <span style={{ color: "#90a4ae" }}>[</span>
        {collapsed ? (
          <span
            style={{ color: "#546e7a", cursor: "pointer", fontSize: 11, marginLeft: 4 }}
            onClick={() => setCollapsed(false)}
          >
            {value.length} items…
          </span>
        ) : (
          <div style={{ marginLeft: indent + 14 }}>
            {value.map((v, i) => (
              <div key={i} style={{ marginBottom: 1 }}>
                <span style={{ color: "#546e7a", fontSize: 11, marginRight: 6, userSelect: "none" }}>{i}</span>
                <JSONNode value={v} depth={depth + 1} />
                {i < value.length - 1 && <span style={{ color: "#546e7a" }}>,</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ color: "#90a4ae" }}>]</span>
      </span>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return <span style={{ color: "#90a4ae" }}>{"{}"}</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(c => !c)} style={toggleBtn}>
          {collapsed ? "▶" : "▼"}
        </button>
        <span style={{ color: "#90a4ae" }}>{"{"}</span>
        {collapsed ? (
          <span
            style={{ color: "#546e7a", cursor: "pointer", fontSize: 11, marginLeft: 4 }}
            onClick={() => setCollapsed(false)}
          >
            {keys.length} keys…
          </span>
        ) : (
          <div style={{ marginLeft: indent + 14 }}>
            {keys.map((k, i) => (
              <div key={k} style={{ marginBottom: 1 }}>
                <span style={{ color: "#ef9a9a" }}>"{k}"</span>
                <span style={{ color: "#90a4ae" }}>: </span>
                <JSONNode value={value[k]} depth={depth + 1} />
                {i < keys.length - 1 && <span style={{ color: "#546e7a" }}>,</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ color: "#90a4ae" }}>{"}"}</span>
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

const toggleBtn = {
  background: "none", border: "none", color: "#546e7a",
  cursor: "pointer", padding: "0 3px", fontSize: 10, lineHeight: 1,
  verticalAlign: "middle",
};

export default function App() {
  const [raw, setRaw] = useState(SAMPLE);
  const [arrayPath, setArrayPath] = useState(SAMPLE_PATH);
  const [filterExpr, setFilterExpr] = useState("item.reason !== 0");
  const [tab, setTab] = useState("tree");
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const filterRef = useRef(null);

  const { data: parsed, error: parseError } = useMemo(() => tryParseJSON(raw), [raw]);

  // Step 1: resolve the array from the path
  const { value: resolvedArray, error: pathError } = useMemo(() => {
    if (!parsed) return { value: null, error: null };
    return resolvePath(parsed, arrayPath);
  }, [parsed, arrayPath]);

  // Step 2: filter the resolved array
  const { result, error: filterError, count } = useMemo(() => {
    if (!resolvedArray) return { result: [], error: null, count: 0 };
    return tryFilter(resolvedArray, filterExpr);
  }, [resolvedArray, filterExpr]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    setRaw(text);
    // Auto-detect likely array paths in pasted JSON
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setArrayPath("");
      }
      // Leave existing path in place — user can adjust
    } catch {}
    setInputCollapsed(true);
  }, []);

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const totalCount = resolvedArray ? resolvedArray.length : 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#0d1117", color: "#cdd9e5",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      display: "flex", flexDirection: "column", fontSize: 13,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid #1e2d3d",
        display: "flex", alignItems: "center", gap: 12,
        background: "#0d1117",
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#58a6ff", letterSpacing: "-0.5px" }}>
          JSON<span style={{ color: "#3fb950" }}>Debug</span>
        </span>
        <span style={{ color: "#444", fontSize: 11 }}>live filter explorer</span>
        {parsed && (
          <span style={{
            marginLeft: "auto", fontSize: 11, color: "#8b949e",
            background: "#161b22", border: "1px solid #30363d",
            padding: "2px 8px", borderRadius: 4,
          }}>
            {filterExpr.trim()
              ? `${count} / ${totalCount} matching`
              : `${totalCount} items`}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 48px)" }}>

        {/* Left: Input */}
        <div style={{
          width: inputCollapsed ? 40 : 340,
          minWidth: inputCollapsed ? 40 : 340,
          borderRight: "1px solid #1e2d3d",
          display: "flex", flexDirection: "column",
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}>
          {inputCollapsed ? (
            <button
              onClick={() => setInputCollapsed(false)}
              style={{
                background: "none", border: "none", color: "#58a6ff",
                cursor: "pointer", padding: "12px 0", fontSize: 16,
                transform: "rotate(90deg)", marginTop: 8,
              }}
              title="Expand input"
            >▶</button>
          ) : (
            <>
              <div style={{
                padding: "10px 14px 8px", borderBottom: "1px solid #1e2d3d",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ color: "#8b949e", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                  Input JSON
                </span>
                <button
                  onClick={() => setInputCollapsed(true)}
                  style={{ background: "none", border: "none", color: "#546e7a", cursor: "pointer", fontSize: 12 }}
                >◀ hide</button>
              </div>
              <textarea
                value={raw}
                onChange={e => setRaw(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste JSON here…"
                style={{
                  flex: 1, background: "#0d1117", color: "#cdd9e5",
                  border: "none", outline: "none", resize: "none",
                  padding: "12px 14px", fontFamily: "inherit", fontSize: 12,
                  lineHeight: 1.6,
                }}
                spellCheck={false}
              />
              {parseError && (
                <div style={{
                  padding: "8px 14px", background: "#3d1c1c", color: "#f85149",
                  fontSize: 11, borderTop: "1px solid #5a1d1d",
                }}>
                  ✗ {parseError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Filter + Output */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Filter bar */}
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid #1e2d3d",
            display: "flex", flexDirection: "column", gap: 8,
            background: "#0d1117",
          }}>
            {/* Array path row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#8b949e", fontSize: 11, whiteSpace: "nowrap" }}>array path</span>
              <input
                value={arrayPath}
                onChange={e => setArrayPath(e.target.value)}
                placeholder="leave blank if top-level array — e.g. data.orders"
                style={{
                  flex: 1, background: "#161b22", color: "#e6edf3",
                  border: `1px solid ${pathError ? "#9a3412" : "#30363d"}`,
                  borderRadius: 6, padding: "5px 10px",
                  fontFamily: "inherit", fontSize: 12, outline: "none",
                }}
                spellCheck={false}
                autoComplete="off"
              />
              {arrayPath && (
                <button
                  onClick={() => setArrayPath("")}
                  style={{
                    background: "none", border: "1px solid #30363d", color: "#8b949e",
                    borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 11,
                  }}
                >clear</button>
              )}
            </div>
            {pathError && (
              <div style={{ color: "#fb923c", fontSize: 11 }}>⚠ {pathError}</div>
            )}

            {/* Filter expression row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#8b949e", fontSize: 11, whiteSpace: "nowrap" }}>filter(item =&gt;</span>
              <input
                ref={filterRef}
                value={filterExpr}
                onChange={e => setFilterExpr(e.target.value)}
                placeholder="item.reason !== 0"
                style={{
                  flex: 1, background: "#161b22", color: "#e6edf3",
                  border: `1px solid ${filterError ? "#5a1d1d" : "#30363d"}`,
                  borderRadius: 6, padding: "6px 10px",
                  fontFamily: "inherit", fontSize: 13, outline: "none",
                }}
                spellCheck={false}
                autoComplete="off"
              />
              <span style={{ color: "#8b949e", fontSize: 11 }}>)</span>
              {filterExpr && (
                <button
                  onClick={() => setFilterExpr("")}
                  style={{
                    background: "none", border: "1px solid #30363d", color: "#8b949e",
                    borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 11,
                  }}
                >clear</button>
              )}
            </div>

            {/* Presets */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESET_FILTERS.map(p => (
                <button
                  key={p.expr}
                  onClick={() => { setFilterExpr(p.expr); filterRef.current?.focus(); }}
                  style={{
                    background: filterExpr === p.expr ? "#1f3a5f" : "#161b22",
                    border: `1px solid ${filterExpr === p.expr ? "#58a6ff" : "#30363d"}`,
                    color: filterExpr === p.expr ? "#58a6ff" : "#8b949e",
                    borderRadius: 4, padding: "3px 8px",
                    cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                  }}
                >{p.label}</button>
              ))}
            </div>

            {filterError && (
              <div style={{ color: "#f85149", fontSize: 11 }}>✗ {filterError}</div>
            )}
          </div>

          {/* Output tabs */}
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            borderBottom: "1px solid #1e2d3d", padding: "0 16px",
            background: "#0d1117",
          }}>
            {["tree", "raw"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: "none", border: "none",
                  borderBottom: `2px solid ${tab === t ? "#58a6ff" : "transparent"}`,
                  color: tab === t ? "#58a6ff" : "#8b949e",
                  padding: "8px 14px", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12,
                  marginBottom: -1,
                }}
              >{t === "tree" ? "🌲 Tree" : "{ } Raw"}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, padding: "6px 0" }}>
              <button
                onClick={copyResult}
                disabled={!result.length}
                style={{
                  background: "#161b22", border: "1px solid #30363d", color: "#8b949e",
                  borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 11,
                  fontFamily: "inherit", opacity: result.length ? 1 : 0.4,
                }}
              >copy result</button>
            </div>
          </div>

          {/* Output content */}
          <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
            {!parsed && !parseError && (
              <div style={{ color: "#546e7a", fontSize: 12, marginTop: 20, textAlign: "center" }}>
                Paste your JSON in the left panel to get started
              </div>
            )}
            {parsed && result.length === 0 && !filterError && (
              <div style={{ color: "#546e7a", fontSize: 12, marginTop: 20, textAlign: "center" }}>
                No items match the filter
              </div>
            )}
            {result.length > 0 && tab === "tree" && (
              <div style={{ lineHeight: 1.7 }}>
                <JSONNode value={result} depth={0} />
              </div>
            )}
            {result.length > 0 && tab === "raw" && (
              <pre style={{
                margin: 0, color: "#cdd9e5", fontSize: 12,
                lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
