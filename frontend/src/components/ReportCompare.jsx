import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";
import { labValues, reportMeta } from "../data/mockData.js";
import { fmtDate, statusOf, trendOf } from "../data/helpers.js";
import { Badge, Ruler } from "./ui.jsx";

const TREND = {
  improved: { tone: "ok", label: "Improved" },
  worse: { tone: "bad", label: "Moved away from range" },
  stable: { tone: "neutral", label: "Little change" },
  steady: { tone: "ok", label: "Steady, in range" },
};

export default function ReportCompare({ labValues: values = labValues, liveAnalysis = false }) {
  const comparable = values.filter((lab) => typeof lab.prev === "number" && Number.isFinite(lab.prev));
  if (comparable.length === 0) {
    return (
      <section className="card">
        <h2 className="h3">No earlier results to compare</h2>
        <p className="muted">
          {liveAnalysis
            ? "This report did not include previous values for comparison. Upload a report with earlier results to see what changed."
            : "Earlier values will appear here when available."}
        </p>
      </section>
    );
  }

  const rows = comparable.map((l) => ({ ...l, trend: trendOf(l), delta: +(l.curr - l.prev).toFixed(2) }));
  const count = (t) => rows.filter((r) => r.trend === t).length;
  const attention = rows.filter((r) => statusOf(r.curr, r.refLow, r.refHigh) !== "normal");

  return (
    <div className="stack">
      <section className="card changed-hero">
        <TrendingUp size={22} aria-hidden="true" />
        <div>
          <h2>{count("improved")} of {rows.length} values moved in a better direction</h2>
          <p>
            {liveAnalysis
              ? "Compared with earlier values included in this report."
              : `Compared with your ${fmtDate(reportMeta.prev.date)} report.`}{" "}
            {count("worse") ? `${count("worse")} moved away from range.` : "None moved away from range."}{" "}
            {attention.length} {attention.length === 1 ? "value is" : "values are"} still outside range, so keep them on your list for the doctor.
            {values.length > rows.length && ` ${values.length - rows.length} value${values.length - rows.length === 1 ? "" : "s"} had no earlier result and could not be compared.`}
          </p>
        </div>
      </section>

      <section className="card flush">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Test</th>
                <th>{liveAnalysis ? "Earlier" : fmtDate(reportMeta.prev.date, { day: "numeric", month: "short" })}</th>
                <th>{liveAnalysis ? "Current" : fmtDate(reportMeta.curr.date, { day: "numeric", month: "short" })}</th>
                <th>Change</th>
                <th className="hide-sm">Position on range</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const t = TREND[r.trend];
                let Arrow = ArrowDownRight;
                if (r.delta === 0) Arrow = Minus;
                else if (r.delta > 0) Arrow = ArrowUpRight;
                return (
                  <tr key={r.id}>
                    <td><b>{r.name}</b><small>{r.unit}</small></td>
                    <td className="num muted">{r.prev}</td>
                    <td className="num"><b>{r.curr}</b></td>
                    <td>
                      <span className={`delta ${t.tone}`}><Arrow size={14} aria-hidden="true" />{r.delta > 0 ? "+" : ""}{r.delta}</span>
                      <Badge tone={t.tone}>{t.label}</Badge>
                    </td>
                    <td className="hide-sm wide">
                      <Ruler value={r.curr} prev={r.prev} min={r.min} max={r.max} low={r.refLow} high={r.refHigh} unit={r.unit} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="legend"><span className="lg dot" /> latest <span className="lg ghost" /> previous <span className="lg band" /> reference range</p>
      </section>
    </div>
  );
}
