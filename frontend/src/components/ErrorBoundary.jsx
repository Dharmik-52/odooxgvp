import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ff-bg flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-ff-green mb-4">Oops!</h1>
            <p className="text-gray-400 text-xl mb-8">Something went wrong</p>
            <p className="text-gray-500 text-sm mb-8 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-ff-border text-white rounded-lg hover:bg-ff-border/80"
              >
                Reload Page
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-ff-green text-ff-bg font-semibold rounded-lg hover:bg-ff-green/90"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}