import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800">Beklenmeyen bir hata oluştu</h2>
          <p className="max-w-md text-sm text-gray-500">
            Sayfa yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
          {this.state.error && (
            <details className="mt-2 max-w-lg text-left">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                Teknik detaylar
              </summary>
              <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sayfayı Yenile
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
