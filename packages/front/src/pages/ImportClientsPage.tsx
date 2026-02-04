import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, ArrowLeft, Download } from 'lucide-react';

interface ImportResult {
  success: number;
  errors: { line: number; error: string }[];
}

export default function ImportClientsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Veuillez sélectionner un fichier .csv');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/clients/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'import');
      }

      const data: ImportResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `name;address;city;postalCode;phone;email;filieres
Ferme Dupont;12 rue des Champs;Lyon;69001;0612345678;contact@ferme.fr;Bovine,Ovine
Clinique Martin;5 avenue du Parc;Montpellier;34000;0498765432;info@clinique.fr;Canine`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_import_clients.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-page">
      <header className="page-header">
        <Link to="/clients" className="btn-back">
          <ArrowLeft size={20} /> Retour
        </Link>
        <h1>Importer des clients</h1>
      </header>

      <div className="import-instructions" style={{ 
        background: 'var(--card-bg)', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '1.5rem' 
      }}>
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={24} /> Format du fichier CSV
        </h2>
        
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Le fichier doit être au format CSV avec le <strong>point-virgule (;)</strong> comme séparateur.
          La première ligne doit contenir les en-têtes.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>#</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Colonne</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Obligatoire</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: '0.5rem' }}>1</td><td><code>name</code></td><td>✅ Oui</td><td>Nom du client</td></tr>
            <tr><td style={{ padding: '0.5rem' }}>2</td><td><code>address</code></td><td>Non</td><td>Adresse</td></tr>
            <tr><td style={{ padding: '0.5rem' }}>3</td><td><code>city</code></td><td>Non</td><td>Ville</td></tr>
            <tr><td style={{ padding: '0.5rem' }}>4</td><td><code>postalCode</code></td><td>Non</td><td>Code postal</td></tr>
            <tr><td style={{ padding: '0.5rem' }}>5</td><td><code>phone</code></td><td>Non</td><td>Téléphone</td></tr>
            <tr><td style={{ padding: '0.5rem' }}>6</td><td><code>email</code></td><td>✅ Oui</td><td>Email</td></tr>
            <tr><td style={{ padding: '0.5rem' }}>7</td><td><code>filieres</code></td><td>Non</td><td>Filières (séparées par virgule)</td></tr>
          </tbody>
        </table>

        <div style={{ 
          background: 'var(--bg)', 
          padding: '1rem', 
          borderRadius: '8px', 
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          overflowX: 'auto'
        }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Exemple :</div>
          <div>name;address;city;postalCode;phone;email;filieres</div>
          <div>Ferme Dupont;12 rue des Champs;Lyon;69001;0612345678;contact@ferme.fr;Bovine,Ovine</div>
        </div>

        <button 
          type="button"
          onClick={downloadTemplate}
          className="btn-secondary"
          style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={18} /> Télécharger le modèle
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ 
        background: 'var(--card-bg)', 
        padding: '1.5rem', 
        borderRadius: '12px' 
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <label 
            htmlFor="file-upload"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              border: '2px dashed var(--border)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <span style={{ fontWeight: 500 }}>
              {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              ou glissez-déposez votre fichier ici
            </span>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: '#DC2626',
            background: '#FEE2E2',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#059669',
              background: '#D1FAE5',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '0.5rem'
            }}>
              <CheckCircle size={20} />
              {result.success} client(s) importé(s) avec succès
            </div>

            {result.errors.length > 0 && (
              <div style={{ 
                background: '#FEF3C7',
                padding: '1rem',
                borderRadius: '8px',
                color: '#B45309'
              }}>
                <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                  {result.errors.length} erreur(s) :
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {result.errors.map((err, i) => (
                    <li key={i}>Ligne {err.line}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={!file || loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Import en cours...' : 'Importer'}
          </button>
          
          {result && result.success > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/clients')}
            >
              Voir les clients
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
