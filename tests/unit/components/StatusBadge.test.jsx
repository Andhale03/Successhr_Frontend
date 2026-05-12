import { render, screen } from '@testing-library/react'
import StatusBadge, { statusLabel } from '../../../src/components/StatusBadge'

describe('StatusBadge', () => {
  test('renders known status labels', () => {
    render(<StatusBadge status="priority" />)
    expect(screen.getByText('Priority')).toBeInTheDocument()
  })

  test('falls back to not viewed styling for unknown values', () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText('Not Viewed')).toBeInTheDocument()
  })

  test('statusLabel exposes display text for callers', () => {
    expect(statusLabel('in_review')).toBe('In Review')
    expect(statusLabel('custom')).toBe('custom')
  })
})
