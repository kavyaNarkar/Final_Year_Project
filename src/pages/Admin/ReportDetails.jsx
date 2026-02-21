import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, CheckCircle, XCircle, Shield, User, Car } from 'lucide-react';
import api from '../../utils/api';

import './ReportDetails.css';

const ReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const response = await api.get('/api/admin/reports');
                setReports(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const selectedReport = reports.find(r => r.id === parseInt(id));

    const handleAction = async (status, responseReason) => {
        try {
            await api.put(`/api/admin/reports/${id}`, {
                status: status,
                response: responseReason
            });
            alert(`Report ${status}!`);
            navigate('/admin/reports');
        } catch (err) {
            alert("Action failed");
        }
    };

    if (loading) return <div className="loading-container">Loading...</div>;
    if (!selectedReport) return <div className="empty-container"><p>Report not found</p></div>;

    return (
        <div className="report-details-container">
            <button onClick={() => navigate(-1)} className="back-link-btn">
                <ArrowLeft className="icon-sm" /> Back to Reports
            </button>

            <div className="details-card">
                <div className="card-header">
                    <div className="header-left">
                        <h1>Report #{selectedReport.id}</h1>
                        <div className="header-meta">
                            <span className="meta-item"><User className="icon-sm" /> {selectedReport.user_name}</span>
                            <span className="meta-item"><Car className="icon-sm" /> {selectedReport.vehicle_number}</span>
                        </div>
                    </div>
                    <span className={`status-badge-lg ${selectedReport.status}`}>
                        {selectedReport.status}
                    </span>
                </div>

                <div className="info-grid">
                    <div className="info-box">
                        <h3 className="box-label">Challan Info</h3>
                        <p className="challan-type">{selectedReport.violation_type}</p>
                        <p className="challan-id">Challan ID: #{selectedReport.challan_id}</p>
                    </div>
                    <div className="info-box">
                        <h3 className="box-label">User's Statement</h3>
                        <p className="user-statement">"{selectedReport.description}"</p>
                    </div>
                </div>

                {selectedReport.status === 'pending' && (
                    <div className="action-bar">
                        <button
                            onClick={() => handleAction('accepted', 'Report Accepted by Admin')}
                            className="action-btn accept"
                        >
                            <CheckCircle className="icon-md" /> ACCEPT REPORT
                        </button>
                        <button
                            onClick={() => setShowDeclineModal(true)}
                            className="action-btn decline"
                        >
                            <XCircle className="icon-md" /> DECLINE REPORT
                        </button>
                    </div>
                )}

                {selectedReport.admin_response && (
                    <div className="admin-response-box">
                        <h4 className="response-label">Admin Response</h4>
                        <p className="response-text">{selectedReport.admin_response}</p>
                    </div>
                )}
            </div>

            {/* Decline Modal */}
            {showDeclineModal && (
                <div className="decline-modal-overlay">
                    <div className="decline-modal">
                        <h3 className="decline-title">Decline Report</h3>
                        <textarea
                            className="decline-textarea"
                            placeholder="Reason for declining..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <div className="modal-footer">
                            <button onClick={() => setShowDeclineModal(false)} className="modal-cancel-btn">Cancel</button>
                            <button onClick={() => handleAction('declined', reason)} className="modal-confirm-btn">Decline</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetails;
