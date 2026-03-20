import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, MoreVertical, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

import './MyChallans.css';

const MyChallans = () => {
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('unpaid'); // default to unpaid
    const navigate = useNavigate();

    useEffect(() => {
        fetchChallans();
    }, []);

    const fetchChallans = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/user/challans');
            setChallans(response.data);
        } catch (err) {
            console.error("Failed to fetch challans", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredChallans = challans.filter(c => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unpaid') return c.status === 'UNPAID';
        if (activeTab === 'paid') return c.status === 'PAID';
        return true;
    });

    return (
        <div className="my-challans-container">
            <header className="page-header">
                <h1 className="page-title">My Challans</h1>
                <p className="page-subtitle">Track and manage your traffic violations</p>
                
                <div className="status-tabs">
                    {[
                        { id: 'unpaid', label: 'Unpaid', count: challans.filter(c => c.status === 'UNPAID').length },
                        { id: 'paid', label: 'Paid', count: challans.filter(c => c.status === 'PAID').length },
                        { id: 'all', label: 'All', count: challans.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label} <span className="tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : challans.length === 0 ? (
                <div className="empty-state-container">
                    <h3 className="empty-title">No Challans Found</h3>
                    <p className="empty-subtitle">You don't have any recorded traffic violations. Drive safe!</p>
                </div>
            ) : (
                <div className="challans-grid">
                    {filteredChallans.map((challan) => (
                        <motion.div
                            key={challan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="challan-card"
                            onClick={() => navigate(`/user/challan/${challan.id}`)}
                        >
                            {/* Half-width Banner Image */}
                            <div className="card-image-wrapper">
                                <img
                                    src={challan.image ? `http://localhost:5000/${challan.image}` : 'https://via.placeholder.com/400x200'}
                                    alt="Violation"
                                    className="card-image"
                                />
                                <div className="card-image-overlay">
                                    <span className={`status-badge ${challan.status}`}>
                                        {challan.status}
                                    </span>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="card-top-row">
                                    <div className="type-group">
                                        <h3 className="violation-type-text">{challan.type}</h3>
                                        <p className="plate-id font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                            {challan.vehicle_number}
                                        </p>
                                    </div>
                                    <div className="action-menu-wrapper" onClick={(e) => {
                                        e.stopPropagation();
                                    }}>
                                        <div className="dropdown">
                                            <button className="menu-icon-btn group">
                                                <MoreVertical className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                                            </button>
                                            <div className="dropdown-content">
                                                <button 
                                                    onClick={() => navigate(`/user/challan/${challan.id}/report`)}
                                                    className="dropdown-item"
                                                >
                                                    Report Challan
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-details-group">
                                    <div className="detail-item">
                                        <MapPin className="detail-icon blue" />
                                        <span className="detail-text">{challan.location}</span>
                                    </div>
                                    <div className="detail-item">
                                        <Calendar className="detail-icon orange" /> {challan.timestamp}
                                    </div>
                                </div>

                                {challan.plate_crop && (
                                    <div className="plate-preview-box">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cropped Plate</p>
                                        <img 
                                            src={`http://localhost:5000/${challan.plate_crop}`} 
                                            alt="Plate Crop" 
                                            className="h-8 rounded border border-slate-100 object-contain bg-slate-50"
                                        />
                                    </div>
                                )}

                                <div className="card-footer">
                                    <div>
                                        <p className="fine-label">Fine Amount</p>
                                        <p className="fine-value">₹{challan.amount}</p>
                                    </div>
                                    {challan.report_status && (
                                        <div className="report-status-pill">
                                            {challan.report_status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyChallans;

