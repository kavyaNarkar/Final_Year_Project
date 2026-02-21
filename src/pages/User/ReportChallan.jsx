import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowLeft, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

import './ReportChallan.css';

const ReportChallan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challan, setChallan] = useState(null);
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchChallan = async () => {
            try {
                const response = await api.get(`/api/user/challan/${id}`);
                setChallan(response.data);
            } catch (err) {
                console.error(err);
                // navigate(-1); // Go back if error, but user should see error
            } finally {
                setPageLoading(false);
            }
        };
        fetchChallan();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/user/reports', {
                challan_id: id,
                description: description
            });
            setSubmitted(true);
            setTimeout(() => {
                navigate(`/user/challan/${id}`);
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to submit report");
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="centered-message">Loading...</div>;
    if (!challan) return <div className="centered-message">Challan not found</div>;

    return (
        <div className="report-page-container">
            {/* Custom Success Modal */}
            <AnimatePresence>
                {submitted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="modal-overlay"
                    >
                        <div className="success-modal">
                            <div className="success-icon-wrapper">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="success-title">Report Submitted!</h2>
                            <p className="success-message">Redirecting you back to challan details in moment...</p>
                            <div className="progress-bar-bg">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3 }}
                                    className="progress-bar-fill"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => navigate(-1)}
                className="back-btn"
            >
                <ArrowLeft className="w-4 h-4" /> Cancel & Go Back
            </button>

            <div className="report-form-card">
                <div className="form-header">
                    <h1 className="form-title">Report Incorrect Challan</h1>
                    <p className="form-subtitle">Provide details about why you believe this challan is incorrect.</p>
                </div>

                <div className="challan-summary-box">
                    <div className="warning-icon-box">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="summary-details">
                        <p className="summary-label">Challenging Violation</p>
                        <p className="summary-violation">{challan.type}</p>
                        <p className="summary-meta">Ticket #{challan.id} • {challan.timestamp}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-group">
                    <div className="form-group">
                        <label className="form-label">Description of Issue</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-textarea"
                            placeholder="Please describe clearly why this challan is invalid..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Report</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportChallan;
