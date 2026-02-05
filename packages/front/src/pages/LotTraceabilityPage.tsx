import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Link, useLocation } from 'react-router-dom';
import { Search, Package, Users, Calendar, ArrowRight, FileText, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import { ALL_LOTS_QUERY, LOT_TRACEABILITY_QUERY } from '../graphql/lots';

interface Lot {
  id: string;
  lotNumber: string;
  expirationDate?: string;
  rawBarcode?: string;
  createdAt: string;
  product: {
    id: string;
    gtin: string;
    name: string;
  };
}

interface LotDelivery {
  id: string;
  quantity: number;
  deliveryDate: string;
  clientId: string;
  clientName?: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostalCode?: string;
}

interface TraceabilityData {
  lot: Lot;
  deliveries: LotDelivery[];
  totalQuantity: number;
  clientCount: number;
}

export default function LotTraceabilityPage() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  // Reset to list view when navigating to this page
  useEffect(() => {
    setSelectedLotId(null);
    setSearchQuery('');
  }, [location.key]);

  const { data: lotsData, loading: loadingLots } = useQuery(ALL_LOTS_QUERY, {
    variables: { search: searchQuery || null },
  });

  const { data: traceData, loading: loadingTrace } = useQuery(LOT_TRACEABILITY_QUERY, {
    variables: { lotId: selectedLotId },
    skip: !selectedLotId,
  });

  const lots: Lot[] = lotsData?.allLots || [];
  const traceability: TraceabilityData | null = traceData?.lotTraceability || null;

  return (
    <div className="traceability-page">
      {!selectedLotId && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{lots.length}</span>
            <span className="stat-label">Lots</span>
          </div>
        </div>
      )}

      <header className="page-header">
        <h1>Traçabilité des Lots</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!selectedLotId && lots.length > 0 && (
            <button 
              className="btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={18} /> Export PDF
            </button>
          )}
          {selectedLotId && (
            <button 
              className="btn-secondary"
              onClick={() => setSelectedLotId(null)}
            >
              ← Retour à la liste
            </button>
          )}
        </div>
      </header>

      {!selectedLotId && (
        <div className="search-section" style={{ marginBottom: '1.5rem' }}>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher par n° lot, GTIN ou nom produit..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedLotId(null);
            }}
          />
        </div>

        {loadingLots && <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement...</p>}

        {!loadingLots && lots.length > 0 && !selectedLotId && (
          <div className="search-results" style={{ marginTop: '1rem' }}>
            {lots.map((lot) => (
              <div
                key={lot.id}
                className="lot-result"
                onClick={() => setSelectedLotId(lot.id)}
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{lot.product.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Lot: <span style={{ fontFamily: 'monospace' }}>{lot.lotNumber}</span>
                    {' | '}
                    GTIN: <span style={{ fontFamily: 'monospace' }}>{lot.product.gtin}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {lot.rawBarcode && (
                    <div className="lot-barcode-print" style={{ display: 'none' }}>
                      <Barcode 
                        value={lot.rawBarcode}
                        format="CODE128"
                        width={1}
                        height={35}
                        fontSize={8}
                        margin={2}
                      />
                    </div>
                  )}
                  <ArrowRight size={18} className="no-print" />
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {loadingTrace && <div className="loading">Chargement de la traçabilité...</div>}

      {traceability && (
        <div className="traceability-report">
          <div className="report-header" style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px 8px 0 0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Package size={24} />
                  <h2 style={{ margin: 0 }}>{traceability.lot.product.name}</h2>
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  <span>GTIN: {traceability.lot.product.gtin}</span>
                  {' | '}
                  <span>Lot: {traceability.lot.lotNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {traceability.lot.rawBarcode && (
            <div className="barcode-section" style={{
              background: 'white',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderBottom: '1px solid #E5E7EB',
            }}>
              <Barcode 
                value={traceability.lot.rawBarcode}
                format="CODE128"
                width={1.5}
                height={50}
                fontSize={10}
                margin={5}
              />
            </div>
          )}

          <div className="report-summary" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            padding: '1rem',
            background: '#F3F4F6',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{traceability.totalQuantity}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Unités livrées</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{traceability.clientCount}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Clients</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {traceability.lot.expirationDate 
                  ? new Date(traceability.lot.expirationDate).toLocaleDateString('fr-FR')
                  : '—'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expiration</div>
            </div>
          </div>

          <div className="deliveries-section" style={{ padding: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users size={20} />
              Chaîne de distribution ({traceability.deliveries.length} livraisons)
            </h3>

            {traceability.deliveries.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Aucune livraison enregistrée</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Client</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>Quantité</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>Date livraison</th>
                  </tr>
                </thead>
                <tbody>
                  {traceability.deliveries.map((delivery) => (
                    <tr key={delivery.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div>
                          <Link to={`/clients/${delivery.clientId}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                            {delivery.clientName || delivery.clientId}
                          </Link>
                          {(delivery.clientAddress || delivery.clientCity) && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {delivery.clientAddress && <div>{delivery.clientAddress}</div>}
                              {(delivery.clientPostalCode || delivery.clientCity) && (
                                <div>{delivery.clientPostalCode} {delivery.clientCity}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        {delivery.quantity}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          <Calendar size={14} />
                          {new Date(delivery.deliveryDate).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-footer" style={{
            padding: '1rem',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Créé le: {new Date(traceability.lot.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <button 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => window.print()}
            >
              <FileText size={18} />
              Imprimer / PDF
            </button>
          </div>
        </div>
      )}

      {!selectedLotId && !loadingLots && lots.length === 0 && (
        <div className="info-section" style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#F3F4F6',
          borderRadius: '8px',
        }}>
          <Package size={48} strokeWidth={1} />
          <h3>Aucun lot trouvé</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? 'Aucun lot ne correspond à votre recherche.' : 'Scannez un code-barres pour créer votre premier lot.'}
          </p>
        </div>
      )}
    </div>
  );
}
