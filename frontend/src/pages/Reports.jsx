import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, MessageCircle, Plus, ScanLine, TriangleAlert } from "lucide-react";
import { PageHeader, Badge, Ruler, STATUS_LABEL } from "../components/ui.jsx";
import ReportUpload from "../components/ReportUpload.jsx";
import ReportCompare from "../components/ReportCompare.jsx";
import { useApp } from "../context/AppContext.jsx";
import { labValues, reportMeta } from "../data/mockData.js";
import { fmtDate, statusOf } from "../data/helpers.js";

function referenceRange(lab) {
  if (lab.refLow != null && lab.refHigh != null) return `${lab.refLow}–${lab.refHigh}`;
  if (lab.refHigh != null) return `up to ${lab.refHigh}`;
  if (lab.refLow != null) return `${lab.refLow}+`;
  return "not provided";
}

function ValueCard({ lab, lang, onAsk }) {
  const st = statusOf(lab.curr, lab.refLow, lab.refHigh);
  return (
    <article className={`card value ${st}`}>
      <div className="value-top">
        <div>
          <h3>{lab.name}</h3>
          <p className="muted small">Reference {referenceRange(lab)} {lab.unit}</p>
        </div>
        <div className="value-num">
          <b>{lab.curr}</b><small>{lab.unit}</small>
        </div>
      </div>
      <Ruler value={lab.curr} prev={lab.prev} min={lab.min} max={lab.max} low={lab.refLow} high={lab.refHigh} unit={lab.unit} />
      <div className="value-status">
        <Badge tone={st === "normal" ? "ok" : "warn"}>{STATUS_LABEL[st]}</Badge>
      </div>
      <p className="explain" lang={lang === "hi" ? "hi-Latn" : "en"}>{lab[lang]}</p>
      <button className="link" onClick={() => onAsk(lang === "hi" ? `Mera ${lab.name} kaisa hai?` : `What does my ${lab.name} result mean?`)}>
        <MessageCircle size={15} aria-hidden="true" /> Ask a follow-up
      </button>
    </article>
  );
}

function AnalysisSummary({ values, attention, analysis, summary }) {
  let statusText;
  if (attention.length > 0) {
    const names = attention.map((lab) => lab.name).join(", ");
    statusText = `${names} ${attention.length === 1 ? "is" : "are"} outside the reference range. That alone doesn't tell you why, so these are worth discussing with your doctor.`;
  } else {
    statusText = "All extracted values are within their provided reference ranges.";
  }

  const sourceText = analysis
    ? `Analyzed ${analysis.files.join(", ")} on ${fmtDate(analysis.at)}.`
    : `Report from ${reportMeta.curr.lab}, ${fmtDate(reportMeta.curr.date)}.`;

  return (
    <section className="callout">
      {attention.length ? <TriangleAlert size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
      <div>
        <b>{values.length - attention.length} of {values.length} values are in range</b>
        <p>{statusText} {sourceText}{summary && <span> {summary}</span>}</p>
      </div>
    </section>
  );
}

function AnalysisContent({ values, attention, analysis, summary, lang, onAsk }) {
  if (values.length === 0) {
    return (
      <section className="card">
        <h2 className="h3">No lab values found</h2>
        <p className="muted">The uploaded report was analyzed, but no numeric lab values could be extracted. Try a clearer image or PDF page.</p>
        {summary && <p>{summary}</p>}
      </section>
    );
  }

  return (
    <>
      <AnalysisSummary values={values} attention={attention} analysis={analysis} summary={summary} />
      <div className="grid values">
        {values.map((lab) => <ValueCard key={lab.id} lab={lab} lang={lang} onAsk={onAsk} />)}
      </div>
    </>
  );
}

export default function Reports() {
  const { state, openChat } = useApp();
  const [tab, setTab] = useState("analysis");
  const [adding, setAdding] = useState(false);
  const hasAnalysis = Boolean(state.reportAnalysis);
  const analyzedValues = hasAnalysis ? state.reportAnalysis.lab_values : labValues;
  const attention = analyzedValues.filter((l) => statusOf(l.curr, l.refLow, l.refHigh) !== "normal");
  const summary = state.lang === "hi" ? state.reportAnalysis?.summary_hi : state.reportAnalysis?.summary_en;

  return (
    <>
      <PageHeader title="Reports" subtitle="Your lab reports explained in plain language.">
        <Link to="/app/scanner" className="btn"><ScanLine size={16} /> Scan a prescription</Link>
        <button className="btn primary" onClick={() => setAdding((v) => !v)}><Plus size={16} /> Add report</button>
      </PageHeader>

      {adding && <ReportUpload onDone={() => setAdding(false)} />}

      {state.uploads.length > 0 && (
        <section className="card uploads">
          <h3>Added to CareLens</h3>
          <ul>
            {state.uploads.slice(0, 4).map((u) => (
              <li key={u.id}>
                <FileText size={16} aria-hidden="true" /> <b>{u.name}</b>
                <span className="muted small">{fmtDate(u.at)}{u.mock ? " · demo analysis" : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "analysis"} className={tab === "analysis" ? "on" : ""} onClick={() => setTab("analysis")}>Report analysis</button>
        <button role="tab" aria-selected={tab === "changes"} className={tab === "changes" ? "on" : ""} onClick={() => setTab("changes")}>What changed since last time</button>
      </div>

      {tab === "analysis" ? (
        <AnalysisContent
          values={analyzedValues}
          attention={attention}
          analysis={state.reportAnalysis}
          summary={summary}
          lang={state.lang}
          onAsk={openChat}
        />
      ) : (
        <ReportCompare labValues={analyzedValues} liveAnalysis={hasAnalysis} />
      )}
    </>
  );
}
