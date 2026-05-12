import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUpload from '../../../src/components/FileUpload'

describe('FileUpload', () => {
  test('calls onFiles with selected files and resets input', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' })

    render(<FileUpload onFiles={onFiles} />)

    await user.upload(screen.getByLabelText(/choose files/i), file)

    expect(onFiles).toHaveBeenCalledWith([file])
  })

  test('renders file list and remove action', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(<FileUpload files={[{ name: 'resume.pdf' }]} onRemove={onRemove} />)

    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /remove file/i }))
    expect(onRemove).toHaveBeenCalledWith(0)
  })
})
