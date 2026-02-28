import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';

export default function MarketplacePage({ user }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMarketplace = async () => {
        try {
            const res = await API.get('/marketplace');
            setItems(res.data);
        } catch (err) {
            console.error("Failed to fetch marketplace", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketplace();
    }, []);

    const handleRequest = async (item) => {
        const qty = prompt(`How many units of ${item.item_name} do you need? (Max ${item.quantity})`, "1");
        if (!qty) return;

        if (parseInt(qty) > item.quantity) {
            alert("Requested quantity exceeds available stock.");
            return;
        }

        try {
            await API.post('/requests', {
                item_name: item.item_name,
                quantity: parseInt(qty),
                receiver_id: item.user_id
            });
            alert("Request sent successfully to " + item.shop_name);
        } catch (err) {
            alert("Failed to send request: " + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="loading">Loading marketplace...</div>;

    return (
        <div className="marketplace">
            <div className="card-header">
                <h3>🛒 Community Marketplace</h3>
                <button className="btn-secondary" onClick={fetchMarketplace}>Refresh</button>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <p>No public items available in the marketplace yet.</p>
                </div>
            ) : (
                <div className="marketplace-grid">
                    {items.map(item => (
                        <div key={item.id} className={`card marketplace-item ${item.is_verified ? 'verified' : ''}`}>
                            <div className="item-image-wrapper">
                                {item.item_image ? (
                                    <img src={`http://localhost:5000${item.item_image}`} alt={item.item_name} className="market-img" />
                                ) : (
                                    <div className="img-placeholder">No Image</div>
                                )}
                            </div>
                            <div className="item-details">
                                <h4>{item.item_name}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <p className="shop-info" style={{ margin: 0 }}>Store: <strong>{item.shop_name || item.owner_name}</strong></p>
                                    {item.is_verified && (
                                        <div className="badge-verified" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                                            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                            Verified
                                        </div>
                                    )}
                                </div>
                                <div className="trade-score-pill" style={{ marginBottom: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>
                                    <b>{item.trade_count || 0}</b> Successful Trades
                                </div>
                                <div className="stock-info">
                                    <span className="qty" style={{ fontSize: '0.9rem', color: '#64748b' }}>Stock: {item.quantity}</span>
                                    <button className="btn-primary btn-sm" onClick={() => handleRequest(item)}>Request</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
