import { Confidence } from '../ui/index.jsx'
import { Icon } from '../ui/icons.jsx'

// Renders one AI answer per the PRD §7 contract: answer → why → evidence → confidence
// → possible impact → human review flag. Reused by drawer and full-screen copilot.
export function SattvaAnswer({ answer, onSource }) {
  return (
    <div className="answer-card">
      <div className="answer-top">
        <div className="answer-headline">{answer.text}</div>
      </div>

      {answer.why && (
        <div className="contract-block">
          <div className="contract-label">Why</div>
          <div className="contract-body">{answer.why}</div>
        </div>
      )}

      {answer.evidence?.length > 0 && (
        <div className="contract-block">
          <div className="contract-label">Evidence</div>
          <div>{answer.evidence.map((e, i) => <div className="evidence-item" key={i}>{e}</div>)}</div>
          {answer.sources?.length > 0 && (
            <div className="row wrap gap-xs" style={{ marginTop: 10 }}>
              {answer.sources.map((s) => (
                <span className="source-chip" key={s.id} onClick={() => onSource?.(s)}>
                  <Icon.doc width={13} height={13} /> {s.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {answer.impact && (
        <div className="contract-block">
          <div className="contract-label">Possible impact</div>
          <div className="contract-body">{answer.impact}</div>
        </div>
      )}

      <div className="answer-foot">
        <Confidence value={answer.confidence} />
        {answer.humanReview ? (
          <span className="badge tone-warning"><span className="badge-dot" />Needs human review</span>
        ) : (
          <span className="badge tone-success"><span className="badge-dot" />Informational</span>
        )}
      </div>
    </div>
  )
}
