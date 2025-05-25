import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Verifica se siamo nel browser prima di usare il router
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [router]);
  
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

// Disabilita la generazione statica per questa pagina
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/login',
      permanent: false,
    },
  };
}