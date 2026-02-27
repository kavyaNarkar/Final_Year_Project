import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, MapPin, Minimize2, Cpu, BarChart, Settings, Share2, Camera, Activity} from 'lucide-react';
import api from '../../utils/api';

import './LiveStream.css';

const LiveStream = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [streamData, setStreamData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCameraInfo = async () => {
            try {
                // Do NOT use Axios to fetch the raw MJPEG stream, it will hang forever.
                // We just need metadata for the header, the <img> tag will handle the MJPEG connection.
                const response = await api.get('/api/admin/cameras');
                const cam = response.data.find(c => c.id === parseInt(id));

                if (cam) {
                    setStreamData(cam);
                } else {
                    setStreamData({ location: "Live Node", status: "active" });
                }
            } catch (err) {
                console.error("Failed to fetch camera metadata");
                setStreamData({ location: "Unknown Location", status: "active" });
            } finally {
                setLoading(false);
            }
        };
        fetchCameraInfo();
    }, [id]);

    if (loading || !streamData) return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="spinner"></div>
                <p className="loading-text">Establishing Secure Stream Connection...</p>
                <p className="loading-subtext">Node ID: CAM-{id}</p>
            </div>
        </div>
    );

    return (
        <div className="livestream-container">
            <header className="livestream-header">
                <div className="header-left">
                    <button
                        onClick={() => navigate('/admin/cameras')}
                        className="back-btn"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="header-title-group">
                            Live Camera Stream <span className="live-badge">LIVE</span>
                        </h1>
                        <div className="header-meta">
                            <span className="meta-item"><MapPin className="w-4 h-4" /> {streamData.location}</span>
                            <span className="separator">•</span>
                            <span className="meta-item"><Wifi className="w-4 h-4 text-emerald-500" /> Active Connection</span>
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="action-icon-btn"><BarChart className="w-5 h-5" /></button>
                    <button className="action-icon-btn"><Settings className="w-5 h-5" /></button>
                    <button className="broadcast-btn">
                        <Share2 className="w-4 h-4" /> Broadcast
                    </button>
                </div>
            </header>

            <div className="livestream-grid">
                {/* Main Viewport */}
                <div className="viewport-column">
                    <div className="video-player-container">
                        {/* Actual MJPEG Stream Rendering */}
                        <div className="stream-placeholder">
                            <img
                                src={`http://localhost:5000/api/admin/camera/${id}/stream`}
                                
                                alt={`Live Stream Node ${id}`}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            {/* Fallback if stream fails to load */}
                            <div className="stream-placeholder-content" style={{ display: 'none', position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <Camera className="placeholder-icon" />
                                <p className="stream-url text-red-400">Stream Connection Failed / Offline</p>
                            </div>
                        </div>

                        {/* Overlay Controls */}
                        <div className="overlay-controls">
                            <div className="control-pill">
                                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <span className="control-text">BITRATE: 4.8MB/S</span>
                            </div>
                            <div className="control-pill">
                                <Cpu className="w-4 h-4 text-blue-500" />
                                <span className="control-text">ENC: H.264 (NVENC)</span>
                            </div>
                        </div>

                        <div className="bottom-controls">
                            <button className="minimize-btn">
                                <Minimize2 className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scanline Effect */}
                        <div className="scanline-effect"></div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card-small">
                            <h4 className="stat-label-xs">FPS Status</h4>
                            <p className="stat-value-lg">60.0 <span className="stat-status stable">STABLE</span></p>
                        </div>
                        <div className="stat-card-small">
                            <h4 className="stat-label-xs">Latency</h4>
                            <p className="stat-value-lg">42ms <span className="stat-status optimal">OPTIMAL</span></p>
                        </div>
                        <div className="stat-card-small">
                            <h4 className="stat-label-xs">Detection Logic</h4>
                            <p className="stat-value-lg">YOLOV8m <span className="stat-status active">ACTIVE</span></p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="sidebar-column">
                    <div className="metadata-panel">
                        <h3 className="metadata-title">Real-time Feed Metadata</h3>

                        <div className="metadata-content">
                            <div className="meta-field">
                                <label>Hardware ID</label>
                                <p>NODE-SRV-00{id}-X</p>
                            </div>
                            <div className="meta-field">
                                <label>Geo Coordinates</label>
                                <p>19.0760° N, 72.8777° E</p>
                            </div>
                            <div>
                                <h4 className="detections-section h4">Detections (Current Feed)</h4>
                                <div className="detections-list">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="detection-item group">
                                            <span className="detection-plate group-hover:text-white">MH 04 ER 992{i}</span>
                                            <span className="detection-status">TRUSTED</span>
                                        </div>
                                    ))}
                                    <div className="detection-warning">
                                        <span>UNIDENTIFIED OBJ</span>
                                        <span>WARNING</span>
                                    </div>
                                </div>
                            </div>

                            <div className="override-section">
                                <button className="override-btn">
                                    Emergency Override
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveStream;
