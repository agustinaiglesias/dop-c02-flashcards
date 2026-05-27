import { useState, useEffect, useCallback, useRef } from "react";
import FLASHCARDS from "./flashcards.json";

const STORAGE_KEY = "dop_flashcards_v1";
const DECK_KEY = "dop_flashcards_deck_v1";

const CAT_COLORS = {
  "AWS Config":         { border: "#f97316", title: "#ea580c" },
  "CodeDeploy":         { border: "#3b82f6", title: "#2563eb" },
  "CloudWatch":         { border: "#8b5cf6", title: "#7c3aed" },
  "Lambda":             { border: "#f59e0b", title: "#d97706" },
  "Step Functions":     { border: "#14b8a6", title: "#0d9488" },
  "CodePipeline":       { border: "#6366f1", title: "#4f46e5" },
  "CodeCommit":         { border: "#22c55e", title: "#16a34a" },
  "CloudFormation":     { border: "#ef4444", title: "#dc2626" },
  "Elastic Beanstalk":  { border: "#84cc16", title: "#65a30d" },
  "Auto Scaling":       { border: "#06b6d4", title: "#0891b2" },
  "SSM":                { border: "#64748b", title: "#475569" },
  "Disaster Recovery":  { border: "#ec4899", title: "#db2777" },
  "OpsWorks":           { border: "#a855f7", title: "#9333ea" },
  "Kinesis":            { border: "#0ea5e9", title: "#0284c7" },
  "EC2":                { border: "#fb923c", title: "#c2410c" },
  "CloudFront":         { border: "#2dd4bf", title: "#0f766e" },
  "X-Ray":              { border: "#7c3aed", title: "#6d28d9" },
  "Trusted Advisor":    { border: "#eab308", title: "#a16207" },
  "DLM":                { border: "#a16207", title: "#854d0e" },
  "VPC":                { border: "#1d4ed8", title: "#1e40af" },
  "S3":                 { border: "#4ade80", title: "#15803d" },
  "AMI / Seguridad":    { border: "#f43f5e", title: "#e11d48" },
  "Seguridad":          { border: "#dc2626", title: "#b91c1c" },
  "CI/CD":              { border: "#818cf8", title: "#4f46e5" },
  "API Gateway":        { border: "#5eead4", title: "#0d9488" },
  "Bases de datos":     { border: "#1e3a8a", title: "#1e40af" },
  "Patrones generales": { border: "#94a3b8", title: "#64748b" },
};
const DEFAULT_CAT_COLOR = { border: "#2563eb", title: "#2563eb" };
const getCatColor = (cat) => CAT_COLORS[cat] || DEFAULT_CAT_COLOR;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsApp() {
  const [deck, setDeck] = useState(() => shuffle([...FLASHCARDS]));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marked, setMarked] = useState(new Set());
  const [filter, setFilter] = useState("Todas");
  const [viewMode, setViewMode] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [animDir, setAnimDir] = useState(null);
  const [showCat, setShowCat] = useState(false);
  const [filterDomain, setFilterDomain] = useState("Todos");
  const [showDomain, setShowDomain] = useState(false);
  const [stats, setStats] = useState({ seen: new Set(), correct: new Set(), wrong: new Set() });
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const domains    = ["Todos", ...Array.from(new Set(deck.map(f => f.subdomain).filter(Boolean)))];
  const categories = ["Todas", ...Array.from(new Set(
    deck.filter(f => filterDomain === "Todos" || f.subdomain === filterDomain).map(f => f.cat)
  ))];

  useEffect(() => {
    try {
      const savedDeck = localStorage.getItem(DECK_KEY);
      if (savedDeck) {
        const parsed = JSON.parse(savedDeck);
        if (Array.isArray(parsed) && parsed.length > 0) setDeck(shuffle(parsed));
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.marked)  setMarked(new Set(data.marked));
        if (data.seen)    setStats(s => ({ ...s, seen:    new Set(data.seen) }));
        if (data.correct) setStats(s => ({ ...s, correct: new Set(data.correct) }));
        if (data.wrong)   setStats(s => ({ ...s, wrong:   new Set(data.wrong) }));
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  const persist = useCallback((newMarked, newStats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        marked:  [...newMarked],
        seen:    [...newStats.seen],
        correct: [...newStats.correct],
        wrong:   [...newStats.wrong],
      }));
    } catch (e) {}
  }, []);

  const visible = deck.filter(c => {
    const domainOk = filterDomain === "Todos" || c.subdomain === filterDomain;
    const catOk    = filter === "Todas" || c.cat === filter;
    const modeOk   = viewMode === "all"
      || (viewMode === "starred" && marked.has(c.id))
      || (viewMode === "wrong"   && stats.wrong.has(c.id));
    return domainOk && catOk && modeOk;
  });

  const card = visible[index] || null;

  const navigate = (dir) => {
    setAnimDir(dir);
    setFlipped(false);
    setTimeout(() => {
      setIndex(i => (i + dir + visible.length) % visible.length);
      setAnimDir(null);
    }, 200);
    if (card) {
      setStats(s => {
        const ns = { ...s, seen: new Set([...s.seen, card.id]) };
        persist(marked, ns);
        return ns;
      });
    }
  };

  const toggleMark = () => {
    if (!card) return;
    const nm = new Set(marked);
    if (nm.has(card.id)) nm.delete(card.id); else nm.add(card.id);
    setMarked(nm);
    persist(nm, stats);
  };

  const markCorrect = () => {
    if (!card) return;
    const ns = {
      ...stats,
      correct: new Set([...stats.correct, card.id]),
      wrong:   new Set([...stats.wrong].filter(id => id !== card.id)),
    };
    setStats(ns);
    persist(marked, ns);
    navigate(1);
  };

  const markWrong = () => {
    if (!card) return;
    const ns = {
      ...stats,
      wrong:   new Set([...stats.wrong, card.id]),
      correct: new Set([...stats.correct].filter(id => id !== card.id)),
    };
    setStats(ns);
    persist(marked, ns);
    navigate(1);
  };

  const resetProgress = () => {
    setMarked(new Set());
    setStats({ seen: new Set(), correct: new Set(), wrong: new Set() });
    setIndex(0);
    setFlipped(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const cards = Array.isArray(parsed) ? parsed : parsed.flashcards ?? parsed.cards ?? null;
        if (!Array.isArray(cards) || cards.length === 0) throw new Error("El JSON debe ser un array de tarjetas.");
        const invalid = cards.find(c => !c.q || !c.a);
        if (invalid) throw new Error("Cada tarjeta necesita al menos los campos 'q' y 'a'.");
        const normalized = cards.map((c, i) => ({
          id:        c.id ?? i + 1,
          cat:       c.cat ?? c.category ?? "Sin categoría",
          subdomain: c.subdomain ?? c.domain ?? null,
          q:         c.q,
          a:         c.a,
        }));
        localStorage.setItem(DECK_KEY, JSON.stringify(normalized));
        setDeck(shuffle(normalized));
        setMarked(new Set());
        setStats({ seen: new Set(), correct: new Set(), wrong: new Set() });
        setIndex(0);
        setFilter("Todas");
        setFilterDomain("Todos");
        setFlipped(false);
        setImportError(null);
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const changeDomain = (domain) => {
    setFilterDomain(domain);
    setFilter("Todas");
    setIndex(0);
    setFlipped(false);
    setShowDomain(false);
  };

  const changeFilter = (cat) => {
    setFilter(cat);
    setIndex(0);
    setFlipped(false);
    setShowCat(false);
  };

  const changeViewMode = (mode) => {
    setViewMode(mode);
    setIndex(0);
    setFlipped(false);
  };

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9", color: "#2563eb", fontFamily: F }}>
      Cargando...
    </div>
  );

  const pct = deck.length > 0 ? Math.round((stats.seen.size / deck.length) * 100) : 0;
  const catColor = card ? getCatColor(card.cat) : DEFAULT_CAT_COLOR;

  const inScope = (c) => c
    && (filterDomain === "Todos" || c.subdomain === filterDomain)
    && (filter === "Todas" || c.cat === filter);
  const wrongCount   = [...stats.wrong].filter(id => inScope(deck.find(f => f.id === id))).length;
  const starredCount = [...marked].filter(id       => inScope(deck.find(f => f.id === id))).length;

  return (
    <div style={styles.root}>
      <div style={styles.bg} />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>DOP-C02</div>
            <div style={styles.subtitle}>FLASHCARDS</div>
          </div>
          <div style={styles.statsRow}>
            <StatPill label="Total"     value={deck.length}       color="#6b7280" />
            <StatPill label="★ Marcadas" value={marked.size}       color="#f59e0b" />
            <StatPill label="Vistas"    value={`${pct}%`}         color="#10b981" />
            <StatPill label="✗ Incorrectas" value={stats.wrong.size} color="#ef4444" />
          </div>
        </div>

        {/* Progress bar */}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${pct}%` }} />
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <button style={viewMode === "all"     ? styles.btnActive : styles.btn} onClick={() => changeViewMode("all")}>
              📚 Todas ({deck.filter(c => filter === "Todas" || c.cat === filter).length})
            </button>
            <button style={viewMode === "starred" ? styles.btnActive : styles.btn} onClick={() => changeViewMode("starred")}>
              ★ Marcadas ({starredCount})
            </button>
            <button style={viewMode === "wrong"   ? styles.btnWrongActive : styles.btnWrong} onClick={() => changeViewMode("wrong")}>
              ✗ Incorrectas ({wrongCount})
            </button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {/* Domain filter */}
            <div style={{ position: "relative" }}>
              <button
                style={{ ...styles.btnCat, ...(filterDomain !== "Todos" ? styles.btnCatActive : {}) }}
                onClick={() => { setShowDomain(v => !v); setShowCat(false); }}
              >
                {filterDomain === "Todos" ? "Dominio ▾" : filterDomain.replace(/^Domain \d+: /, "D") + " ▾"}
              </button>
              {showDomain && (
                <div style={{ ...styles.dropdown, minWidth: 260 }}>
                  {domains.map(d => (
                    <button key={d} style={d === filterDomain ? styles.dropItemActive : styles.dropItem} onClick={() => changeDomain(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category filter */}
            <div style={{ position: "relative" }}>
              <button
                style={{ ...styles.btnCat, ...(filter !== "Todas" ? styles.btnCatActive : {}) }}
                onClick={() => { setShowCat(v => !v); setShowDomain(false); }}
              >
                {filter} ▾
              </button>
              {showCat && (
                <div style={styles.dropdown}>
                  {categories.map(cat => (
                    <button key={cat} style={cat === filter ? styles.dropItemActive : styles.dropItem} onClick={() => changeFilter(cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card area */}
        {visible.length === 0 ? (
          <div style={styles.empty}>
            {viewMode === "starred" ? "No tenés tarjetas marcadas en esta categoría."
            : viewMode === "wrong"  ? "No tenés tarjetas incorrectas en esta categoría. ¡Bien hecho!"
            : "No hay tarjetas en esta categoría."}
          </div>
        ) : (
          <>
            <div style={styles.cardCounter}>
              {index + 1} / {visible.length}
              {card && marked.has(card.id) && <span style={styles.starBadge}>★</span>}
              {card && stats.wrong.has(card.id) && <span style={styles.wrongBadge}>✗</span>}
            </div>

            {/* Flashcard */}
            <div style={styles.cardWrapper} onClick={() => setFlipped(v => !v)}>
              <div style={{
                ...styles.cardInner,
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                opacity: animDir ? 0 : 1,
                transition: animDir ? "opacity 0.2s" : "transform 0.5s ease",
              }}>
                {/* Front */}
                <div style={{ ...styles.cardFace, ...styles.cardFront, borderLeft: `5px solid ${catColor.border}` }}>
                  {card && (
                    <>
                      <div style={{ ...styles.cardCat, color: catColor.title }}>{card.cat}</div>
                      <div style={styles.cardQ}>{card.q}</div>
                      <div style={styles.tapHint}>Toca para ver la respuesta</div>
                    </>
                  )}
                </div>
                {/* Back */}
                <div style={{ ...styles.cardFace, ...styles.cardBack, borderLeft: `5px solid ${catColor.border}` }}>
                  {card && (
                    <>
                      <div style={{ ...styles.cardCat, color: catColor.title }}>{card.cat}</div>
                      <div style={styles.cardA}>{card.a}</div>
                      <div style={styles.tapHint}>Toca para ver la pregunta</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={styles.actions}>
              <button style={styles.navBtn} onClick={() => navigate(-1)}>← Anterior</button>

              <div style={styles.centerActions}>
                <button
                  style={{ ...styles.markBtn, ...(card && marked.has(card.id) ? styles.markBtnActive : {}) }}
                  onClick={toggleMark}
                  title="Marcar para repasar"
                >
                  {card && marked.has(card.id) ? "★ Marcada" : "☆ Marcar"}
                </button>
                {flipped && (
                  <>
                    <button style={styles.wrongBtn} onClick={markWrong}>✗ No lo sabía</button>
                    <button style={styles.correctBtn} onClick={markCorrect}>✓ La sabía</button>
                  </>
                )}
              </div>

              <button style={styles.navBtn} onClick={() => navigate(1)}>Siguiente →</button>
            </div>

            <div style={styles.hint}>← → para navegar · Espacio para voltear</div>
          </>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button style={styles.resetBtn} onClick={resetProgress}>↺ Resetear progreso</button>
            <button style={styles.importBtn} onClick={() => fileInputRef.current?.click()}>⬆ Importar JSON</button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleImport} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {importError && <div style={styles.importError}>{importError}</div>}
            <div style={styles.footerStats}>
              ✓ {stats.correct.size} correctas · ✗ {stats.wrong.size} incorrectas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ ...styles.statPill, borderColor: color }}>
      <span style={{ color, fontWeight: 700, fontSize: 15 }}>{value}</span>
      <span style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>{label}</span>
    </div>
  );
}

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const styles = {
  root: {
    minHeight: "100vh",
    background: "#f1f5f9",
    position: "relative",
    overflowX: "hidden",
    fontFamily: F,
    color: "#1e293b",
  },
  bg: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(ellipse at 10% 0%, rgba(37,99,235,0.06) 0%, transparent 50%), radial-gradient(ellipse at 90% 100%, rgba(22,163,74,0.05) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 680,
    margin: "0 auto",
    padding: "24px 16px 48px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#2563eb",
    letterSpacing: 2,
    fontFamily: F,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    letterSpacing: 4,
    fontFamily: F,
    marginTop: 4,
    fontWeight: 500,
    textTransform: "uppercase",
  },
  statsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  statPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "5px 12px",
    border: "1.5px solid",
    borderRadius: 10,
    minWidth: 58,
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  progressBar: {
    height: 4,
    background: "#e2e8f0",
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb, #16a34a)",
    borderRadius: 4,
    transition: "width 0.5s ease",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  controlGroup: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  btn: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    color: "#64748b",
    padding: "6px 13px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  btnActive: {
    background: "#eff6ff",
    border: "1.5px solid #2563eb",
    color: "#2563eb",
    padding: "6px 13px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 600,
  },
  btnWrong: {
    background: "#fff",
    border: "1.5px solid #fca5a5",
    color: "#ef4444",
    padding: "6px 13px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  btnWrongActive: {
    background: "#fef2f2",
    border: "1.5px solid #ef4444",
    color: "#dc2626",
    padding: "6px 13px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 600,
  },
  btnCat: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    color: "#475569",
    padding: "6px 14px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 500,
    maxWidth: 170,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  btnCatActive: {
    background: "#fef9c3",
    border: "1.5px solid #eab308",
    color: "#854d0e",
    fontWeight: 600,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 6px)",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    zIndex: 100,
    minWidth: 210,
    maxHeight: 300,
    overflowY: "auto",
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
  },
  dropItem: {
    display: "block",
    width: "100%",
    padding: "9px 18px",
    background: "none",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    fontFamily: F,
    borderBottom: "1px solid #f1f5f9",
    boxSizing: "border-box",
  },
  dropItemActive: {
    display: "block",
    width: "100%",
    padding: "9px 18px",
    background: "#eff6ff",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    fontFamily: F,
    fontWeight: 600,
    borderBottom: "1px solid #f1f5f9",
    boxSizing: "border-box",
  },
  cardCounter: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: F,
    marginBottom: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    fontWeight: 500,
  },
  starBadge: {
    color: "#f59e0b",
    fontSize: 16,
  },
  wrongBadge: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: 700,
  },
  cardWrapper: {
    perspective: 1200,
    cursor: "pointer",
    marginBottom: 16,
    userSelect: "none",
  },
  cardInner: {
    position: "relative",
    transformStyle: "preserve-3d",
    minHeight: 260,
  },
  cardFace: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: 20,
    padding: "28px 30px 24px",
    display: "flex",
    flexDirection: "column",
    minHeight: 260,
    boxSizing: "border-box",
  },
  cardFront: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
  },
  cardBack: {
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
    transform: "rotateY(180deg)",
  },
  cardCat: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: F,
    marginBottom: 14,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  cardQ: {
    fontSize: 18,
    lineHeight: 1.65,
    color: "#1e293b",
    fontWeight: 500,
    flex: 1,
  },
  cardA: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "#1e293b",
    fontWeight: 400,
    flex: 1,
  },
  tapHint: {
    fontSize: 11,
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 16,
    fontFamily: F,
    letterSpacing: 0.5,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  navBtn: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    color: "#475569",
    padding: "10px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: F,
    fontWeight: 500,
    transition: "all 0.2s",
    minWidth: 105,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  centerActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  markBtn: {
    background: "#fff",
    border: "1.5px solid #fcd34d",
    color: "#b45309",
    padding: "10px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: F,
    fontWeight: 500,
    transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  markBtnActive: {
    background: "#fefce8",
    border: "1.5px solid #f59e0b",
    color: "#92400e",
    fontWeight: 600,
  },
  wrongBtn: {
    background: "#fff5f5",
    border: "1.5px solid #fca5a5",
    color: "#dc2626",
    padding: "10px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: F,
    fontWeight: 500,
    transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  correctBtn: {
    background: "#f0fdf4",
    border: "1.5px solid #86efac",
    color: "#15803d",
    padding: "10px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: F,
    fontWeight: 500,
    transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  hint: {
    textAlign: "center",
    fontSize: 11,
    color: "#cbd5e1",
    fontFamily: F,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    paddingTop: 16,
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: 8,
  },
  resetBtn: {
    background: "none",
    border: "1.5px solid #fca5a5",
    color: "#ef4444",
    padding: "6px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 500,
  },
  importBtn: {
    background: "none",
    border: "1.5px solid #93c5fd",
    color: "#2563eb",
    padding: "6px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: F,
    fontWeight: 500,
  },
  importError: {
    fontSize: 11,
    color: "#ef4444",
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 8,
    padding: "4px 10px",
    maxWidth: 280,
    textAlign: "right",
  },
  footerStats: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: F,
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "60px 20px",
    fontSize: 15,
    fontFamily: F,
  },
};
