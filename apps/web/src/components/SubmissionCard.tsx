import type { SubmissionSummary } from "@/generated/api-types";
import { formatAnswerValue, formatSubmittedAt, answersEntries } from "@/lib/format";

type Props = {
  submission: SubmissionSummary;
  index: number;
  formatFieldKey: (key: string) => string;
};

export function SubmissionCard({ submission, index, formatFieldKey }: Props) {
  return (
    <li className="submission-card">
      <p className="submission-meta">
        Response {index + 1} · Version {submission.formConfigVersion} ·{" "}
        {formatSubmittedAt(submission.createdAt)}
      </p>
      <dl className="answer-list">
        {answersEntries(submission.answers).map(([key, value]) => (
          <div key={key} className="answer-row">
            <dt>{formatFieldKey(key)}</dt>
            <dd>{formatAnswerValue(value)}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

export function formatSubmissionFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
