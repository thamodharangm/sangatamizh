import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#111b21',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
          fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '1rem'
          }}>
            Oops! Something went wrong
          </h1>
          
          <p style={{
            color: '#afbacc',
            marginBottom: '2rem',
            maxWidth: '500px'
          }}>
            We're sorry for the inconvenience. Please try refreshing the page.
          </p>
          
          <button
            onClick={this.handleReset}
            style={{
              padding: '14px 32px',
              background: '#58cc02',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #46a302'
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
