import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';

import './Payment.css';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

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
            // Load Razorpay Script
            const res = await loadRazorpayScript();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                setPaying(false);
                return;
            }

            // Create Order
            const orderResponse = await api.post('/api/payment/create-order', { challan_id: challanId });
            const { order_id, amount, key } = orderResponse.data;

            // Razorpay options
            const options = {
                key: key, 
                amount: amount, 
                currency: "INR",
                name: "Traffic Sentinel",
                description: "Challan Payment",
                order_id: order_id,
                handler: async function (response) {
                    try {
                        await api.post('/api/payment/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            challan_id: challanId
                        });
                        alert("Payment successful!");
                        navigate('/user/payments');
                    } catch (verifyError) {
                        alert(verifyError.response?.data?.error || "Payment verification failed");
                        setPaying(false);
                    }
                },
                prefill: {
                    name: "Vehicle Owner",
                },
                theme: {
                    color: "#2563eb"
                },
                modal: {
                    ondismiss: function() {
                        setPaying(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                alert(response.error.description);
                setPaying(false);
            });
            
            rzp.open();

        } catch (err) {
            alert(err.response?.data?.error || "Failed to initiate payment");
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
                    <p>Pay your challan securely using Razorpay gateway.</p>
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
                                <CreditCard className="w-5 h-5 mr-2" />
                                Pay Now
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Payment;
