import { ChoiceList } from '../shared/ChoiceList.jsx';

const VERDICT_OPTIONS = [
  { id: 'confirmed', text: 'Confirmed' },
  { id: 'ruledOut', text: 'Ruled out' },
  { id: 'unknown', text: 'Cannot tell from the evidence' },
];

/**
 * Pass 2 (eliminate): a verdict for one leaf, with supporting evidence
 * for Confirmed or Ruled out.
 * @param {Object} props
 * @param {import('../../data/scenarios/site-down.js').default['faultTree']['nodes'][string]} props.node
 * @param {Array<import('../../data/scenarios/site-down.js').default['evidence'][number]>} props.evidenceOptions
 * @param {string|null} props.verdict
 * @param {string[]} props.evidenceIds
 * @param {(verdict: string) => void} props.onVerdict
 * @param {(ids: string[]) => void} props.onEvidence
 * @param {boolean} props.showFeedback
 * @param {boolean} [props.disabled]
 */
export function BranchVerdict({ node, evidenceOptions, verdict, evidenceIds, onVerdict, onEvidence, showFeedback, disabled }) {
  const needsEvidence = verdict === 'confirmed' || verdict === 'ruledOut';
  return (
    <div className={`branch-verdict${showFeedback && verdict === node.correctVerdict ? ' branch-verdict--confirmed' : ''}`}>
      <p className="branch-verdict__label">{node.label}</p>
      <ChoiceList
        options={VERDICT_OPTIONS}
        mode="single"
        selectedIds={verdict ? [verdict] : []}
        onChange={([id]) => onVerdict(id)}
        showFeedback={showFeedback}
        isCorrect={(option) => option.id === node.correctVerdict}
        disabled={disabled}
      />
      {needsEvidence && (
        <ChoiceList
          options={evidenceOptions.map((e) => ({ id: e.id, text: e.source }))}
          mode="single"
          selectedIds={evidenceIds}
          onChange={onEvidence}
          showFeedback={showFeedback}
          isCorrect={(option) => node.verdictEvidenceIds?.includes(option.id)}
          disabled={disabled}
        />
      )}
      {showFeedback && <p className="branch-verdict__feedback">{node.verdictFeedback}</p>}
    </div>
  );
}
