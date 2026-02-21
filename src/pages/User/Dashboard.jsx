import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, FileText, ArrowRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './Dashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();

    const stats = [
        { title: 'Total Violations', value: '5', color: 'blue', icon: FileText },
        { title: 'Active Challans', value: '1', color: 'red', icon: AlertTriangle },
        { title: 'Paid Challans', value: '4', color: 'emerald', icon: CheckCircle },
    ];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Overview</h1>
                <p className="dashboard-subtitle">Welcome back, check your traffic compliance status.</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`stat-card ${stat.color}`}
                    >
                        <div className="stat-bg-icon">
                            <stat.icon />
                        </div>
                        <div className="stat-content">
                            <div className={`stat-icon-wrapper`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <h3 className="stat-label">{stat.title}</h3>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Active Challan Alert */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="alert-card"
            >
                <div className="alert-content">
                    <div className="alert-icon-circle">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="alert-text-group">
                        <h3>Pending Violation Detected</h3>
                        <p>
                            You have 1 pending challan for <span className="alert-text-highlight">Speeding</span> detected on <span className="alert-text-highlight">12 Feb 2024</span>.
                            Please pay immediately to avoid penalties.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/user/challans')}
                    className="pay-now-btn"
                >
                    <CreditCard className="w-4 h-4" /> Pay Now
                </button>
            </motion.div>

            {/* Recent History */}
            <div>
                <h2 className="recent-header">Recent Activity</h2>
                <div className="recent-list-container">
                    {[1, 2, 3].map((item, i) => (
                        <div key={i} className="recent-item">
                            <div className="recent-item-left">
                                <div className={`recent-icon-wrapper ${i === 0 ? 'red' : 'emerald'}`}>
                                    {i === 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </div>
                                <div className="recent-details">
                                    <p className="title">{i === 0 ? 'Speeding Violation' : 'Challan Paid'}</p>
                                    <p className="meta">1{i} Feb 2024 • MH 12 AB 1234</p>
                                </div>
                            </div>
                            <div className="recent-item-right">
                                <p className="amount">₹ {i === 0 ? '2000' : '500'}</p>
                                <p className={`status ${i === 0 ? 'pending' : 'success'}`}>{i === 0 ? 'Pending' : 'Success'}</p>
                            </div>
                        </div>
                    ))}
                    <div className="view-all-wrapper">
                        <button onClick={() => navigate('/user/challans')} className="view-all-btn">
                            View All History <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
