/**
 * One numbered section of the printable RCA report.
 * @param {Object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} props.children
 */
export function ReportSection({ title, children }) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">{title}</h2>
      <div className="report-section__body">{children}</div>
    </section>
  );
}
