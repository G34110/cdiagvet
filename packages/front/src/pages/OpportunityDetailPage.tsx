import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { ArrowLeft, Edit2, Save, X, Target, User, Calendar, Euro, TrendingUp, Trash2, Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { 
  OPPORTUNITY_QUERY, 
  UPDATE_OPPORTUNITY_MUTATION, 
  ASSIGN_OPPORTUNITY_MUTATION, 
  COMMERCIALS_FOR_ASSIGNMENT_QUERY, 
  DELETE_OPPORTUNITY_MUTATION,
  ADD_PRODUCT_TO_OPPORTUNITY,
  ADD_KIT_TO_OPPORTUNITY,
  UPDATE_OPPORTUNITY_LINE,
  REMOVE_OPPORTUNITY_LINE
} from '../graphql/opportunities';
import { CONVERT_OPPORTUNITY_TO_ORDER } from '../graphql/orders';
import { PRODUCTS_QUERY, PRODUCT_KITS_QUERY } from '../graphql/products';
import { useRecoilValue } from 'recoil';
import { authState } from '../state/auth';
import './OpportunityDetailPage.css';

interface Opportunity {
  id: string;
  title: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  source: string;
  amount: number;
  manualAmount?: number;
  probability: number;
  expectedCloseDate: string;
  status: string;
  lostReason?: string;
  lostComment?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  weightedAmount: number;
  client: {
    id: string;
    name: string;
    organization?: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lines: OpportunityLine[];
}

interface OpportunityLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId?: string;
  kitId?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  isActive: boolean;
}

interface ProductKit {
  id: string;
  code: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface Commercial {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const SOURCE_LABELS: Record<string, string> = {
  SALON: 'Salon',
  APPEL_ENTRANT: 'Appel entrant',
  RECOMMANDATION: 'Recommandation',
  SITE_WEB: 'Site web',
  AUTRE: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: 'Nouveau',
  QUALIFICATION: 'Qualification',
  PROPOSITION: 'Proposition',
  NEGOCIATION: 'Négociation',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
};

const STATUS_COLORS: Record<string, string> = {
  NOUVEAU: '#6b7280',
  QUALIFICATION: '#3b82f6',
  PROPOSITION: '#8b5cf6',
  NEGOCIATION: '#f59e0b',
  GAGNE: '#10b981',
  PERDU: '#ef4444',
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Opportunity>>({});

  const { data, loading, refetch } = useQuery<{ opportunity: Opportunity }>(OPPORTUNITY_QUERY, {
    variables: { id },
    skip: !id,
  });

  const [updateOpportunity, { loading: updating }] = useMutation(UPDATE_OPPORTUNITY_MUTATION);
  const [assignOpportunity, { loading: assigning }] = useMutation(ASSIGN_OPPORTUNITY_MUTATION);
  const [deleteOpportunity, { loading: deleting }] = useMutation(DELETE_OPPORTUNITY_MUTATION);
  const [addProductToOpportunity] = useMutation(ADD_PRODUCT_TO_OPPORTUNITY);
  const [addKitToOpportunity] = useMutation(ADD_KIT_TO_OPPORTUNITY);
  const [updateOpportunityLine] = useMutation(UPDATE_OPPORTUNITY_LINE);
  const [removeOpportunityLine] = useMutation(REMOVE_OPPORTUNITY_LINE);
  const [convertToOrder, { loading: converting }] = useMutation(CONVERT_OPPORTUNITY_TO_ORDER);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedKitId, setSelectedKitId] = useState('');
  const [lineQuantity, setLineQuantity] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const auth = useRecoilValue(authState);
  const canAssign = auth.user?.role === 'ADMIN' || auth.user?.role === 'RESPONSABLE_FILIERE';
  const canDelete = auth.user?.role === 'ADMIN' || auth.user?.role === 'RESPONSABLE_FILIERE';

  const { data: commercialsData } = useQuery<{ commercialsForAssignment: Commercial[] }>(
    COMMERCIALS_FOR_ASSIGNMENT_QUERY,
    { skip: !canAssign }
  );
  const commercials = commercialsData?.commercialsForAssignment || [];

  const { data: productsData } = useQuery<{ products: Product[] }>(PRODUCTS_QUERY);
  const { data: kitsData } = useQuery<{ productKits: ProductKit[] }>(PRODUCT_KITS_QUERY);
  const products = productsData?.products?.filter(p => p.isActive) || [];
  const kits = kitsData?.productKits?.filter(k => k.isActive) || [];

  const opportunity = data?.opportunity;

  const startEditing = () => {
    if (opportunity) {
      setFormData({
        title: opportunity.title,
        probability: opportunity.probability,
        expectedCloseDate: opportunity.expectedCloseDate.split('T')[0],
        notes: opportunity.notes || '',
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Des modifications non enregistrées seront perdues. Voulez-vous vraiment annuler ?')) {
        return;
      }
    }
    setIsEditing(false);
    setFormData({});
    setHasUnsavedChanges(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const input: any = { id };
      if (formData.title) input.title = formData.title;
      if (formData.probability !== undefined) input.probability = formData.probability;
      if (formData.expectedCloseDate) input.expectedCloseDate = formData.expectedCloseDate;
      if (formData.notes !== undefined) input.notes = formData.notes;
      if (formData.manualAmount !== undefined) input.manualAmount = parseFloat(String(formData.manualAmount)) || 0;

      await updateOpportunity({ variables: { input } });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      refetch();
    } catch (error: any) {
      console.error('Erreur modification:', error);
      alert(`Erreur: ${error?.message || 'Erreur lors de la modification'}`);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleAddProduct = async () => {
    if (!id || !selectedProductId) return;
    try {
      await addProductToOpportunity({
        variables: { opportunityId: id, productId: selectedProductId, quantity: lineQuantity },
      });
      setSelectedProductId('');
      setLineQuantity(1);
      setShowAddProductModal(false);
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error?.message || 'Erreur lors de l\'ajout'}`);
    }
  };

  const handleAddKit = async () => {
    if (!id || !selectedKitId) return;
    try {
      await addKitToOpportunity({
        variables: { opportunityId: id, kitId: selectedKitId, quantity: lineQuantity },
      });
      setSelectedKitId('');
      setLineQuantity(1);
      setShowAddProductModal(false);
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error?.message || 'Erreur lors de l\'ajout'}`);
    }
  };

  const handleUpdateLineQuantity = async (lineId: string, newQuantity: number) => {
    try {
      await updateOpportunityLine({
        variables: { lineId, quantity: newQuantity },
      });
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error?.message || 'Erreur lors de la modification'}`);
    }
  };

  const handleRemoveLine = async (lineId: string) => {
    if (!confirm('Supprimer cette ligne ?')) return;
    try {
      await removeOpportunityLine({ variables: { lineId } });
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error?.message || 'Erreur lors de la suppression'}`);
    }
  };

  const handleConvertToOrder = async () => {
    if (!opportunity) return;
    try {
      const { data } = await convertToOrder({
        variables: { opportunityId: opportunity.id },
      });
      setShowConvertModal(false);
      if (data?.convertOpportunityToOrder?.reference) {
        alert(`Commande ${data.convertOpportunityToOrder.reference} créée avec succès !`);
        navigate('/commandes');
      }
    } catch (error: any) {
      alert(`Erreur: ${error?.message || 'Erreur lors de la conversion'}`);
    }
  };

  const canConvert = opportunity?.status === 'GAGNE' && opportunity?.lines?.length > 0;

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!opportunity) {
    return <div className="error">Opportunité non trouvée</div>;
  }

  return (
    <div className="opportunity-detail-page">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate('/pipeline')}>
          <ArrowLeft size={20} />
          Retour aux opportunités
        </button>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button className="btn-secondary" onClick={cancelEditing}>
                <X size={18} />
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={updating}>
                <Save size={18} />
                {updating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <>
              {canConvert && (
                <button className="btn-success" onClick={() => setShowConvertModal(true)}>
                  <ShoppingCart size={18} />
                  Convertir en commande
                </button>
              )}
              <button 
                className="btn-primary" 
                onClick={startEditing}
                disabled={opportunity.status === 'GAGNE' || opportunity.status === 'CONVERTI'}
                title={opportunity.status === 'GAGNE' || opportunity.status === 'CONVERTI' ? 'Modification impossible pour une opportunité gagnée' : ''}
              >
                <Edit2 size={18} />
                Modifier
              </button>
              {canDelete && (
                <button
                  className="btn-danger"
                  onClick={async () => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
                      try {
                        await deleteOpportunity({ variables: { id: opportunity.id } });
                        navigate('/pipeline');
                      } catch (error: any) {
                        alert(`Erreur: ${error?.message || 'Erreur lors de la suppression'}`);
                      }
                    }
                  }}
                  disabled={deleting}
                >
                  <Trash2 size={18} />
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="opportunity-header">
        <div className="opportunity-title-section">
          <span
            className="status-badge"
            style={{ background: STATUS_COLORS[opportunity.status] }}
          >
            {STATUS_LABELS[opportunity.status]}
          </span>
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="edit-title"
            />
          ) : (
            <h1>{opportunity.title}</h1>
          )}
          <p className="client-name">
            <Target size={16} />
            {opportunity.client.name}
            {opportunity.client.organization && ` (${opportunity.client.organization})`}
          </p>
        </div>

        <div className="opportunity-stats">
          <div className="stat">
            <Euro size={20} />
            <span className="stat-value">
              {formatCurrency(opportunity.amount)}
            </span>
            <span className="stat-label">Montant</span>
          </div>
          <div className="stat">
            <TrendingUp size={20} />
            {isEditing ? (
              <input
                type="number"
                name="probability"
                value={formData.probability || 0}
                onChange={handleChange}
                min="0"
                max="100"
                className="edit-probability"
              />
            ) : (
              <span className="stat-value">{opportunity.probability}%</span>
            )}
            <span className="stat-label">Probabilité</span>
          </div>
          <div className="stat">
            <Euro size={20} style={{ opacity: 0.5 }} />
            <span className="stat-value">
              {formatCurrency((opportunity.amount * opportunity.probability) / 100)}
            </span>
            <span className="stat-label">Pondéré</span>
          </div>
        </div>
      </div>

      <div className="opportunity-content">
        <section className="info-section">
          <h2>Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Contact principal</label>
              <span>{opportunity.contactName}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{opportunity.contactEmail || '—'}</span>
            </div>
            <div className="info-item">
              <label>Téléphone</label>
              <span>{opportunity.contactPhone || '—'}</span>
            </div>
            <div className="info-item">
              <label>Source</label>
              <span>{SOURCE_LABELS[opportunity.source] || opportunity.source}</span>
            </div>
            <div className="info-item">
              <label>Date de clôture prévue</label>
              {isEditing ? (
                <input
                  type="date"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate || ''}
                  onChange={handleChange}
                />
              ) : (
                <span>
                  <Calendar size={14} style={{ marginRight: '0.5rem' }} />
                  {formatDate(opportunity.expectedCloseDate)}
                </span>
              )}
            </div>
            <div className="info-item">
              <label>Propriétaire</label>
              {isEditing && canAssign ? (
                <div className="owner-select-wrapper">
                  <User size={14} />
                  <select
                    value={opportunity.owner.id}
                    onChange={async (e) => {
                      try {
                        await assignOpportunity({
                          variables: {
                            opportunityId: opportunity.id,
                            newOwnerId: e.target.value,
                          },
                        });
                        refetch();
                      } catch (error: any) {
                        alert(`Erreur: ${error?.message || 'Erreur lors de la réassignation'}`);
                      }
                    }}
                    disabled={assigning}
                    className="owner-select"
                  >
                    {commercials.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span>
                  <User size={14} style={{ marginRight: '0.5rem' }} />
                  {opportunity.owner.firstName} {opportunity.owner.lastName}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="lines-section">
          <div className="lines-header">
            <h2><Package size={20} /> Lignes produits</h2>
            {isEditing && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddProductModal(true)}
              >
                <Plus size={16} /> Ajouter
              </button>
            )}
          </div>
          {opportunity.lines && opportunity.lines.length > 0 ? (
            <table className="lines-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Prix unit.</th>
                  <th>Total</th>
                  {isEditing && <th></th>}
                </tr>
              </thead>
              <tbody>
                {opportunity.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.productName}</td>
                    <td className="quantity-cell">
                      {isEditing && (
                        <button 
                          className="qty-btn"
                          onClick={() => handleUpdateLineQuantity(line.id, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                      )}
                      <span>{line.quantity}</span>
                      {isEditing && (
                        <button 
                          className="qty-btn"
                          onClick={() => handleUpdateLineQuantity(line.id, line.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </td>
                    <td>{formatCurrency(line.unitPrice)}</td>
                    <td>{formatCurrency(line.total)}</td>
                    {isEditing && (
                      <td>
                        <button 
                          className="btn-icon-danger"
                          onClick={() => handleRemoveLine(line.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={isEditing ? 4 : 3}><strong>Total lignes</strong></td>
                  <td><strong>{formatCurrency(opportunity.lines.reduce((sum, l) => sum + l.total, 0))}</strong></td>
                </tr>
                <tr className="manual-amount-row">
                  <td colSpan={isEditing ? 4 : 3}>Montant additionnel (saisie manuelle)</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        name="manualAmount"
                        value={formData.manualAmount ?? opportunity.manualAmount ?? 0}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="edit-amount"
                      />
                    ) : (
                      formatCurrency(opportunity.manualAmount ?? 0)
                    )}
                  </td>
                </tr>
                <tr className="grand-total-row">
                  <td colSpan={isEditing ? 4 : 3}><strong>Total opportunité</strong></td>
                  <td><strong>{formatCurrency(
                    opportunity.lines.reduce((sum, l) => sum + l.total, 0) + 
                    (isEditing 
                      ? (parseFloat(String(formData.manualAmount ?? opportunity.manualAmount)) || 0)
                      : (opportunity.manualAmount ?? 0)
                    )
                  )}</strong></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="no-lines">
              {isEditing 
                ? 'Aucune ligne produit. Cliquez sur "Ajouter" pour sélectionner des produits ou kits.'
                : 'Aucune ligne produit.'
              }
            </p>
          )}
        </section>

        {showAddProductModal && (
          <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
            <div className="modal add-product-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Ajouter un produit ou kit</h3>
                <button className="btn-close" onClick={() => setShowAddProductModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Produit</label>
                  <select 
                    value={selectedProductId} 
                    onChange={(e) => { setSelectedProductId(e.target.value); setSelectedKitId(''); }}
                  >
                    <option value="">-- Sélectionner un produit --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.unitPrice)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-divider">ou</div>
                <div className="form-group">
                  <label>Kit</label>
                  <select 
                    value={selectedKitId} 
                    onChange={(e) => { setSelectedKitId(e.target.value); setSelectedProductId(''); }}
                  >
                    <option value="">-- Sélectionner un kit --</option>
                    {kits.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} - {formatCurrency(k.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={lineQuantity} 
                    onChange={(e) => setLineQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddProductModal(false)}>
                  Annuler
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={selectedProductId ? handleAddProduct : handleAddKit}
                  disabled={!selectedProductId && !selectedKitId}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="notes-section">
          <h2>Notes</h2>
          {isEditing ? (
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={6}
              placeholder="Ajouter des notes..."
            />
          ) : (
            <p className="notes-content">{opportunity.notes || 'Aucune note'}</p>
          )}
        </section>

        {opportunity.status === 'PERDU' && opportunity.lostReason && (
          <section className="lost-section">
            <h2>Motif de perte</h2>
            <p><strong>Raison:</strong> {opportunity.lostReason}</p>
            {opportunity.lostComment && <p>{opportunity.lostComment}</p>}
          </section>
        )}

        <section className="meta-section">
          <p>Créée le {formatDate(opportunity.createdAt)}</p>
          <p>Modifiée le {formatDate(opportunity.updatedAt)}</p>
        </section>
      </div>

      {showConvertModal && (
        <div className="modal-overlay">
          <div className="modal convert-modal">
            <h3>Convertir en commande</h3>
            <p>Vous êtes sur le point de créer une commande à partir de cette opportunité.</p>
            <div className="convert-summary">
              <div className="summary-item">
                <span className="summary-label">Client</span>
                <span className="summary-value">{opportunity.client.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Montant</span>
                <span className="summary-value">
                  {formatCurrency(opportunity.amount)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Produits</span>
                <span className="summary-value">{opportunity.lines?.length || 0} ligne(s)</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConvertModal(false)}>
                Annuler
              </button>
              <button 
                className="btn-success" 
                onClick={handleConvertToOrder}
                disabled={converting}
              >
                <ShoppingCart size={16} />
                {converting ? 'Conversion...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
