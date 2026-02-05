import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Package, AlertTriangle } from 'lucide-react';
import { SCAN_BARCODE_MUTATION } from '../graphql/lots';

interface ScanResult {
  success: boolean;
  message?: string;
  lot?: {
    id: string;
    lotNumber: string;
    expirationDate?: string;
    product: {
      id: string;
      gtin: string;
      name: string;
    };
  };
  gtin?: string;
  lotNumber?: string;
  expirationDate?: string;
  productName?: string;
  isNewProduct: boolean;
}

export default function ScannerPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [productName, setProductName] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [scanBarcode, { loading }] = useMutation(SCAN_BARCODE_MUTATION);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      stopCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsScanning(true);
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle.');
    }
  }, [stopCamera]);

  // Attach stream to video element when isScanning becomes true
  useEffect(() => {
    if (isScanning && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isScanning]);

  const toggleCamera = useCallback(() => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isScanning, stopCamera, startCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    setError(null);
    try {
      const { data } = await scanBarcode({
        variables: {
          input: {
            barcode: barcode.trim(),
            productName: productName || undefined,
          },
        },
      });

      setResult(data.scanBarcode);
      stopCamera();
    } catch (err: any) {
      // Extract GraphQL error message if available
      const graphqlError = err.graphQLErrors?.[0]?.message;
      const networkError = err.networkError?.result?.errors?.[0]?.message;
      const errorMessage = graphqlError || networkError || err.message || 'Erreur lors du scan';
      setError(errorMessage);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualInput);
  };

  const handleAssociateToClient = () => {
    if (result?.lot) {
      navigate(`/scanner/associate/${result.lot.id}`);
    }
  };

  const resetScan = () => {
    setResult(null);
    setManualInput('');
    setProductName('');
    setError(null);
  };

  return (
    <div className="scanner-page">
      <header className="page-header">
        <h1>Scanner GS1.128</h1>
      </header>

      {!result && (
        <>
          <div className="scanner-camera-section">
            <button 
              onClick={toggleCamera} 
              className={isScanning ? "btn-secondary" : "btn-primary"}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                ...(isScanning ? { background: '#DC2626', color: 'white', border: 'none' } : {})
              }}
            >
              {isScanning ? <X size={20} /> : <Camera size={20} />}
              {isScanning ? 'Désactiver la caméra' : 'Activer la caméra'}
            </button>

            {isScanning && (
              <div className="camera-container" style={{ marginTop: '1rem' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    borderRadius: '8px',
                    backgroundColor: '#000',
                    minHeight: '300px',
                  }}
                />
              </div>
            )}
          </div>

          <div className="divider" style={{ margin: '1.5rem 0 1rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            — ou saisie manuelle —
          </div>

          <form onSubmit={handleManualSubmit} className="manual-input-form" style={{ maxWidth: '500px' }}>
            <div className="form-group">
              <label>Code-barres GS1.128</label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onFocus={() => { if (isScanning) stopCamera(); }}
                placeholder="Ex: 01034567890123421726050110LOT001"
                style={{ fontFamily: 'monospace' }}
              />
              <small style={{ color: 'var(--text-secondary)' }}>
                Format: 01[GTIN-14]17[YYMMDD]10[LOT]
              </small>
            </div>

            <div className="form-group">
              <label>Nom du produit (optionnel, pour nouveaux produits)</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Vaccin XYZ 10ml"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading || !manualInput.trim()}>
              {loading ? 'Scan en cours...' : 'Scanner'}
            </button>
          </form>
        </>
      )}

      {error && (
        <div className="error-message" style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#FEE2E2', 
          borderRadius: '8px',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {result && (
        <div className="scan-result" style={{ 
          marginTop: '1rem', 
          padding: '1.5rem', 
          background: result.success ? '#D1FAE5' : '#FEE2E2',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {result.success ? (
              <Check size={24} color="#059669" />
            ) : (
              <AlertTriangle size={24} color="#DC2626" />
            )}
            <h3 style={{ margin: 0 }}>{result.message}</h3>
          </div>

          {result.success && result.lot && (
            <div className="lot-details" style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Package size={20} />
                <strong>{result.productName || result.lot.product.name}</strong>
                {result.isNewProduct && (
                  <span style={{ 
                    background: '#FEF3C7', 
                    color: '#92400E', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    Nouveau produit
                  </span>
                )}
              </div>

              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: 'var(--text-secondary)' }}>GTIN:</td>
                    <td style={{ fontFamily: 'monospace' }}>{result.gtin}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: 'var(--text-secondary)' }}>N° Lot:</td>
                    <td style={{ fontFamily: 'monospace' }}>{result.lotNumber}</td>
                  </tr>
                  {result.expirationDate && (
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: 'var(--text-secondary)' }}>Expiration:</td>
                      <td>{new Date(result.expirationDate).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleAssociateToClient} className="btn-primary">
                  Associer à un client
                </button>
                <button onClick={resetScan} className="btn-secondary">
                  Nouveau scan
                </button>
              </div>
            </div>
          )}

          {!result.success && (
            <button onClick={resetScan} className="btn-secondary" style={{ marginTop: '1rem' }}>
              Réessayer
            </button>
          )}
        </div>
      )}

      <div className="info-section" style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#F3F4F6', 
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Format GS1.128</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Le code GS1.128 contient les informations suivantes :<br />
          • <strong>01</strong> + GTIN (14 chiffres) - Identifiant produit<br />
          • <strong>17</strong> + YYMMDD - Date d'expiration<br />
          • <strong>10</strong> + Numéro de lot
        </p>
      </div>
    </div>
  );
}
