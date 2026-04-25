import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="w-screen h-screen bg-canvas text-ink flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-card border border-line-neutral/60 p-6 flex flex-col gap-3">
          <h1 className="text-heading font-semibold">Something went wrong</h1>
          <p className="text-button text-ink/70">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="self-start px-3.5 py-1.75 rounded-lg bg-ink hover:opacity-90 text-ui font-medium text-white transition-opacity"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
