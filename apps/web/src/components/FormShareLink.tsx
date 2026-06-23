import { useEffect, useState } from "react";

type Props = {
  formId: string;
};

function buildFormUrl(formId: string): string {
  if (typeof window === "undefined") {
    return `/forms/${formId}`;
  }
  return `${window.location.origin}/forms/${formId}`;
}

export function FormShareLink({ formId }: Props) {
  const [url, setUrl] = useState(() => buildFormUrl(formId));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    setUrl(buildFormUrl(formId));
  }, [formId]);

  async function handleCopy() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="form-share">
      <span className="form-share__label">Share link</span>
      <div className="form-share__row">
        <input
          type="text"
          className="form-share__input"
          value={url}
          readOnly
          aria-label="Form link"
          onFocus={(event) => event.currentTarget.select()}
        />
        <button type="button" className="button-secondary form-share__button" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {copyError ? (
        <p className="meta form-share__error" role="alert">
          Could not copy. Select the link and copy manually.
        </p>
      ) : null}
    </div>
  );
}
