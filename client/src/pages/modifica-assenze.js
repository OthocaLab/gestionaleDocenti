import ModificaAssenze from '../components/ModificaAssenze';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';

const ModificaAssenzePage = () => {
  return (
    <Layout>
      <ModificaAssenze />
    </Layout>
  );
};

export default withAuth(ModificaAssenzePage); 