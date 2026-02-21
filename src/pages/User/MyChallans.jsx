import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, MoreVertical, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

import './MyChallans.css';

const MyChallans = () => {
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch challans...
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

    return (
        <div className="my-challans-container">
            <header className="page-header">
                {/* Note: In dark mode layout, text-slate-900 might be invisible if background is slate-900. 
                    However, the component used 'text-slate-900' in the original code. 
                    If the layout background is dark, this text would be hard to read unless the container has a light background.
                    The original code had `className="p-6 max-w-7xl mx-auto space-y-8"`.
                    It didn't set a background. 
                    If DashboardLayout sets `bg-slate-900`, then `text-slate-900` on top of it is bad.
                    BUT I must preserve existing behavior.
                    Maybe the user intends this to be a light page?
                    Or maybe I missed where background is set. 
                    Regardless, I will map class names 1:1.
                */}
                <h1 className="page-title">My Challans</h1>
                <p className="page-subtitle">View and manage your traffic violations</p>
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
                    {challans.map((challan) => (
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
                                    <h3 className="violation-type-text">{challan.type}</h3>
                                    <div className="action-menu-wrapper" onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/user/challan/${challan.id}/report`);
                                    }}>
                                        <button className="menu-icon-btn">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
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

                                <div className="card-footer">
                                    <div>
                                        <p className="fine-label">Fine Amount</p>
                                        <p className="fine-value">₹{challan.amount}</p>
                                    </div>
                                    {challan.report_status && (
                                        <div className="report-status-pill">
                                            Report: {challan.report_status}
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

