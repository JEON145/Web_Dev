import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';

export default function RequestsManager({ user }) {
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [activeTab, setActiveTab] = useState('incoming');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [incRes, outRes] = await Promise.all([
                API.get('/requests/incoming'),
                API.get('/requests/outgoing')
            ]);
            setIncoming(incRes.data);
            setOutgoing(outRes.data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = async (requestId, newStatus) => {
        try {
            await API.patch(`/requests/${requestId}/status`, { status: newStatus });
            alert(`Request marked as ${newStatus}`);
            fetchData();
        } catch (err) {
            alert("Status update failed: " + (err.response?.data?.error || err.message));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="badge warning">Pending</span>;
            case 'accepted': return <span className="badge success">Accepted</span>;
            case 'declined': return <span className="badge danger">Declined</span>;
            case 'shipped': return <span className="badge info">Shipped</span>;
            case 'received': return <span className="badge primary">Received</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    if (loading) return <div className="loading">Loading requests...</div>;

    return (
        <div className="requests-manager">
            <div className="card-header">
                <h3>📊 Request Management</h3>
                <div className="tab-controls">
                    <button
                        className={`btn-tab ${activeTab === 'incoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('incoming')}
                    >
                        Incoming ({incoming.length})
                    </button>
                    <button
                        className={`btn-tab ${activeTab === 'outgoing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('outgoing')}
                    >
                        Outgoing ({outgoing.length})
                    </button>
                </div>
            </div>

            <div className="request-list">
                {activeTab === 'incoming' ? (
                    incoming.length === 0 ? (
                        <p className="empty-state">No incoming requests.</p>
                    ) : (
                        incoming.map(req => (
                            <div key={req.id} className="card request-item">
                                <div className="request-body">
                                    <p><strong>{req.sender_shop || req.sender_name}</strong> wants <strong>{req.quantity}</strong> units of <strong>{req.item_name}</strong>.</p>
                                    <p className="request-date">Received: {new Date(req.created_at).toLocaleString()}</p>
                                </div>
                                <div className="request-actions">
                                    <button className="btn-success btn-sm" onClick={() => updateStatus(req.id, 'accepted')}>Accept</button>
                                    <button className="btn-danger btn-sm" onClick={() => updateStatus(req.id, 'declined')}>Decline</button>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    outgoing.length === 0 ? (
                        <p className="empty-state">No outgoing requests.</p>
                    ) : (
                        outgoing.map(req => (
                            <div key={req.id} className="card request-item">
                                <div className="request-body">
                                    <p>Requested <strong>{req.quantity}</strong> units of <strong>{req.item_name}</strong> from <strong>{req.receiver_shop || req.receiver_name || 'Community'}</strong>.</p>
                                    <div className="status-flow">
                                        {getStatusBadge(req.status)}
                                        <p className="request-date">Sent: {new Date(req.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="request-actions">
                                    {req.status === 'shipped' && (
                                        <button className="btn-primary btn-sm" onClick={() => updateStatus(req.id, 'received')}>Mark Received</button>
                                    )}
                                    {req.status === 'accepted' && req.receiver_id === user.id && (
                                        <button className="btn-info btn-sm" onClick={() => updateStatus(req.id, 'shipped')}>Mark Shipped</button>
                                    )}
                                    {/* Note: In a real app, 'Shipped' would be done by the receiver/provider. 
                      Here we add it for ease of testing or if the user is the provider. */}
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* Special Case: Receiver marking as shipped */}
            {activeTab === 'incoming' && incoming.some(r => r.status === 'accepted') && (
                <div className="accepted-tasks">
                    <h4>Accepted Tasks (Pending Shipment)</h4>
                    {/* We would filter for accepted status here if needed */}
                </div>
            )}
        </div>
    );
}
