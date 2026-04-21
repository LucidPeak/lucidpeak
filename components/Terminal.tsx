"use client";

export function Terminal() {
  return (
    <div className="term-surface" aria-label="Subscribe to updates" role="region">
      <div className="term-line term-dim">lucidpeak — studio terminal</div>
      <div className="term-line term-dim">type and press return</div>
      <div className="term-line">&nbsp;</div>

      <div aria-hidden="true">
        <div className="term-line">
          <span className="term-prompt">$ </span>
          subscribe <span className="term-flag">--email</span> luna@hello.com
        </div>
        <div className="term-line term-success">✓ subscribed. see you soon.</div>
      </div>

      <div className="term-line">&nbsp;</div>

      <div className="term-prompt-line">
        <span className="term-prompt" aria-hidden="true">$ </span>
        <span aria-hidden="true">subscribe&nbsp;</span>
        <span className="term-flag" aria-hidden="true">--email&nbsp;</span>
        <span className="term-caret" />
      </div>
    </div>
  );
}
