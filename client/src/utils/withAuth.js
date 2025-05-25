import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const withAuth = (WrappedComponent) => {
  const AuthenticatedComponent = (props) => {
    return (
      <ProtectedRoute>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthenticatedComponent;
};

export default withAuth; 