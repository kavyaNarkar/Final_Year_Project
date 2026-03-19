import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, User, Car, Info, Eye, Video } from 'lucide-react';
import api from '../../utils/api';

import './ReportDetails.css';

const ReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    useEffect(() => {
        const fetchReportDetail = async () => {
            try {
                const response = await api.get('/api/admin/reports');
                const selected = response.data.find(r => r.id === parseInt(id));
                setReport(selected);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReportDetail();
    }, [id]);

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

    if (loading) return <div className="loading-container">Loading details...</div>;
    if (!report) return <div className="empty-container"><p>Report not found</p></div>;

    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (s.includes('pending')) return 'pending';
        if (s.includes('accept')) return 'accepted';
        if (s.includes('reject') || s.includes('decline')) return 'declined';
        return '';
    };

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    return (
        <div className="report-details-container">
            <button onClick={() => navigate(-1)} className="back-link-btn">
                <ArrowLeft className="icon-sm" /> Back to Reports
            </button>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="details-layout"
            >
                {/* Left Side: General Info */}
                <div className="details-main">
                    <div className="details-card">
                        <div className="card-header-flex">
                            <div>
                                <h1>Report #{report.id}</h1>
                                <p className="text-slate-400">Challan Reference: {report.display_challan_id}</p>
                            </div>
                            <span className={`status-badge-lg ${getStatusClass(report.status)}`}>
                                {report.status}
                            </span>
                        </div>

                        <div className="comparison-section">
                            <div className="comparison-grid">
                                <div className="comparison-item user">
                                    <div className="comp-label"><User className="w-4 h-4" /> Reporting User</div>
                                    <p className="comp-value">{report.user_name}</p>
                                    <p className="comp-sub">Vehicle: <b>{report.user_vehicle_number}</b></p>
                                </div>
                                <div className="comparison-divider">VS</div>
                                <div className="comparison-item challan">
                                    <div className="comp-label"><Car className="w-4 h-4" /> Challan Target</div>
                                    <p className="comp-value">{report.owner_name}</p>
                                    <p className="comp-sub">Detected: <b>{report.challan_vehicle_number}</b></p>
                                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                                        <p>Location: {report.location || 'N/A'}</p>
                                        <p>Time: {report.violation_time || report.created_at}</p>
                                        <p>Fine: ₹{report.amount || '0'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {report.user_vehicle_number !== report.challan_vehicle_number ? (
                                <div className="mismatch-alert">
                                    <Info className="w-5 h-5" />
                                    <span><b>PLATE MISMATCH DETECTED:</b> The reporting user's vehicle number does not match the challan vehicle number. This report may be valid if the user was wrongly identified.</span>
                                </div>
                            ) : (
                                <div className="match-alert">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Plate numbers match. User is reporting their own challan.</span>
                                </div>
                            )}
                        </div>

                        <div className="reason-section">
                            <h3 className="section-title">User's Complaint</h3>
                            <div className="reason-bubble">
                                <p className="reason-text">"{report.description}"</p>
                            </div>
                        </div>

                        {report.status.toLowerCase() === 'pending' && (
                            <div className="action-footer">
                                <button
                                    onClick={() => handleAction('accepted', 'Your report has been accepted. The challan has been cancelled as it was wrongly issued.')}
                                    className="action-btn accept"
                                >
                                    <CheckCircle className="w-5 h-5" /> ACCEPT & DELETE CHALLAN
                                </button>
                                <button
                                    onClick={() => setShowDeclineModal(true)}
                                    className="action-btn decline"
                                >
                                    <XCircle className="w-5 h-5" /> REJECT REPORT
                                </button>
                            </div>
                        )}

                        {report.admin_response && (
                            <div className="admin-response-section">
                                <h4 className="response-label">Admin Resolution</h4>
                                <p className="response-text">{report.admin_response}</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Side: Evidence */}
                <div className="details-sidebar">
                    <div className="evidence-panel">
                        <h3 className="panel-title"><Eye className="w-5 h-5" /> Evidence Preview</h3>
                        
                        <div className="evidence-group">
                            <p className="evidence-label">Violation Snapshot</p>
                            <div className="evidence-media">
                                <img src={`${API_BASE}/${Array.isArray(report.images) ? report.images[0] : report.images}`} alt="Violation" className="rounded-lg shadow-inner" />
                            </div>
                        </div>

                        <div className="evidence-group">
                            <p className="evidence-label">Number Plate Crop</p>
                            <div className="evidence-media plate">
                                <img src={`${API_BASE}/${report.plate_crop}`} alt="Plate" className="rounded-lg border-2 border-white/10" />
                            </div>
                        </div>

                        <div className="evidence-group">
                            <p className="evidence-label"><Video className="w-4 h-4 inline mr-1" /> Video Evidence</p>
                            <div className="evidence-media video">
                                <video controls className="rounded-lg w-full">
                                    <source src={`${API_BASE}/${report.video}`} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Decline Modal */}
            {showDeclineModal && (
                <div className="decline-modal-overlay">
                    <div className="decline-modal">
                        <h3 className="decline-title">Reject Report</h3>
                        <p className="text-slate-400 text-sm mb-4">Provide a reason for rejecting this complaint. This will be visible to the user.</p>
                        <textarea
                            className="decline-textarea"
                            placeholder="Reason for rejection..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <div className="modal-footer">
                            <button onClick={() => setShowDeclineModal(false)} className="modal-cancel-btn">Cancel</button>
                            <button onClick={() => handleAction('declined', reason)} className="modal-confirm-btn">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetails;
