import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle, User, Car, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

import './Reports.css';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await api.get('/api/admin/reports');
            setReports(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(r => filter === 'all' || r.status === filter);

    return (
        <div className="admin-reports-container">
            <header className="reports-header">
                <div className="title-section">
                    <h1>Reported Challans</h1>
                    <p>Review and resolve user complaints</p>
                </div>

                <div className="filter-group">
                    {[
                        { id: 'all', label: 'All', count: reports.length },
                        { id: 'pending', label: 'Pending', count: reports.filter(r => r.status === 'pending').length },
                        { id: 'accepted', label: 'Accepted', count: reports.filter(r => r.status === 'REPORT ACCEPTED' || r.status === 'accepted').length },
                        { id: 'declined', label: 'Declined', count: reports.filter(r => r.status === 'REPORT REJECTED' || r.status === 'declined' || r.status === 'rejected').length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`filter-btn ${filter === tab.id ? 'active' : ''}`}
                        >
                            {tab.label} <span className="tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="loading-container">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
                <div className="empty-container">
                    <p>No reports found.</p>
                </div>
            ) : (
                <div className="reports-grid">
                    {filteredReports.map((report) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            onClick={() => navigate(`/admin/report/${report.id}`)}
                            className="report-card"
                        >
                            <div className={`status-bar ${report.status}`} />

                            <div className="card-content">
                                <div className="card-top">
                                    <div className="icon-box">
                                        <AlertTriangle className="icon-md" />
                                    </div>
                                    <div className="status-group">
                                        <span className={`card-status-badge ${report.status}`}>
                                            {report.status}
                                        </span>
                                        <span className="challan-id-badge">{report.display_challan_id}</span>
                                    </div>
                                </div>

                                <div className="report-info">
                                    <div className="report-title-section">
                                        <h3>{report.violation_type}</h3>
                                        <p className="report-meta">Report ID: #{report.id} • {report.created_at}</p>
                                    </div>

                                    <div className="details-list">
                                        <div className="detail-item">
                                            <User className="icon-sm text-slate" /> <b>User:</b> {report.user_name}
                                        </div>
                                        <div className="detail-item">
                                            <Car className="icon-sm text-slate" /> <b>Plate:</b> {report.user_vehicle_number}
                                        </div>
                                    </div>

                                    <div className="description-box">
                                        <p className="description-text">"{report.description}"</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
