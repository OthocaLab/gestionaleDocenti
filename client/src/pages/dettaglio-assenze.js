import DettaglioAssenza from '../components/DettaglioAssenza';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';

const DettaglioAssenzePage = () => {
  return (
    <Layout>
      <DettaglioAssenza />
    </Layout>
  );
};

export default withAuth(DettaglioAssenzePage); 