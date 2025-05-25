import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Reindirizza solo nel browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Reindirizzamento...</p>
    </div>
  );
}