export function postureGrade(score: number) {
  // className colors the ring; inkClass is a readable text color for the label
  if (score >= 85)
    return {
      label: 'Good',
      className: 'text-success',
      inkClass: 'text-success',
    }
  if (score >= 65)
    return {
      label: 'Fair',
      className: 'text-severity-medium',
      inkClass: 'text-severity-medium-ink',
    }
  if (score >= 40)
    return {
      label: 'Needs attention',
      className: 'text-severity-high',
      inkClass: 'text-severity-high-ink',
    }
  return {
    label: 'At risk',
    className: 'text-severity-critical',
    inkClass: 'text-severity-critical',
  }
}
