import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ClientForm from '../components/ClientForm';

export default function NewClientPage() {
  return (
    <div className="new-client-page">
      <header className="page-header">
        <Link to="/clients" className="back-link">
          <ArrowLeft size={20} /> Retour
        </Link>
      </header>

      <h1>Nouveau Client</h1>

      <ClientForm />
    </div>
  );
}
