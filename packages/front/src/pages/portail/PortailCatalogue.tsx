import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRecoilState } from 'recoil';
import { Search, Package, Filter, AlertCircle, X, ShoppingCart } from 'lucide-react';
import { PRODUCTS_QUERY, PRODUCT_KITS_QUERY } from '../../graphql/products';
import { cartState } from '../../state/cart';
import './PortailCatalogue.css';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unitPrice: number;
  isActive: boolean;
  filiere: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface ProductKit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      code: string;
      name: string;
      unitPrice: number;
    };
  }>;
}

export default function PortailCatalogue() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showKits, setShowKits] = useState(false);
  const [, setCart] = useRecoilState(cartState);

  const { data: productsData, loading: loadingProducts } = useQuery<{ products: Product[] }>(
    PRODUCTS_QUERY,
    { variables: { includeInactive: false } }
  );

  const { data: kitsData, loading: loadingKits } = useQuery<{ productKits: ProductKit[] }>(
    PRODUCT_KITS_QUERY,
    { variables: { includeInactive: false } }
  );

  const products = productsData?.products || [];
  const kits = kitsData?.productKits || [];

  const categories = Array.from(new Set(products.map(p => p.filiere?.name).filter(Boolean)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.filiere?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredKits = kits.filter(kit => {
    const matchesSearch = kit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          kit.code.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter kits by category: a kit matches if at least one of its products belongs to the selected category
    const matchesCategory = categoryFilter === 'all' || 
      kit.items.some(item => {
        const product = products.find(p => p.id === item.product.id);
        return product?.filiere?.name === categoryFilter;
      });
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const addToCart = (item: Product | ProductKit, type: 'product' | 'kit') => {
    const price = type === 'product' ? (item as Product).unitPrice : (item as ProductKit).price;
    
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && c.type === type);
      if (existing) {
        return prev.map(c => 
          c.id === item.id && c.type === type 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, {
        id: item.id,
        type,
        code: item.code,
        name: item.name,
        unitPrice: price,
        quantity: 1,
      }];
    });
  };

  if (loadingProducts || loadingKits) {
    return <div className="loading">Chargement du catalogue...</div>;
  }

  return (
    <div className="portail-catalogue">
      <header className="catalogue-header">
        <div>
          <h1><Package size={28} /> Catalogue produits</h1>
          <p>{products.length} produits • {kits.length} kits disponibles</p>
        </div>
      </header>

      <div className="catalogue-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="view-toggle">
          <button 
            className={!showKits ? 'active' : ''} 
            onClick={() => setShowKits(false)}
          >
            Produits
          </button>
          <button 
            className={showKits ? 'active' : ''} 
            onClick={() => setShowKits(true)}
          >
            Kits
          </button>
        </div>

        {(searchTerm || categoryFilter !== 'all') && (
          <button 
            className="btn-reset-filters"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
            }}
          >
            <X size={16} />
            Réinitialiser
          </button>
        )}
      </div>

      {!showKits ? (
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>Aucun produit trouvé</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <Package size={48} />
                </div>
                <div className="product-info">
                  <span className="product-code">{product.code}</span>
                  <h3 className="product-name">{product.name}</h3>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  {product.filiere && (
                    <span className="product-category">{product.filiere.name}</span>
                  )}
                </div>
                <div className="product-footer">
                  <span className="product-price">{formatCurrency(product.unitPrice)}</span>
                  <button 
                    className="btn-add-cart"
                    onClick={() => addToCart(product, 'product')}
                  >
                    <ShoppingCart size={16} />
                    Ajouter
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredKits.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>Aucun kit trouvé</p>
            </div>
          ) : (
            filteredKits.map(kit => (
              <div key={kit.id} className="product-card kit-card">
                <div className="product-image kit-image">
                  <Package size={48} />
                  <span className="kit-badge">Kit</span>
                </div>
                <div className="product-info">
                  <span className="product-code">{kit.code}</span>
                  <h3 className="product-name">{kit.name}</h3>
                  {kit.description && (
                    <p className="product-description">{kit.description}</p>
                  )}
                  <div className="kit-contents">
                    <span>{kit.items.length} produit{kit.items.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="product-footer">
                  <span className="product-price">{formatCurrency(kit.price)}</span>
                  <button 
                    className="btn-add-cart"
                    onClick={() => addToCart(kit, 'kit')}
                  >
                    <ShoppingCart size={16} />
                    Ajouter
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
