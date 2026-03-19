import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Filter, Eye, Trash2, Download, X, Calendar, MapPin, Clock, CreditCard, User, Car, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

import './Challans.css';

const Challans = () => {
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [reportFilter, setReportFilter] = useState('all'); // all, reported, not_reported
    const [selectedChallan, setSelectedChallan] = useState(null);

    useEffect(() => {
        fetchChallans();
    }, []);

    const fetchChallans = async () => {
        try {
            const response = await api.get('/api/admin/challans');
            setChallans(response.data);
        } catch (err) {
            console.error("Failed to fetch challans");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this challan? This action cannot be undone.")) return;

        try {
            await api.delete(`/api/admin/challan/${id}`);
            setChallans(challans.filter(c => c.id !== id));
            if (selectedChallan && selectedChallan.id === id) setSelectedChallan(null);
        } catch (err) {
            alert("Failed to delete challan");
        }
    };

    const filteredChallans = challans.filter(c => {
        const matchesSearch = c.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

        let matchesReport = true;
        if (reportFilter === 'reported') matchesReport = c.is_reported;
        if (reportFilter === 'not_reported') matchesReport = !c.is_reported;

        return matchesSearch && matchesStatus && matchesReport;
    });

    return (
        <div className="admin-challans-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Challan Management</h1>
                    <p className="page-subtitle">Review and monitor all system-generated traffic violations</p>
                </div>
            </header>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-wrapper">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search Vehicle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-select-wrapper">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Status: All</option>
                        <option value="pending">Status: Unpaid</option>
                        <option value="paid">Status: Paid</option>
                    </select>
                </div>
                <div className="filter-select-wrapper">
                    <select
                        value={reportFilter}
                        onChange={(e) => setReportFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Reports: All</option>
                        <option value="reported">Reports: Reported Only</option>
                        <option value="not_reported">Reports: No Reports</option>
                    </select>
                </div>
                <button className="export-btn">
                    <Download className="icon-sm" /> Export Data
                </button>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Vehicle & Owner</th>
                                <th>Violation</th>
                                <th>Fine</th>
                                <th>Status</th>
                                <th>Reported</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="loading-skeleton">
                                            Loading...
                                        </td>
                                    </tr>
                                ))
                            ) : filteredChallans.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                                        No challans found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredChallans.map((c) => (
                                    <motion.tr
                                        key={c.id}
                                        layoutId={`row-${c.id}`}
                                        className="row-item"
                                    >
                                        <td className="cell-id">#C-{c.id}</td>
                                        <td>
                                            <div className="cell-vehicle-number">{c.vehicle_number}</div>
                                            <div className="cell-owner">{c.owner_name}</div>
                                        </td>
                                        <td>
                                            <span className="cell-violation-type">{c.type}</span>
                                            <div className="cell-timestamp">{c.timestamp}</div>
                                        </td>
                                        <td className="cell-amount">₹{c.amount}</td>
                                        <td>
                                            <span className={`status-badge ${c.status}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td>
                                            {c.is_reported ? (
                                                <span className="report-badge">
                                                    <AlertCircle className="icon-sm" /> Yes
                                                </span>
                                            ) : (
                                                <span className="no-report">-</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => setSelectedChallan(c)}
                                                    className="icon-btn view"
                                                    title="View Details"
                                                >
                                                    <Eye className="icon-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="icon-btn delete"
                                                    title="Delete Challan"
                                                >
                                                    <Trash2 className="icon-sm" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {selectedChallan && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedChallan(null)}
                            className="modal-backdrop"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="modal-content"
                        >
                            {/* Evidence View */}
                            <div className="modal-left">
                                <div className="main-evidence-container">
                                    <img
                                        src={`http://localhost:5000/${selectedChallan.image}`}
                                        alt="Violation"
                                        className="modal-image"
                                    />
                                    <div className="violation-tag uppercase">
                                        <div className="pulse-dot"></div> {selectedChallan.type}
                                    </div>
                                </div>

                                {selectedChallan.video && (
                                    <div className="video-evidence-container mt-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Video Evidence</p>
                                        <video 
                                            src={`http://localhost:5000/${selectedChallan.video}`} 
                                            controls 
                                            className="w-full rounded-xl border border-slate-700 bg-black h-48"
                                        />
                                    </div>
                                )}

                                <div className="plate-crop-inset mt-4">
                                    <p className="plate-inset-label">Recognized Number Plate</p>
                                    <div className="flex items-center gap-4">
                                        <img src={`http://localhost:5000/${selectedChallan.plate_crop}`} alt="Plate" className="plate-inset-img h-12 object-contain" />
                                        <span className="text-xl font-bold font-mono text-white bg-slate-800 px-3 py-1 rounded border border-slate-600">
                                            {selectedChallan.vehicle_number}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Panel */}
                            <div className="modal-right">
                                <div className="modal-header">
                                    <h2 className="modal-title">
                                        <FileText className="icon-md text-blue" /> Challan Details
                                    </h2>
                                    <button onClick={() => setSelectedChallan(null)} className="close-btn">
                                        <X className="icon-md" />
                                    </button>
                                </div>

                                <div className="modal-details">
                                    <div className="detail-row-highlight">
                                        <div className="icon-box-lg">
                                            <Car className="icon-lg" />
                                        </div>
                                        <div>
                                            <p className="detail-label-sm">Vehicle Number</p>
                                            <p className="detail-value-lg">{selectedChallan.vehicle_number}</p>
                                        </div>
                                    </div>

                                    <div className="simple-grid">
                                        <div className="detail-group">
                                            <p className="detail-label-xs">Owner Name</p>
                                            <div className="detail-box-std">
                                                <User className="icon-sm text-slate" /> {selectedChallan.owner_name}
                                            </div>
                                        </div>
                                        {/* ... other details can remain simplified or extended */}
                                        <div className="detail-group">
                                            <p className="detail-label-xs">Violation Type</p>
                                            <div className="detail-box-std">
                                                {selectedChallan.type}
                                            </div>
                                        </div>

                                        <div className="detail-group">
                                            <p className="detail-label-xs">Fine Amount</p>
                                            <div className="fine-box">
                                                ₹{selectedChallan.amount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            onClick={() => handleDelete(selectedChallan.id)}
                                            className="modal-delete-btn"
                                        >
                                            <Trash2 className="icon-sm" /> Delete
                                        </button>
                                        <button className="modal-download-btn">
                                            <Download className="icon-md" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Challans;
