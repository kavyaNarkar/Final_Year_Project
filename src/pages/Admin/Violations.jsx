import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, Trash2, Filter, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

import './Violations.css';

const Violations = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchViolations = async () => {
        try {
            const response = await api.get('/api/violations');
            setViolations(response.data);
        } catch (error) {
            console.error("Failed to fetch violations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViolations();
        const interval = setInterval(fetchViolations, 5000); // Auto-refresh every 5s for real-time updates
        return () => clearInterval(interval);
    }, []);

    const filteredViolations = filter === 'all' ? violations : violations.filter(v => v.status === filter);

    const getStatusClass = (type) => {
        if (type === 'Speeding') return 'speeding';
        if (type === 'Red Light') return 'red-light';
        if (type === 'Processing...') return 'processing';
        return 'other';
    };

    if (loading && violations.length === 0) {
        return <div className="loader-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="admin-violations-container">
            <div className="violations-header">
                <h1 className="page-title">Traffic Violations Feed</h1>

                <div className="controls-bar">
                    <div className="search-container">
                        <Search className="search-icon" />
                        <input type="text" placeholder="Search Plate No." className="violations-search-input" />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processed">Processed</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
            </div>

            <div className="table-card">
                <table className="violations-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Vehicle Plate</th>
                            <th>Violation Type</th>
                            <th>Location & Time</th>
                            <th>Fine</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredViolations.map((v) => (
                            <motion.tr
                                key={v.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <td className="cell-id">#{v.id}</td>
                                <td className="cell-plate">{v.plate}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(v.type)}`}>
                                        {v.type}
                                    </span>
                                </td>
                                <td>
                                    <div className="cell-location">{v.location}</div>
                                    <div className="cell-time">{v.timestamp}</div>
                                </td>
                                <td className="cell-fine">₹{v.fine || 0}</td>
                                <td>
                                    <span className={`status-text ${v.status}`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="action-btn-group">
                                        <button className="table-action-btn view" title="View Evidence">
                                            <Eye className="icon-sm" />
                                        </button>
                                        <button className="table-action-btn delete" title="Delete Record">
                                            <Trash2 className="icon-sm" />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                {filteredViolations.length === 0 && (
                    <div className="empty-state">
                        {loading ? 'Loading...' : 'No violations found.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Violations;
