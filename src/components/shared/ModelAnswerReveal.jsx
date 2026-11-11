/**
 * Shows the model answer next to the student's own text, with a
 * self-rating control. The self-rating is recorded and printed in the
 * report but never changes the score (section 10.2).
 *
 * @param {Object} props
 * @param {string} props.studentText
 * @param {string} props.modelAnswer
 * @param {string|null} props.selfRating
 * @param {(rating: string) => void} props.onSelfRating
 * @param {boolean} [props.disabled]
 */
export function ModelAnswerReveal({ studentText, modelAnswer, selfRating, onSelfRating, disabled }) {
  const ratings = ['Matches', 'Partly matches', 'Missed the point'];
  return (
    <div className="model-answer">
      <div className="model-answer__columns">
        <div>
          <h4 className="model-answer__heading">Your answer</h4>
          <p className="model-answer__text">{studentText}</p>
        </div>
        <div>
          <h4 className="model-answer__heading">Model answer</h4>
          <p className="model-answer__text">{modelAnswer}</p>
        </div>
      </div>
      <fieldset className="model-answer__rating">
        <legend>How does your answer compare?</legend>
        <div className="model-answer__rating-buttons">
          {ratings.map((rating) => (
            <button
              key={rating}
              type="button"
              className={`button button--small${selfRating === rating ? ' button--selected' : ''}`}
              disabled={disabled}
              onClick={() => onSelfRating(rating)}
            >
              {rating}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
