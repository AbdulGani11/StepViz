import React from 'react';

// Error boundary must remain a class component as React hooks don't support error catching
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('Visualization Error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        // Render fallback UI when an error occurs
        return (
            <div className="p-4 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Visualization Error
                </h3>
                <p className="text-gray-600">
                    There was an error rendering the visualization.
                </p>
                <button
                    onClick={this.handleReset}
                    className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-200 
                             rounded-md hover:bg-blue-50"
                >
                    Try Again
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;