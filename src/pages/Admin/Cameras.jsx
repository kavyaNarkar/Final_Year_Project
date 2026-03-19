import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Activity, Clock, Play, VideoOff, Settings, AlertCircle, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

import './Cameras.css';

const Cameras = () => {
    const navigate = useNavigate();
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCameras();
    }, []);

    const fetchCameras = async () => {
        try {
            const response = await api.get('/api/admin/cameras');
            setCameras(response.data);
        } catch (err) {
            console.error("Failed to fetch cameras");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-cameras-container">
            <header className="cameras-header">
                <div className="cameras-title">
                    <h1>Camera Network</h1>
                    <p>Monitor and manage all active traffic surveillance nodes</p>
                </div>
                <div className="header-actions">
                    <span className="nodes-status">
                        {cameras.filter(c => c.status === 'active').length} Nodes Online
                    </span>
                    <button className="settings-btn">
                        <Settings className="icon-md" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="cameras-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-card" />
                    ))}
                </div>
            ) : (
                <div className="cameras-grid">
                    {cameras.map((cam, index) => (
                        <motion.div
                            key={cam.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`camera-card ${cam.status}`}
                        >
                            <div className="camera-content">
                                <div className="camera-top">
                                    <div className="camera-identity">
                                        <div className={`camera-icon-box ${cam.status}`}>
                                            <Camera className="icon-md" />
                                        </div>
                                        <div className="camera-name-group">
                                            <h3>Node #{cam.id}</h3>
                                            <p className="camera-ip">{cam.ip_address}</p>
                                        </div>
                                    </div>
                                    <span className={`camera-status-pill ${cam.status}`}>
                                        <div className={`status-dot ${cam.status}`}></div>
                                        {cam.status}
                                    </span>
                                </div>

                                <div className="camera-preview-container bg-slate-100 rounded-xl mb-4 overflow-hidden relative group">
                                    {cam.status === 'active' ? (
                                        <img 
                                            src={`http://localhost:5000/api/admin/camera/${cam.id}/stream`} 
                                            alt={`Live Stream Node ${cam.id}`}
                                            className="w-full h-40 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-40 flex flex-col items-center justify-center text-slate-400">
                                            <VideoOff className="w-12 h-12 mb-2" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Feed Unavailable</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Maximize2 className="text-white w-8 h-8" />
                                    </div>
                                </div>

                                <div className="camera-details">
                                    <div className="detail-row">
                                        <MapPin className="icon-sm" /> {cam.location}
                                    </div>
                                    <div className="detail-row mono">
                                        <Clock className="icon-sm" /> {cam.last_active}
                                    </div>
                                </div>

                                <button
                                    disabled={cam.status !== 'active'}
                                    onClick={() => navigate(`/admin/camera/${cam.id}/stream`)}
                                    className={`stream-btn ${cam.status}`}
                                >
                                    {cam.status === 'active' ? <><Play className="icon-sm" /> Full View Mode</> : <><VideoOff className="icon-sm" /> Node Offline</>}
                                </button>
                            </div>

                            <div className="hover-glow"></div>
                        </motion.div>
                    ))}

                    {/* Add Camera Placeholder if less than 6 */}
                    {cameras.length < 6 && (
                        <div className="add-camera-card">
                            <AlertCircle className="add-icon" />
                            <p className="add-text">Add Survelliance Node</p>
                            <p className="add-subtext">Available slots: {6 - cameras.length}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Cameras;
