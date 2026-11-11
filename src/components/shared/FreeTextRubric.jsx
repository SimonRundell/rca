import { useState } from 'react';
import { markFreeText } from '../../lib/rubric.js';
import { FeedbackBanner } from './FeedbackBanner.jsx';
import { ModelAnswerReveal } from './ModelAnswerReveal.jsx';

/**
 * A free-text prompt, marked against a keyword rubric and always
 * labelled an "indicative mark" (section 10.2). Handles its own typing
 * and submission; reports the finished {text, result, selfRating} up
 * to the parent stage once the student has submitted.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').FreeTextPrompt} props.promptDef
 * @param {{text: string, result: Object, selfRating: string|null}|undefined} props.saved
 * @param {(value: {text: string, result: Object, selfRating: string|null}) => void} props.onChange
 * @param {boolean} props.revealModelAnswer   false defers the model answer until the stage is locked (Assessed mode)
 * @param {boolean} [props.allowResubmit]     Practice mode: true. Assessed mode: false once submitted.
 */
export function FreeTextRubric({ promptDef, saved, onChange, revealModelAnswer, allowResubmit = true }) {
  const [text, setText] = useState(saved?.text ?? '');
  const [tooShort, setTooShort] = useState(false);
  const submitted = Boolean(saved?.result);

  function handleSubmit() {
    const result = markFreeText(promptDef, text);
    if (!result.meetsMinWords) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    onChange({ text, result, selfRating: saved?.selfRating ?? null });
  }

  function handleEditAgain() {
    setTooShort(false);
    onChange(undefined);
  }

  const canEdit = !submitted || allowResubmit;

  return (
    <div className="free-text">
      <label className="free-text__label" htmlFor={promptDef.id}>
        {promptDef.prompt}
      </label>
      <textarea
        id={promptDef.id}
        className="free-text__input"
        rows={4}
        value={text}
        disabled={submitted && !allowResubmit}
        onChange={(e) => setText(e.target.value)}
      />
      {(!submitted || allowResubmit) && !submitted && (
        <button type="button" className="button" onClick={handleSubmit}>
          Submit answer
        </button>
      )}
      {tooShort && (
        <FeedbackBanner kind="incorrect">
          That needs to be at least {promptDef.minWords} words. Please expand your answer and submit again.
        </FeedbackBanner>
      )}
      {submitted && (
        <div className="free-text__result">
          <p className="free-text__indicative">
            Indicative mark: {Math.round(saved.result.score * 100)}% ({saved.result.hits} of {saved.result.groupCount} concepts found)
          </p>
          <ul className="free-text__concepts">
            {saved.result.concepts.map((c) => (
              <li key={c.label} className={c.found ? 'concept--found' : 'concept--missing'}>
                <span aria-hidden="true">{c.found ? '✓' : '✗'}</span> {c.label}
                {c.required && !c.found ? ' (required)' : ''}
              </li>
            ))}
          </ul>
          {canEdit && (
            <button type="button" className="button button--small" onClick={handleEditAgain}>
              Edit and resubmit
            </button>
          )}
          {revealModelAnswer && (
            <ModelAnswerReveal
              studentText={saved.text}
              modelAnswer={promptDef.modelAnswer}
              selfRating={saved.selfRating}
              onSelfRating={(rating) => onChange({ ...saved, selfRating: rating })}
            />
          )}
        </div>
      )}
    </div>
  );
}
