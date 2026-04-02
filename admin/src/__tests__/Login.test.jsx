/**
 * Komponenten-Tests für die Login-Seite.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login.jsx'

// Firebase Auth-Funktionen mocken
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
}))

// useAuth mocken (kein eingeloggter Nutzer)
vi.mock('@/hooks/useAuth.js', () => ({
  useAuth: () => ({ user: null, role: null, loading: false }),
}))

// useNavigate mocken
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rendert E-Mail- und Passwort-Felder', () => {
    renderLogin()
    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument()
  })

  it('rendert Anmelden-Button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument()
  })

  it('rendert Google-Login-Button', () => {
    renderLogin()
    expect(screen.getByText('Mit Google anmelden')).toBeInTheDocument()
  })

  it('ruft signInWithEmailAndPassword mit korrekten Daten auf', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    signInWithEmailAndPassword.mockResolvedValue({})

    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('E-Mail'), 'admin@test.com')
    await user.type(screen.getByLabelText('Passwort'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'admin@test.com',
        'password123',
      )
    })
  })

  it('zeigt Fehlermeldung bei falschem Passwort', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/wrong-password' })

    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('E-Mail'), 'admin@test.com')
    await user.type(screen.getByLabelText('Passwort'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => {
      expect(screen.getByText('Falsches Passwort.')).toBeInTheDocument()
    })
  })
})
