import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Camera, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



import './Dashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const stats = [
        { title: 'Total Violations', value: '1,240', subtext: 'Since system start', icon: AlertTriangle, color: 'blue', trend: 12 },
        { title: 'Today\'s Violations', value: '45', subtext: 'Updated 2 mins ago', icon: AlertTriangle, color: 'orange', trend: 5 },
        { title: 'Paid Challans', value: '850', subtext: '₹ 4.2L Collected', icon: CheckCircle, color: 'emerald', trend: 8 },
        { title: 'Pending Reports', value: '12', subtext: 'Action Required', icon: AlertTriangle, color: 'red', trend: 2 },
    ];

    return (
        <div className="admin-dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">System Overview</h1>
                <div className="last-updated">
                    Last updated: <span>Just now</span>
                </div>
            </div>

            {/* Stats Grid */}
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
                            <stat.icon style={{ width: '6rem', height: '6rem', transform: 'rotate(12deg)' }} />
                        </div>

                        <div className="stat-card-content">
                            <div>
                                <div className="stat-header">
                                    <div className="stat-icon-box">
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    {stat.trend && (
                                        <div className={`trend-badge ${stat.trend > 0 ? 'up' : 'down'}`}>
                                            {stat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {Math.abs(stat.trend)}%
                                        </div>
                                    )}
                                </div>
                                <h3 className="stat-title">{stat.title}</h3>
                                <p className="stat-value">{stat.value}</p>
                            </div>
                            <p className="stat-subtext">{stat.subtext}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="dashboard-main-grid">
                {/* Recent Violations */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="recent-panel"
                >
                    <div className="panel-header">
                        <h2 className="panel-title">Recent Violations</h2>
                        <button onClick={() => navigate('/admin/violations')} className="view-all-link">View All</button>
                    </div>

                    <div className="table-container">
                        <table className="violations-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Vehicle No.</th>
                                    <th>Type</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td className="text-white font-medium">#V-{1000 + i}</td>
                                        <td className="uppercase">MH 12 AB {1230 + i}</td>
                                        <td><span className="violation-badge">Speeding</span></td>
                                        <td>10:4{i} AM</td>
                                        <td>
                                            <span className={`status-badge-sm ${i % 2 === 0 ? 'pending' : 'processed'}`}>
                                                {i % 2 === 0 ? 'Pending' : 'Processed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* System Health / Camera Status */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="camera-panel"
                >
                    <h2 className="panel-title" style={{ marginBottom: '1.5rem' }}>Camera Feed Status</h2>
                    <div className="camera-list">
                        {[1, 2, 3, 4, 5].map((cam) => (
                            <div key={cam} className="camera-item" onClick={() => navigate('/admin/cameras')}>
                                <div className="camera-info">
                                    <div className={`status-dot ${cam === 3 ? 'error' : 'active'}`}></div>
                                    <div>
                                        <p className="camera-name">CAM-{100 + cam}</p>
                                        <p className="camera-loc">Sector {cam}, Main Road</p>
                                    </div>
                                </div>
                                <div className="live-badge">Live</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/admin/cameras')} className="manage-cameras-btn">
                        Manage Cameras
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
