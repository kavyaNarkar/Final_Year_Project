import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
// Replace this QR image with your own UPI QR code
import qrCodeImage from '../../assets/paymentqr.jpg';

import './Payment.css';

const Payment = () => {
    const { challanId } = useParams();
    const navigate = useNavigate();
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const fetchChallan = async () => {
            try {
                // Fetch the challan details to display before payment
                const response = await api.get(`/api/user/challan/${challanId}`);
                setChallan(response.data);
            } catch (err) {
                setError("Failed to load challan details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallan();
    }, [challanId]);

    const handleConfirmPayment = async () => {
        setPaying(true);
        try {
            await api.post('/api/user/pay-challan', { challan_id: challanId });
            alert("Payment Recorded Successfully!");
            // Redirect user back to the challan tab (My Challans)
            navigate('/user/challans');
        } catch (err) {
            alert(err.response?.data?.error || "Failed to confirm payment");
            setPaying(false);
        }
    };

    if (loading) return (
        <div className="payment-centered-message">
            <div className="spinner"></div>
        </div>
    );

    if (error) return (
        <div className="payment-error-box">
            <h3 className="text-xl font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
        </div>
    );

    if (!challan) return null;

    return (
        <div className="payment-page-container">
            <button
                onClick={() => navigate(-1)}
                className="back-btn"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Challan Details
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="payment-card-box"
            >
                <div className="payment-header">
                    <ShieldCheck className="w-12 h-12 text-blue-500 mb-2 mx-auto" />
                    <h2>Secure Payment Portal</h2>
                    <p>Scan the QR code below to settle your fine.</p>
                </div>

                <div className="payment-details-group">
                    <div className="detail-row">
                        <span className="detail-label">Challan ID:</span>
                        <span className="detail-value font-bold">#{challan.id}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Vehicle Number:</span>
                        <span className="detail-value">{challan.vehicle_number}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Violation Type:</span>
                        <span className="detail-value">{challan.type}</span>
                    </div>
                    <div className="detail-row amount-row">
                        <span className="detail-label">Total Fine Amount:</span>
                        <span className="detail-value amount-text">₹{challan.amount}</span>
                    </div>
                </div>

                <div className="qr-container">
                    {/* The QR Image */}
                    <img
                        src={qrCodeImage}
                        alt="UPI Payment QR Code"
                        className="payment-qr-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x300.png?text=QR+Code+Missing";
                        }}
                    />
                    <p className="qr-instruction">Scan this QR code with any UPI app to pay</p>
                </div>

                <div className="payment-actions">
                    <button
                        onClick={handleConfirmPayment}
                        disabled={paying}
                        className="confirm-payment-btn"
                    >
                        {paying ? (
                            <div className="spinner-small"></div>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                I Have Paid
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Payment;
