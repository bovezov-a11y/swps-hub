import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { privacyPolicy } from '../content/privacy-policy'
import { renderApp } from '../test/render'

describe('privacy policy', () => {
  it('can be read without an account', async () => {
    const router = renderApp('/privacy')

    expect(await screen.findByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(`Version ${privacyPolicy.version}`, { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nobody watches what you do' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/privacy')
  })
})
