import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Plus, Trash2 } from 'lucide-react';
import { MY_CLIENTS_QUERY } from '../graphql/clients';
import { PRODUCTS_QUERY, PRODUCT_KITS_QUERY } from '../graphql/products';

interface Client {
  id: string;
  name: string;
  organization?: string;
}

interface MyClientsData {
  myClients: Client[];
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

export interface PendingLine {
  tempId: string;
  type: 'product' | 'kit';
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OpportunityFormData {
  clientId: string;
  title: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  amount: number;
  probability?: number;
  expectedCloseDate: string;
  notes: string;
  pendingLines: PendingLine[];
}

interface OpportunityFormProps {
  initialData?: Partial<OpportunityFormData>;
  onSubmit: (data: OpportunityFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const SOURCES = [
  { value: 'SALON', label: 'Salon' },
  { value: 'APPEL_ENTRANT', label: 'Appel entrant' },
  { value: 'RECOMMANDATION', label: 'Recommandation' },
  { value: 'SITE_WEB', label: 'Site web' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function OpportunityForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: OpportunityFormProps) {
  const [formData, setFormData] = useState<OpportunityFormData>({
    clientId: initialData?.clientId || '',
    title: initialData?.title || '',
    contactName: initialData?.contactName || '',
    contactEmail: initialData?.contactEmail || '',
    contactPhone: initialData?.contactPhone || '',
    source: initialData?.source || 'SALON',
    amount: initialData?.amount || 0,
    probability: initialData?.probability,
    expectedCloseDate: initialData?.expectedCloseDate || '',
    notes: initialData?.notes || '',
    pendingLines: initialData?.pendingLines || [],
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedKitId, setSelectedKitId] = useState('');
  const [kitQuantity, setKitQuantity] = useState(1);
  const [productQuantity, setProductQuantity] = useState(1);

  const { data: clientsData } = useQuery<MyClientsData>(MY_CLIENTS_QUERY);
  const clients = clientsData?.myClients || [];

  const { data: productsData } = useQuery<{ products: Product[] }>(PRODUCTS_QUERY);
  const { data: kitsData } = useQuery<{ productKits: ProductKit[] }>(PRODUCT_KITS_QUERY);
  const products = productsData?.products?.filter(p => p.isActive) || [];
  const kits = kitsData?.productKits?.filter(k => k.isActive) || [];


  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleAddProduct = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    setFormData(prev => ({
      ...prev,
      pendingLines: [
        ...prev.pendingLines,
        {
          tempId: generateTempId(),
          type: 'product',
          itemId: product.id,
          name: product.name,
          quantity: productQuantity,
          unitPrice: product.unitPrice,
        },
      ],
    }));
    setSelectedProductId('');
    setProductQuantity(1);
  };

  const handleAddKit = () => {
    const kit = kits.find(k => k.id === selectedKitId);
    if (!kit) return;
    
    setFormData(prev => ({
      ...prev,
      pendingLines: [
        ...prev.pendingLines,
        {
          tempId: generateTempId(),
          type: 'kit',
          itemId: kit.id,
          name: kit.name,
          quantity: kitQuantity,
          unitPrice: kit.price,
        },
      ],
    }));
    setSelectedKitId('');
    setKitQuantity(1);
  };

  const handleRemoveLine = (tempId: string) => {
    setFormData(prev => ({
      ...prev,
      pendingLines: prev.pendingLines.filter(l => l.tempId !== tempId),
    }));
  };

  const handleUpdateLineQuantity = (tempId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setFormData(prev => ({
      ...prev,
      pendingLines: prev.pendingLines.map(l =>
        l.tempId === tempId ? { ...l, quantity: newQuantity } : l
      ),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="opportunity-form">
      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="clientId">Client *</label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.organization ? `(${client.organization})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label htmlFor="title">Titre de l'opportunité *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Ex: Renouvellement contrat annuel"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactName">Contact principal *</label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            required
            placeholder="Nom du contact"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactEmail">Email du contact</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="email@exemple.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactPhone">Téléphone du contact</label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="+33 6 00 00 00 00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="source">Source *</label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            required
          >
            {SOURCES.map(source => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        {/* MONTANT Section */}
        <div className="form-section full-width">
          <h3 className="section-title">Montant</h3>
          <div className="section-content">
            <label htmlFor="amount">Montant à saisir (€)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  amount: val === '' ? 0 : parseFloat(val),
                }));
              }}
              min="0"
              step="0.01"
              placeholder="0"
            />
          </div>
        </div>

        {/* KITS Section */}
        <div className="form-section full-width">
          <h3 className="section-title">Kits</h3>
          <div className="section-content">
            <div className="section-row">
              <div className="section-field">
                <label htmlFor="kit">Liste</label>
                <select
                  id="kit"
                  value={selectedKitId}
                  onChange={(e) => setSelectedKitId(e.target.value)}
                >
                  <option value="">Sélectionner un kit...</option>
                  {kits.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} - {formatCurrency(k.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="section-field qty-field">
                <label htmlFor="kitQty">Quantité</label>
                <input
                  type="number"
                  id="kitQty"
                  min="1"
                  value={kitQuantity}
                  onChange={(e) => setKitQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <button
                type="button"
                className="btn-add"
                onClick={handleAddKit}
                disabled={!selectedKitId}
              >
                <Plus size={16} />
              </button>
            </div>
            {formData.pendingLines.filter(l => l.type === 'kit').map((line) => (
              <div key={line.tempId} className="item-line">
                <span className="item-name">{line.name}</span>
                <div className="item-controls">
                  <button type="button" onClick={() => handleUpdateLineQuantity(line.tempId, line.quantity - 1)} disabled={line.quantity <= 1}>-</button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => handleUpdateLineQuantity(line.tempId, line.quantity + 1)}>+</button>
                  <span className="item-total">{formatCurrency(line.quantity * line.unitPrice)}</span>
                  <button type="button" className="btn-del" onClick={() => handleRemoveLine(line.tempId)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUITS Section */}
        <div className="form-section full-width">
          <h3 className="section-title">Produits</h3>
          <div className="section-content">
            <div className="section-row">
              <div className="section-field">
                <label htmlFor="product">Liste</label>
                <select
                  id="product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Sélectionner un produit...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.unitPrice)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="section-field qty-field">
                <label htmlFor="productQty">Quantité</label>
                <input
                  type="number"
                  id="productQty"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <button
                type="button"
                className="btn-add"
                onClick={handleAddProduct}
                disabled={!selectedProductId}
              >
                <Plus size={16} />
              </button>
            </div>
            {formData.pendingLines.filter(l => l.type === 'product').map((line) => (
              <div key={line.tempId} className="item-line">
                <span className="item-name">{line.name}</span>
                <div className="item-controls">
                  <button type="button" onClick={() => handleUpdateLineQuantity(line.tempId, line.quantity - 1)} disabled={line.quantity <= 1}>-</button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => handleUpdateLineQuantity(line.tempId, line.quantity + 1)}>+</button>
                  <span className="item-total">{formatCurrency(line.quantity * line.unitPrice)}</span>
                  <button type="button" className="btn-del" onClick={() => handleRemoveLine(line.tempId)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expectedCloseDate">Date de clôture prévue *</label>
          <input
            type="date"
            id="expectedCloseDate"
            name="expectedCloseDate"
            value={formData.expectedCloseDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Notes ou commentaires..."
          />
        </div>

      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <style>{`
        .opportunity-form {
          padding: 1.5rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-weight: 500;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 1rem;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .field-hint {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .form-section {
          grid-column: 1 / -1;
          margin-top: 0.5rem;
        }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .section-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .section-content label {
          font-weight: 500;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .section-content input,
        .section-content select {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 1rem;
        }
        .section-row {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          flex-wrap: nowrap;
        }
        .section-field {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        .section-field select {
          width: 100%;
        }
        .section-field.qty-field {
          flex: 0 0 70px;
          min-width: 70px;
        }
        .section-field.qty-field input {
          text-align: center;
        }
        .btn-add {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          margin-bottom: 1px;
        }
        .btn-add:hover:not(:disabled) { background: var(--primary-dark); }
        .btn-add:disabled { opacity: 0.4; cursor: not-allowed; }
        .item-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        .item-name {
          flex: 1;
          font-weight: 500;
        }
        .item-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .item-controls button {
          width: 24px;
          height: 24px;
          border: 1px solid var(--border);
          background: white;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .item-controls button:hover:not(:disabled) { background: #f3f4f6; }
        .item-controls button:disabled { opacity: 0.4; }
        .item-controls .btn-del {
          background: none;
          border: none;
          color: #ef4444;
        }
        .item-controls .btn-del:hover { color: #dc2626; }
        .item-total {
          min-width: 70px;
          text-align: right;
          font-weight: 600;
          color: #059669;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--primary-dark);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: white;
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .btn-secondary:hover {
          background: var(--bg-secondary);
        }
      `}</style>
    </form>
  );
}
