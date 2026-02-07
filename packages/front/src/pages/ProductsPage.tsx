import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRecoilValue } from 'recoil';
import { Package, Plus, Edit2, Trash2, Box, Layers } from 'lucide-react';
import { authState } from '../state/auth';
import {
  PRODUCTS_QUERY,
  PRODUCT_KITS_QUERY,
  CREATE_PRODUCT_MUTATION,
  UPDATE_PRODUCT_MUTATION,
  DELETE_PRODUCT_MUTATION,
  CREATE_PRODUCT_KIT_MUTATION,
  UPDATE_PRODUCT_KIT_MUTATION,
  DELETE_PRODUCT_KIT_MUTATION,
} from '../graphql/products';
import { FILIERES_QUERY } from '../graphql/clients';
import './ProductsPage.css';

interface Filiere {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  unitPrice: number;
  isActive: boolean;
  filiereId?: string;
  filiere?: Filiere;
}

interface ProductKitItem {
  id: string;
  quantity: number;
  product: Product;
}

interface ProductKit {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  items: ProductKitItem[];
}

type TabType = 'products' | 'kits';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | ProductKit | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const auth = useRecoilValue(authState);
  const isAdmin = auth.user?.role === 'ADMIN';

  const { data: productsData, loading: loadingProducts, refetch: refetchProducts } = useQuery(PRODUCTS_QUERY, {
    variables: { includeInactive },
  });

  const { data: kitsData, loading: loadingKits, refetch: refetchKits } = useQuery(PRODUCT_KITS_QUERY, {
    variables: { includeInactive },
  });

  const { data: filieresData } = useQuery(FILIERES_QUERY);
  const filieres: Filiere[] = filieresData?.filieres || [];

  const [createProduct] = useMutation(CREATE_PRODUCT_MUTATION);
  const [updateProduct] = useMutation(UPDATE_PRODUCT_MUTATION);
  const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION);
  const [createKit] = useMutation(CREATE_PRODUCT_KIT_MUTATION);
  const [updateKit] = useMutation(UPDATE_PRODUCT_KIT_MUTATION);
  const [deleteKit] = useMutation(DELETE_PRODUCT_KIT_MUTATION);

  const products: Product[] = productsData?.products || [];
  const kits: ProductKit[] = kitsData?.productKits || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleCreateProduct = async (data: any) => {
    try {
      await createProduct({ variables: { input: data } });
      setShowForm(false);
      refetchProducts();
    } catch (error: any) {
      alert(`Erreur: ${error?.message}`);
    }
  };

  const handleUpdateProduct = async (id: string, data: any) => {
    try {
      await updateProduct({ variables: { id, input: data } });
      setEditingItem(null);
      refetchProducts();
    } catch (error: any) {
      alert(`Erreur: ${error?.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await deleteProduct({ variables: { id } });
      refetchProducts();
    } catch (error: any) {
      alert(`Erreur: ${error?.message}`);
    }
  };

  const handleCreateKit = async (data: any) => {
    try {
      await createKit({ variables: { input: data } });
      setShowForm(false);
      refetchKits();
    } catch (error: any) {
      alert(`Erreur: ${error?.message}`);
    }
  };

  const handleUpdateKit = async (id: string, data: any) => {
    try {
      await updateKit({ variables: { id, input: data } });
      setEditingItem(null);
      refetchKits();
    } catch (error: any) {
      alert(`Erreur: ${error?.message}`);
    }
  };

  const handleDeleteKit = async (id: string) => {
    if (!window.confirm('Supprimer ce kit ?')) return;
    try {
      await deleteKit({ variables: { id } });
      refetchKits();
    } catch (error: any) {
      alert(`Erreur: ${error?.message}`);
    }
  };

  const loading = loadingProducts || loadingKits;

  if (loading) {
    return <div className="loading">Chargement du catalogue...</div>;
  }

  return (
    <div className="products-page">
      <header className="page-header">
        <div>
          <h1><Package size={28} /> Catalogue Produits</h1>
          <p>{products.length} produits, {kits.length} kits</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            {activeTab === 'products' ? 'Nouveau produit' : 'Nouveau kit'}
          </button>
        )}
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Box size={18} />
          Produits ({products.length})
        </button>
        <button
          className={`tab ${activeTab === 'kits' ? 'active' : ''}`}
          onClick={() => setActiveTab('kits')}
        >
          <Layers size={18} />
          Kits ({kits.length})
        </button>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Afficher inactifs
        </label>
      </div>

      {activeTab === 'products' && (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className={`product-card ${!product.isActive ? 'inactive' : ''}`}>
              <div className="product-header">
                <span className="product-code">{product.code}</span>
                {product.filiere && (
                  <span className="product-filiere">{product.filiere.name}</span>
                )}
              </div>
              <h3>{product.name}</h3>
              {product.description && <p className="product-description">{product.description}</p>}
              <div className="product-price">{formatCurrency(product.unitPrice)}</div>
              {!product.isActive && <span className="badge-inactive">Inactif</span>}
              {isAdmin && (
                <div className="product-actions">
                  <button onClick={() => setEditingItem(product)} title="Modifier">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'kits' && (
        <div className="kits-grid">
          {kits.map((kit) => (
            <div key={kit.id} className={`kit-card ${!kit.isActive ? 'inactive' : ''}`}>
              <div className="kit-header">
                <span className="kit-code">{kit.code}</span>
              </div>
              <h3>{kit.name}</h3>
              {kit.description && <p className="kit-description">{kit.description}</p>}
              <div className="kit-items">
                <strong>Contenu :</strong>
                <ul>
                  {kit.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.product.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="kit-price">{formatCurrency(kit.price)}</div>
              {!kit.isActive && <span className="badge-inactive">Inactif</span>}
              {isAdmin && (
                <div className="kit-actions">
                  <button onClick={() => setEditingItem(kit)} title="Modifier">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteKit(kit.id)} title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && activeTab === 'products' && (
        <ProductFormModal
          filieres={filieres}
          onSubmit={handleCreateProduct}
          onClose={() => setShowForm(false)}
        />
      )}

      {showForm && activeTab === 'kits' && (
        <KitFormModal
          products={products}
          onSubmit={handleCreateKit}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingItem && 'unitPrice' in editingItem && (
        <ProductFormModal
          filieres={filieres}
          product={editingItem as Product}
          onSubmit={(data) => handleUpdateProduct(editingItem.id, data)}
          onClose={() => setEditingItem(null)}
        />
      )}

      {editingItem && 'items' in editingItem && (
        <KitFormModal
          products={products}
          kit={editingItem as ProductKit}
          onSubmit={(data) => handleUpdateKit(editingItem.id, data)}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

// Product Form Modal
function ProductFormModal({
  filieres,
  product,
  onSubmit,
  onClose,
}: {
  filieres: Filiere[];
  product?: Product;
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    code: product?.code || '',
    name: product?.name || '',
    description: product?.description || '',
    unitPrice: product?.unitPrice || 0,
    filiereId: product?.filiereId || '',
    isActive: product?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      code: formData.code,
      name: formData.name,
      unitPrice: parseFloat(String(formData.unitPrice)),
    };
    if (formData.description) data.description = formData.description;
    if (formData.filiereId) data.filiereId = formData.filiereId;
    if (product) data.isActive = formData.isActive;
    onSubmit(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Filière</label>
              <select
                value={formData.filiereId}
                onChange={(e) => setFormData({ ...formData, filiereId: e.target.value })}
              >
                <option value="">-- Aucune --</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Prix unitaire (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            {product && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Actif
                </label>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Kit Form Modal
function KitFormModal({
  products,
  kit,
  onSubmit,
  onClose,
}: {
  products: Product[];
  kit?: ProductKit;
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    code: kit?.code || '',
    name: kit?.name || '',
    description: kit?.description || '',
    price: kit?.price || 0,
    isActive: kit?.isActive ?? true,
    items: kit?.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })) || [{ productId: '', quantity: 1 }],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formData.items.filter((i) => i.productId);
    const data: any = {
      code: formData.code,
      name: formData.name,
      price: parseFloat(String(formData.price)),
      items: validItems,
    };
    if (formData.description) data.description = formData.description;
    if (kit) data.isActive = formData.isActive;
    onSubmit(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <h2>{kit ? 'Modifier le kit' : 'Nouveau kit'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Prix du kit (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Produits du kit</label>
            <div className="kit-items-form">
              {formData.items.map((item, index) => (
                <div key={index} className="kit-item-row">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    {products.filter((p) => p.isActive).map((p) => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    style={{ width: '80px' }}
                  />
                  <button type="button" onClick={() => removeItem(index)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={addItem}>
                <Plus size={16} /> Ajouter un produit
              </button>
            </div>
          </div>
          {kit && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Actif
              </label>
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
