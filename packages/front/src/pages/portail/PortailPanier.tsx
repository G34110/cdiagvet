import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { cartState } from '../../state/cart';
import { authState } from '../../state/auth';
import { CREATE_ORDER_MUTATION, ADD_ORDER_LINE_MUTATION } from '../../graphql/orders';
import './PortailPanier.css';

export default function PortailPanier() {
  const navigate = useNavigate();
  const [cart, setCart] = useRecoilState(cartState);
  const auth = useRecoilValue(authState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createOrder] = useMutation(CREATE_ORDER_MUTATION);
  const [addOrderLine] = useMutation(ADD_ORDER_LINE_MUTATION);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const updateQuantity = (id: string, type: 'product' | 'kit', delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.type === type) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string, type: 'product' | 'kit') => {
    setCart(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalHT = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    if (!auth.user?.clientId) {
      setError('Votre compte n\'est pas associé à un client. Veuillez vous reconnecter.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await createOrder({
        variables: {
          input: {
            clientId: auth.user.clientId,
            notes: 'Commande passée via le Portail Distributeur',
          },
        },
      });

      const orderId = data?.createOrder?.id;

      if (orderId) {
        for (const item of cart) {
          await addOrderLine({
            variables: {
              orderId,
              line: {
                productId: item.type === 'product' ? item.id : null,
                kitId: item.type === 'kit' ? item.id : null,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              },
            },
          });
        }

        setOrderSuccess(data.createOrder.reference);
        clearCart();
      }
    } catch (err: any) {
      console.error('Erreur création commande:', err);
      setError(err?.message || 'Erreur lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="portail-panier">
        <div className="order-success">
          <CheckCircle size={64} />
          <h2>Commande envoyée !</h2>
          <p>Votre commande <strong>{orderSuccess}</strong> a été créée avec succès.</p>
          <p>Vous recevrez un email de confirmation sous peu.</p>
          <div className="success-actions">
            <button className="btn-secondary" onClick={() => navigate('/portail/commandes')}>
              Voir mes commandes
            </button>
            <button className="btn-primary" onClick={() => navigate('/portail/catalogue')}>
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portail-panier">
      <header className="panier-header">
        <h1><ShoppingCart size={28} /> Mon panier</h1>
        {cart.length > 0 && (
          <button className="btn-clear" onClick={clearCart}>
            <Trash2 size={16} />
            Vider le panier
          </button>
        )}
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="empty-cart">
          <Package size={64} />
          <h3>Votre panier est vide</h3>
          <p>Parcourez notre catalogue pour ajouter des produits</p>
          <button className="btn-primary" onClick={() => navigate('/portail/catalogue')}>
            Voir le catalogue
          </button>
        </div>
      ) : (
        <div className="panier-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={`${item.type}-${item.id}`} className="cart-item">
                <div className="item-image">
                  <Package size={32} />
                  {item.type === 'kit' && <span className="kit-badge">Kit</span>}
                </div>
                <div className="item-info">
                  <span className="item-code">{item.code}</span>
                  <h4 className="item-name">{item.name}</h4>
                  <span className="item-price">{formatCurrency(item.unitPrice)} / unité</span>
                </div>
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item.id, item.type, -1)}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.type, 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <div className="item-total">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </div>
                <button className="btn-remove" onClick={() => removeItem(item.id, item.type)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Récapitulatif</h3>
            <div className="summary-row">
              <span>Sous-total HT</span>
              <span>{formatCurrency(totalHT)}</span>
            </div>
            <div className="summary-row">
              <span>TVA (20%)</span>
              <span>{formatCurrency(tva)}</span>
            </div>
            <div className="summary-row total">
              <span>Total TTC</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
          </div>

          <div className="cart-validation">
            <button
              className="btn-order"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Valider ma commande'}
            </button>
            <p className="order-note">
              Votre commande sera traitée par notre équipe commerciale.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
