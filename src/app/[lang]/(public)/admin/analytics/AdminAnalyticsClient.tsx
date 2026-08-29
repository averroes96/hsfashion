'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  exportOrdersToCsv,
  exportProductsPerformanceToCsv,
  exportAnalyticsSummaryToCsv,
} from '@/lib/csvExporter';

interface AdminAnalyticsClientProps {
  dict: any;
  lang: string;
}

export default function AdminAnalyticsClient({ dict, lang }: AdminAnalyticsClientProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isArabic = lang === 'ar';
  const t = dict?.analytics || {};

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = data?.summary || {};
  const dailyTrends: Array<{ date: string; orders: number; cartons: number }> = data?.dailyTrends || [];
  const maxCartons = Math.max(1, ...dailyTrends.map((d) => d.cartons));

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Top Header & Export Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, margin: '0 0 0.4rem 0' }}>
            📊 {t.title || 'Statistiques & Insights B2B'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t.subtitle || 'Visibilité complète sur les tendances de consultation, volumes de cartons et demandes clients'}
          </p>
        </div>

        {/* 1-Click Export Actions */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => exportAnalyticsSummaryToCsv(data)}
            disabled={!data}
            className="btn hover-lift"
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              cursor: data ? 'pointer' : 'not-allowed',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
              download
            </span>
            <span>{t.exportReport || 'Rapport Complet (CSV)'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportOrdersToCsv(data?.rawOrders)}
            disabled={!data?.rawOrders?.length}
            className="btn btn-outline hover-lift"
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', color: '#16a34a' }}>
              table_view
            </span>
            <span>{t.exportOrders || 'Commandes CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportProductsPerformanceToCsv(data?.rawProducts)}
            disabled={!data?.rawProducts?.length}
            className="btn btn-outline hover-lift"
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', color: '#0284c7' }}>
              inventory_2
            </span>
            <span>{t.exportProducts || 'Produits CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* 1. Executive Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Cartons */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(99, 102, 241, 0.12) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
              {t.totalCartons || 'Total Cartons'}
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>
              package_2
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
            {isLoading ? '...' : summary.totalCartons || 0}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
            Volume global des commandes
          </p>
        </div>

        {/* Total Orders */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.06) 0%, rgba(34, 197, 94, 0.12) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>
              {t.totalOrders || 'Total Commandes'}
            </span>
            <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '1.5rem' }}>
              shopping_bag
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
            {isLoading ? '...' : summary.totalOrders || 0}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
            {summary.pendingOrders || 0} en attente · {summary.completedOrders || 0} validées
          </p>
        </div>

        {/* Total Catalog Views */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(56, 189, 248, 0.12) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>
              {t.totalViews || 'Vues Totales'}
            </span>
            <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '1.5rem' }}>
              visibility
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
            {isLoading ? '...' : summary.totalViews || 0}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
            Consultations du catalogue en ligne
          </p>
        </div>

        {/* Average Cartons Per Order */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.06) 0%, rgba(245, 158, 11, 0.12) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
              {t.avgCartonsPerOrder || 'Moyenne / Commande'}
            </span>
            <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '1.5rem' }}>
              monitoring
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
            {isLoading ? '...' : summary.avgCartonsPerOrder || 0} <span style={{ fontSize: '1rem', fontWeight: 600 }}>ctn</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
            Panier moyen grossiste
          </p>
        </div>
      </div>

      {/* 2. Order & Carton Volume Trends Chart (Last 30 Days) */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: 'var(--text-main)' }}>
              📈 {t.orderTrends || 'Évolution des Volumes de Commandes & Cartons (30 Derniers Jours)'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Suivi quotidien des cartons et des commandes passées
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary)' }} />
              <span>Cartons</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
              <span>Commandes</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div
          style={{
            height: '180px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '4px',
            paddingTop: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}
        >
          {dailyTrends.map((d, i) => {
            const heightPercent = maxCartons > 0 ? Math.round((d.cartons / maxCartons) * 100) : 0;
            const dayLabel = d.date.split('-').slice(1).join('/');

            return (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  minWidth: '18px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  position: 'relative',
                }}
                title={`${d.date} : ${d.cartons} cartons (${d.orders} commandes)`}
              >
                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(4, heightPercent)}%`,
                    background:
                      d.cartons > 0
                        ? 'linear-gradient(180deg, #4f46e5 0%, #818cf8 100%)'
                        : 'rgba(100, 116, 139, 0.1)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Dates X-Axis Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          <span>{dailyTrends[0]?.date || ''}</span>
          <span>{dailyTrends[Math.floor(dailyTrends.length / 2)]?.date || ''}</span>
          <span>{dailyTrends[dailyTrends.length - 1]?.date || ''}</span>
        </div>
      </div>

      {/* 3. Top 10 Leaderboards (2 Columns: Viewed vs Ordered) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Top 10 Most-Viewed */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '1.35rem' }}>
              local_fire_department
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {t.topViewed || 'Top 10 Modèles les Plus Vus'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chargement...</p>
            ) : (data?.topViewedProducts || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune vue enregistrée</p>
            ) : (
              (data?.topViewedProducts || []).map((prod: any, idx: number) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                const familyDisplay = isArabic && prod.arabicFamilyName ? prod.arabicFamilyName : prod.familyName;

                return (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-color)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, width: '22px', textAlign: 'center' }}>
                        {medal}
                      </span>
                      {prod.thumbnailUrl ? (
                        <img
                          src={prod.thumbnailUrl}
                          alt={prod.reference}
                          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          👟
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/${lang}/product/${encodeURIComponent(prod.reference)}`}
                          target="_blank"
                          style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', textDecoration: 'none' }}
                        >
                          {prod.reference}
                        </Link>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {familyDisplay}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: isArabic ? 'left' : 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                        {prod.views}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        {t.views || 'vues'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top 10 Most-Ordered */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '1.35rem' }}>
              star
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {t.topOrdered || 'Top 10 Modèles les Plus Commandés'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chargement...</p>
            ) : (data?.topOrderedProducts || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune commande enregistrée</p>
            ) : (
              (data?.topOrderedProducts || []).map((prod: any, idx: number) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

                return (
                  <div
                    key={prod.reference}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-color)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, width: '22px', textAlign: 'center' }}>
                        {medal}
                      </span>
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.reference}
                          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          📦
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {prod.reference}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {prod.familyName}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: isArabic ? 'left' : 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#16a34a' }}>
                        {prod.totalCartons} ctn
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        {prod.orderCount} {t.orders || 'commandes'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Category / Family Market Share & Geographic Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Family Market Share */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.35rem' }}>
              category
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {t.familyShare || 'Répartition par Famille'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(data?.familyStats || []).map((f: any) => {
              const displayName = isArabic && f.arabicName ? f.arabicName : f.name;

              return (
                <div key={f.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{displayName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {f.views} {t.views || 'vues'} ({f.viewShare}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '999px',
                      background: 'var(--border-color)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${f.viewShare}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: 'var(--primary)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Demand */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '1.35rem' }}>
              location_on
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {t.cityBreakdown || 'Répartition Géographique'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(data?.cityBreakdown || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune ville enregistrée</p>
            ) : (
              (data?.cityBreakdown || []).map((c: any) => (
                <div
                  key={c.city}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-color)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    📍 {c.city}
                  </span>
                  <div style={{ textAlign: isArabic ? 'left' : 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#d97706' }}>
                      {c.cartons} ctn
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                      ({c.orders} cmd)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
