'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { track } from '@vercel/analytics';

interface CartDrawerProps {
  lang: string;
  dict: any;
}

export default function CartDrawer({ lang, dict }: CartDrawerProps) {
  const {
    items,
    updateCartons,
    removeFromCart,
    clearCart,
    totalCartons,
    isCartOpen,
    closeCart,
  } = useCart();

  const isArabic = lang === 'ar';
  const cartDict = dict?.cart || {};

  // Form states
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    whatsappUrl: string | null;
  } | null>(null);

  if (!isCartOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      alert(isArabic ? 'يرجى إدخال رقم الهاتف' : 'Veuillez saisir votre numéro de téléphone');
      return;
    }

    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim() || undefined,
          customerCity: customerCity.trim() || undefined,
          notes: notes.trim() || undefined,
          items,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Failed to place order');
      }

      const data = await res.json();
      setOrderSuccess({
        orderNumber: data.order.orderNumber,
        whatsappUrl: data.whatsappUrl,
      });

      // Clear the cart
      clearCart();

      try {
        track('order_placed', {
          orderNumber: data.order.orderNumber,
          totalCartons,
          itemCount: items.length,
          lang,
        });
      } catch {}
    } catch (err: any) {
      console.error('Order submission error:', err);
      alert(err?.message || (isArabic ? 'حدث خطأ أثناء إرسال الطلبية' : 'Échec de la commande'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    closeCart();
    setOrderSuccess(null);
  };

  return (
    <div
      className="cart-overlay"
      onClick={handleCloseAndReset}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: isArabic ? 'flex-start' : 'flex-end',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.25)',
          animation: isArabic ? 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          direction: isArabic ? 'rtl' : 'ltr',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📦</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {cartDict.title || 'Panier de Commande'}
              </h2>
              {items.length > 0 && !orderSuccess && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {totalCartons} {cartDict.cartons || 'Cartons'} ({items.length} {isArabic ? 'موديلات' : 'modèles'})
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseAndReset}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {orderSuccess ? (
            /* Order Success State */
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                }}
              >
                ✓
              </div>

              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                {cartDict.orderSuccessTitle || 'Commande Enregistrée !'}
              </h3>

              <div
                style={{
                  background: 'var(--bg-color)',
                  border: '1px dashed var(--primary)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {cartDict.orderNumber || 'N° de Commande'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  {orderSuccess.orderNumber}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {cartDict.orderSuccessSub || 'Votre commande a été transmise à notre équipe.'}
              </p>

              {orderSuccess.whatsappUrl && (
                <a
                  href={orderSuccess.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    width: '100%',
                    background: '#25D366',
                    color: 'white',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    marginTop: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>chat</span>
                  <span>{cartDict.sendOnWhatsapp || 'Envoyer sur WhatsApp 💬'}</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleCloseAndReset}
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {cartDict.continueShopping || 'Continuer la sélection'}
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '3.5rem', opacity: 0.5 }}>🛒</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {cartDict.empty || 'Votre panier est vide'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {cartDict.emptySub || 'Ajoutez des modèles de chaussures avec le nombre de cartons souhaité.'}
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="btn"
                style={{ marginTop: '0.5rem' }}
              >
                {isArabic ? 'تصفح الكتالوج' : 'Explorer les collections'}
              </button>
            </div>
          ) : (
            /* Cart Items List */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {isArabic ? 'المنتجات المختارة' : 'Articles Sélectionnés'} ({items.length})
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {cartDict.clearCart || 'Vider le panier'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {items.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem',
                      background: 'var(--bg-color)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.reference}
                        style={{
                          width: '56px',
                          height: '56px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#f1f5f9',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                        }}
                      >
                        👟
                      </div>
                    )}

                    {/* Details & Reference */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {item.reference}
                      </div>
                      {item.familyName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.familyName}
                        </div>
                      )}

                      {/* Carton stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => updateCartons(item.productId, item.cartons - 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>
                          {item.cartons} {cartDict.carton || 'Carton(s)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartons(item.productId, item.cartons + 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        fontSize: '1rem',
                      }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* In-Drawer Checkout Form */}
              <form
                onSubmit={handleSubmitOrder}
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.25rem',
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-color)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📝</span>
                    <span>{cartDict.checkout || 'Passer la Commande'}</span>
                  </h3>

                  {/* Phone Number Input */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '6px' }}>
                      <span>📞</span>
                      <span>{cartDict.phone || 'Numéro de Téléphone *'}</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={cartDict.phonePlaceholder || 'Ex: 06 12 34 56 78'}
                      className="form-control"
                      style={{
                        fontSize: '0.95rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)',
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  {/* Customer Name / Boutique */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                      <span>🏪</span>
                      <span>{cartDict.name || 'Nom / Boutique (Optionnel)'}</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={cartDict.namePlaceholder || 'Ex: Boutique Élégance'}
                      className="form-control"
                      style={{
                        fontSize: '0.9rem',
                        padding: '0.7rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)',
                      }}
                    />
                  </div>

                  {/* City */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                      <span>📍</span>
                      <span>{cartDict.city || 'Ville (Optionnel)'}</span>
                    </label>
                    <input
                      type="text"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder={cartDict.cityPlaceholder || 'Ex: Casablanca, Paris...'}
                      className="form-control"
                      style={{
                        fontSize: '0.9rem',
                        padding: '0.7rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)',
                      }}
                    />
                  </div>

                  {/* Notes */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                      <span>💬</span>
                      <span>{cartDict.notes || 'Remarques (Optionnel)'}</span>
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={cartDict.notesPlaceholder || 'Précisions sur la livraison...'}
                      className="form-control"
                      style={{
                        fontSize: '0.88rem',
                        padding: '0.7rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)',
                        resize: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.5rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)',
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? (
                    <span style={{ color: '#ffffff' }}>⏳ {cartDict.submitting || 'Envoi de la commande...'}</span>
                  ) : (
                    <>
                      <span>📦</span>
                      <span style={{ color: '#ffffff' }}>
                        {cartDict.confirmOrder || 'Confirmer la Commande'} ({totalCartons} {cartDict.cartons || 'Cartons'})
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
