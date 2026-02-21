import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CreditCard, AlertTriangle, FileText, ArrowLeft, Play, ShieldAlert } from 'lucide-react';
import api from '../../utils/api';

import './ChallanDetails.css';

const ChallanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChallan = async () => {
            try {
                const response = await api.get(`/api/user/challan/${id}`);
                setChallan(response.data);
            } catch (err) {
                setError("Failed to load challan details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallan();
    }, [id]);

    const handlePay = async () => {
        try {
            await api.post('/api/user/pay-challan', { challan_id: id });
            alert("Payment Successful!");
            window.location.reload(); // Reload to update status
        } catch (err) {
            alert(err.response?.data?.error || "Payment Failed");
        }
    };

    if (loading) return (
        <div className="centered-message">
            <div className="spinner"></div>
        </div>
    );

    if (error) return (
        <div className="error-box">
            <h3 className="text-xl font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
        </div>
    );

    if (!challan) return null;

    return (
        <div className="challan-details-container">
            <button
                onClick={() => navigate(-1)}
                className="back-btn"
            >
                <ArrowLeft className="w-4 h-4" /> Back to My Challans
            </button>

            <header className="details-header">
                <div className="header-left">
                    <div className="challan-meta-row">
                        <span className="challan-id-badge">#{challan.id}</span>
                        <div className={`status-badge-lg ${challan.status}`}>
                            {challan.status}
                        </div>
                    </div>
                    <h1 className="violation-title">{challan.type}</h1>
                </div>
                <div className="header-right">
                    <p className="amount-label">Fine Amount</p>
                    <p className="amount-value">₹{challan.amount}</p>
                </div>
            </header>

            <div className="details-grid">
                {/* Visual Evidence Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="evidence-section"
                >
                    <div className="card-box">
                        <h3 className="section-title">
                            <AlertTriangle className="w-5 h-5 icon-orange" /> Evidence
                        </h3>

                        <div className="evidence-content">
                            {/* Image */}
                            <div className="evidence-image-container">
                                <img
                                    src={challan.image ? `http://localhost:5000/${challan.image}` : 'https://via.placeholder.com/800x450'}
                                    alt="Evidence"
                                    className="evidence-main-img"
                                />
                                <div className="image-tag">
                                    Captured Image
                                </div>
                            </div>

                            {/* Video */}
                            {challan.video ? (
                                <div className="video-container">
                                    <video
                                        src={challan.video}
                                        poster={challan.image ? `http://localhost:5000/${challan.image}` : ''}
                                        controls
                                        className="video-player"
                                    />
                                </div>
                            ) : (
                                <div className="no-video-placeholder">
                                    <p>Video evidence not available</p>
                                </div>
                            )}

                            {/* Plate Crop */}
                            {challan.plate_crop && (
                                <div className="plate-crop-container">
                                    <span className="plate-label">Recognized Plate</span>
                                    <img src={`http://localhost:5000/${challan.plate_crop}`} className="plate-img" alt="Plate" />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Details & Actions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="info-section"
                >
                    {/* Location & Map */}
                    <div className="card-box">
                        <h3 className="section-title">
                            <MapPin className="w-5 h-5 icon-blue" /> Location Details
                        </h3>
                        <div className="info-content">
                            <p className="location-text">{challan.location}</p>
                            <p className="timestamp-text"><Calendar className="inline w-4 h-4 mr-1" /> {challan.timestamp}</p>
                        </div>

                        <div className="map-frame">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(challan.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                title="Violation Location"
                            ></iframe>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card-box">
                        <h3 className="section-title">Actions</h3>

                        {challan.status !== 'paid' ? (
                            <button
                                onClick={handlePay}
                                className="action-btn-pay"
                            >
                                <CreditCard className="w-5 h-5" /> Pay Now (₹{challan.amount})
                            </button>
                        ) : (
                            <div className="paid-banner">
                                <ShieldAlert className="w-5 h-5" /> Paid on {challan.payment_date || 'Unknown Date'}
                            </div>
                        )}

                        <div className="report-section-divider">
                            {challan.is_reported ? (
                                <div className="reported-info-box">
                                    <p className="reported-title">
                                        <FileText className="w-4 h-4" /> Report Submitted
                                    </p>
                                    <p className="reported-status">Status: <span className="uppercase font-bold">{challan.report_status}</span></p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate(`/user/challan/${id}/report`)}
                                    className="report-btn"
                                >
                                    Report / Contest Challan
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ChallanDetails;
