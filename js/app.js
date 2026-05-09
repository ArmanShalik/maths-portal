// ============================================================
//  APP — Main Application Logic
// ============================================================

let allRecords   = [];
let allData      = null;
let currentQuery = "";

// ── Boot ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Set header labels from config
  document.getElementById("yearLabel").textContent = CONFIG.YEAR_LABEL || "A/L · 2025";

  // Logo
  const symbol = document.getElementById("brandSymbol");
  if (CONFIG.LOGO && CONFIG.LOGO.trim() !== "") {
    symbol.innerHTML = `<img src="${CONFIG.LOGO}" alt="Logo" />`;
  } else {
    symbol.textContent = "∑";
  }

  // Enter key on search
  document.getElementById("queryInput")
    .addEventListener("keydown", e => { if (e.key === "Enter") lookup(); });
});

// ── Lookup ───────────────────────────────────────────────
async function lookup() {
  const q = document.getElementById("queryInput").value.trim();
  if (!q) return;
  currentQuery = q;

  setError("");
  document.getElementById("results").style.display = "none";
  showSpinner(true);
  setSearchBtn(true);
  Charts.destroyAll();

  try {
    const res  = await fetch(`${CONFIG.API_URL}?action=getFullData&query=${encodeURIComponent(q)}`);
    const data = await res.json();
    onData(data);
  } catch (err) {
    showSpinner(false);
    setSearchBtn(false);
    setError("Could not connect. Please check your connection and try again.");
  }
}

function onData(data) {
  showSpinner(false);
  setSearchBtn(false);

  if (data.error) { setError(data.error); return; }

  allData    = data;
  allRecords = data.records;

  document.getElementById("studentName").textContent = data.student;

  // Quote
  if (data.quote) {
    document.getElementById("quoteText").textContent = data.quote;
    document.getElementById("quoteCard").style.display = "block";
  }

  renderMarksPanel(allRecords[0], true);
  renderReview(allRecords[0]);
  renderHistory(allRecords);

  // Charts
  document.getElementById("chartsGrid").style.display = "grid";
  setTimeout(() => {
    Charts.trend(allRecords);
    Charts.compare(allRecords[0]);
    Charts.parts(allRecords);
  }, 100);

  // Paper analysis
  if (data.paperStats && data.paperStats.questions && data.paperStats.questions.length > 0) {
    renderPaperAnalysis(data.paperStats, data.classStats);
  } else {
    document.getElementById("paperAnalysisSection").style.display = "none";
  }

  document.getElementById("results").style.display = "block";
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Marks panel ──────────────────────────────────────────
function renderMarksPanel(rec, isLatest) {
  const pA = pct(rec.partA, rec.maxA);
  const pB = pct(rec.partB, rec.maxB);
  const pT = pct(rec.total, rec.maxTotal);

  document.getElementById("marksPanel").innerHTML = `
  <div class="marks-panel" style="animation:fadeUp .4s ease both">
    <div class="marks-topbar">
      <div>
        <div class="paper-title">${rec.paper}</div>
        <div class="paper-date">${rec.date}</div>
      </div>
      ${isLatest ? '<span class="badge-latest">Latest</span>' : ""}
    </div>
    <div class="score-grid">
      <div class="score-cell">
        <div class="score-value">${rec.partA}<span class="score-max">/${rec.maxA}</span></div>
        <div class="score-pct">${pA}%</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:0" data-w="${pA}%"></div></div>
        <div class="score-label">Part A</div>
      </div>
      <div class="score-cell">
        <div class="score-value">${rec.partB}<span class="score-max">/${rec.maxB}</span></div>
        <div class="score-pct">${pB}%</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:0" data-w="${pB}%"></div></div>
        <div class="score-label">Part B</div>
      </div>
      <div class="score-cell">
        <div class="score-value">${rec.total}<span class="score-max">/${rec.maxTotal}</span></div>
        <div class="score-pct">${pT}%</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:0" data-w="${pT}%"></div></div>
        <div class="score-label">Total</div>
      </div>
    </div>
    <div class="class-compare">
      <div class="cc-cell"><div class="cc-val you">${rec.total}</div><div class="cc-lbl">Your Score</div></div>
      <div class="cc-cell"><div class="cc-val">${rec.classAverage || "—"}</div><div class="cc-lbl">Class Avg</div></div>
      <div class="cc-cell"><div class="cc-val top">${rec.classHighest || "—"}</div><div class="cc-lbl">Highest</div></div>
    </div>
    ${rec.studentRank && rec.classSize ? `
    <div style="padding:12px 20px;border-top:1px solid var(--border)">
      <span class="rank-badge">🏆 &nbsp;Rank ${rec.studentRank} of ${rec.classSize} students</span>
    </div>` : ""}
  </div>`;

  requestAnimationFrame(() => setTimeout(() => {
    document.querySelectorAll(".score-bar-fill")
      .forEach(el => { el.style.width = el.dataset.w; });
  }, 80));
}

// ── Review block ─────────────────────────────────────────
function renderReview(rec) {
  const gTags = rec.good.split(",").map(t => `<span class="tag tag-good">${t.trim()}</span>`).join("");
  const bTags = rec.improve.split(",").map(t => `<span class="tag tag-bad">${t.trim()}</span>`).join("");
  document.getElementById("reviewPanel").innerHTML = `
  <div style="margin-bottom:20px">
    <div class="section-label">Tutor Feedback</div>
    <div class="marks-panel">
      <div class="review-section">
        <div class="review-block good">
          <div class="review-block-title">✓ &nbsp;Strong Areas</div>
          <div class="tags-wrap">${gTags}</div>
        </div>
        <div class="review-block improve">
          <div class="review-block-title">↑ &nbsp;Areas to Improve</div>
          <div class="tags-wrap">${bTags}</div>
        </div>
        <div class="review-block notes">
          <div class="review-block-title">✎ &nbsp;Tutor Review</div>
          <p class="review-text">${rec.review}</p>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Paper analysis ────────────────────────────────────────
function renderPaperAnalysis(stats, classStats) {
  const qs = stats.questions;
  if (!qs || qs.length === 0) return;

  document.getElementById("paperAnalysisSection").style.display = "block";

  const avgSuccessRate = Math.round(
    qs.reduce((s,q) => s + (q.attempted>0 ? (q.correct/q.attempted)*100 : 0), 0) / qs.length
  );

  document.getElementById("paperSummaryRow").innerHTML = `
    <div class="cc-cell"><div class="cc-val" style="color:var(--cream)">${classStats ? classStats.size : "—"}</div><div class="cc-lbl">Students</div></div>
    <div class="cc-cell"><div class="cc-val" style="color:var(--blue)">${classStats ? classStats.average : "—"}</div><div class="cc-lbl">Class Avg</div></div>
    <div class="cc-cell"><div class="cc-val" style="color:var(--green)">${classStats ? classStats.highest : "—"}</div><div class="cc-lbl">Highest</div></div>
    <div class="cc-cell"><div class="cc-val" style="color:var(--red)">${avgSuccessRate}%</div><div class="cc-lbl">Avg Success</div></div>`;

  Charts.questions(qs, classStats ? classStats.size : 1);

  document.getElementById("qaBody").innerHTML = qs.map(q => {
    const rate  = q.attempted > 0 ? Math.round((q.correct/q.attempted)*100) : 0;
    const rateC = rate >= 70 ? "rate-high" : rate >= 40 ? "rate-mid" : "rate-low";
    const aPct  = classStats && classStats.size > 0 ? Math.round((q.attempted/classStats.size)*100) : 100;
    return `<tr>
      <td class="num">Q${q.qNo}</td>
      <td>${q.topic || q.qName}</td>
      <td class="num">${q.maxMarks}</td>
      <td>
        <div class="attempt-bar-wrap">
          <div class="attempt-bar"><div class="attempt-bar-fill" style="width:${aPct}%"></div></div>
          <span class="num">${q.attempted}</span>
        </div>
      </td>
      <td class="num">${q.correct}</td>
      <td class="num">${q.avgScore}</td>
      <td class="num ${rateC}">${rate}%</td>
    </tr>`;
  }).join("");
}

// ── History table ─────────────────────────────────────────
function renderHistory(records) {
  if (records.length <= 1) { document.getElementById("historySection").style.display = "none"; return; }
  document.getElementById("historySection").style.display = "block";
  document.getElementById("historyBody").innerHTML = records.map((r,i) => `
    <tr onclick="selectPaper(${i})">
      <td>${r.paper}${i===0?' <span class="badge-latest">latest</span>':""}</td>
      <td>${r.date}</td>
      <td class="num">${r.partA}/${r.maxA}</td>
      <td class="num">${r.partB}/${r.maxB}</td>
      <td class="num">${r.total}/${r.maxTotal}</td>
      <td class="num">${pct(r.total,r.maxTotal)}%</td>
      <td class="num">${r.grade}</td>
    </tr>`).join("");
}

function selectPaper(i) {
  renderMarksPanel(allRecords[i], i===0);
  renderReview(allRecords[i]);
  document.getElementById("marksPanel").scrollIntoView({ behavior:"smooth", block:"start" });
}

// ── Download PDF ──────────────────────────────────────────
async function downloadPDF() {
  const btn = document.getElementById("dlBtn");
  btn.textContent  = "Generating…";
  btn.style.opacity = "0.6";
  btn.disabled     = true;

  try {
    const res  = await fetch(`${CONFIG.API_URL}?action=getPDF&query=${encodeURIComponent(currentQuery)}`);
    const data = await res.json();
    if (data.error) { setError(data.error); }
    else {
      const bytes = atob(data.pdf);
      const arr   = new Uint8Array(bytes.length);
      for (let i=0;i<bytes.length;i++) arr[i]=bytes.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr],{type:"application/pdf"}));
      const a   = document.createElement("a");
      a.href = url; a.download = data.filename; a.click();
      URL.revokeObjectURL(url);
    }
  } catch(e) { setError("PDF generation failed. Please try again."); }

  btn.innerHTML    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF`;
  btn.style.opacity = "1";
  btn.disabled     = false;
}

// ── Open share modal ──────────────────────────────────────
function openShare() {
  if (!allData || !allRecords.length) return;
  Share.open(allRecords[0], allData.student, allData.quote);
}

// ── Helpers ───────────────────────────────────────────────
function pct(a,b) { return b>0 ? Math.round((a/b)*100) : 0; }
function showSpinner(on) { document.getElementById("spinnerWrap").style.display = on?"flex":"none"; }
function setError(msg)   { const b=document.getElementById("errorBox"); b.textContent=msg; b.style.display=msg?"block":"none"; }
function setSearchBtn(l) { const b=document.getElementById("searchBtn"); b.textContent=l?"Searching…":"Search"; b.disabled=l; }
