import React, { useEffect } from 'react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import setupAxiosInterceptors from '../utils/axiosConfig';
import '../styles/globals.css';

// Componente wrapper che configura gli interceptor
const AxiosInterceptor = ({ children }) => {
  const { token } = React.useContext(AuthContext);

  useEffect(() => {
    setupAxiosInterceptors(token);
  }, [token]);

  return children;
};

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AxiosInterceptor>
          <Component {...pageProps} />
        </AxiosInterceptor>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;