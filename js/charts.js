// ============================================================
//  CHARTS MODULE
// ============================================================

const Charts = (() => {

  let instances = {};

  Chart.defaults.color       = "rgba(240,230,200,0.55)";
  Chart.defaults.borderColor = "rgba(212,168,67,0.12)";
  Chart.defaults.font.family = "'DM Mono', monospace";
  Chart.defaults.font.size   = 11;

  function destroy(id) {
    if (instances[id]) { instances[id].destroy(); delete instances[id]; }
  }

  function destroyAll() {
    Object.keys(instances).forEach(destroy);
  }

  function trend(records) {
    destroy("trendChart");
    const rev    = [...records].reverse();
    const labels = rev.map(r => r.paper.length > 12 ? r.paper.substring(0,12)+"…" : r.paper);
    const scores = rev.map(r => pct(r.total, r.maxTotal));
    const ctx    = document.getElementById("trendChart").getContext("2d");
    instances["trendChart"] = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label              : "Score %",
          data               : scores,
          borderColor        : "#d4a843",
          backgroundColor    : "rgba(212,168,67,0.08)",
          pointBackgroundColor: "#d4a843",
          pointRadius        : 5,
          pointHoverRadius   : 7,
          tension            : 0.35,
          fill               : true,
          borderWidth        : 2
        }]
      },
      options: {
        responsive         : true,
        maintainAspectRatio: false,
        plugins: {
          legend : { display: false },
          tooltip: { callbacks: { label: c => ` ${c.parsed.y}%` } }
        },
        scales: {
          x: { grid: { color: "rgba(212,168,67,0.07)" } },
          y: { grid: { color: "rgba(212,168,67,0.07)" }, min: 0, max: 100, ticks: { callback: v => v+"%" } }
        }
      }
    });
  }

  function compare(rec) {
    destroy("compareChart");
    const youPct  = pct(rec.total,        rec.maxTotal);
    const avgPct  = rec.classAverage ? pct(rec.classAverage, rec.maxTotal) : 0;
    const highPct = rec.classHighest ? pct(rec.classHighest, rec.maxTotal) : 0;
    const ctx = document.getElementById("compareChart").getContext("2d");
    instances["compareChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels  : ["You", "Class Avg", "Highest"],
        datasets: [{
          data           : [youPct, avgPct, highPct],
          backgroundColor: ["rgba(212,168,67,0.8)","rgba(96,165,250,0.6)","rgba(74,222,128,0.6)"],
          borderColor    : ["#d4a843","#60a5fa","#4ade80"],
          borderWidth    : 1,
          borderRadius   : 6
        }]
      },
      options: {
        responsive         : true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales : {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(212,168,67,0.07)" }, min: 0, max: 100, ticks: { callback: v => v+"%" } }
        }
      }
    });
  }

  function parts(records) {
    destroy("partsChart");
    const rev    = [...records].reverse();
    const labels = rev.map(r => r.paper.length > 10 ? r.paper.substring(0,10)+"…" : r.paper);
    const ctx = document.getElementById("partsChart").getContext("2d");
    instances["partsChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Part A %", data: rev.map(r => pct(r.partA,r.maxA)), backgroundColor:"rgba(192,132,252,0.6)", borderColor:"#c084fc", borderWidth:1, borderRadius:4 },
          { label: "Part B %", data: rev.map(r => pct(r.partB,r.maxB)), backgroundColor:"rgba(96,165,250,0.6)",  borderColor:"#60a5fa", borderWidth:1, borderRadius:4 }
        ]
      },
      options: {
        responsive         : true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 12 } } },
        scales : {
          x: { grid: { display: false } },
          y: { grid: { color:"rgba(212,168,67,0.07)" }, min:0, max:100, ticks:{ callback: v => v+"%" } }
        }
      }
    });
  }

  function questions(qs, classSize) {
    destroy("questionChart");
    const ctx = document.getElementById("questionChart").getContext("2d");
    instances["questionChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels  : qs.map(q => `Q${q.qNo}`),
        datasets: [
          { label:"Avg Score", data:qs.map(q=>parseFloat(q.avgScore.toFixed(1))), backgroundColor:"rgba(96,165,250,0.7)", borderColor:"rgba(96,165,250,1)", borderWidth:1, borderRadius:4 },
          { label:"Max Marks", data:qs.map(q=>q.maxMarks), backgroundColor:"rgba(212,168,67,0.15)", borderColor:"rgba(212,168,67,0.5)", borderWidth:1, borderRadius:4 }
        ]
      },
      options: {
        responsive         : true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 12 } } },
        scales : {
          x: { grid: { color:"rgba(212,168,67,0.07)" } },
          y: { grid: { color:"rgba(212,168,67,0.07)" }, beginAtZero:true }
        }
      }
    });
  }

  function pct(a,b) { return b>0 ? Math.round((a/b)*100) : 0; }

  return { trend, compare, parts, questions, destroyAll };

})();
