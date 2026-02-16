import React, { useState, useEffect } from 'react';
const API = import.meta.env.VITE_API_URL;

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Plus, Users, Trash2, ChevronRight, UserPlus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL + "/api";


export default function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    // invite states
    const [inviteEmail, setInviteEmail] = useState('');
    const [activeWorkspace, setActiveWorkspace] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('nexus_token');
        axios.get(`${API_BASE}/workspaces`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => setWorkspaces(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // CREATE WORKSPACE
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const token = localStorage.getItem('nexus_token');

        try {
            const response = await axios.post(`${API_BASE}/workspaces`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setWorkspaces([...workspaces, response.data]);
            setName('');
            setDescription('');
            setShowForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    // DELETE WORKSPACE
    const handleDelete = async (id) => {
        const token = localStorage.getItem('nexus_token');
        try {
            await axios.delete(`${API_BASE}/workspaces/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWorkspaces(workspaces.filter(w => w.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // INVITE USER
    const inviteUser = async (workspaceId) => {
        if (!inviteEmail) return alert("Enter email");

        const token = localStorage.getItem('nexus_token');

        try {
            const res = await axios.post(
                `${API_BASE}/workspaces/invite`,
                {
                    workspace_id: workspaceId,
                    email: inviteEmail
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            alert(res.data.message || "User invited!");
            setInviteEmail('');
            setActiveWorkspace(null);
        } catch (err) {
            console.log(err);
            alert("Invite failed");
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading workspaces...</p>
            </div>
        );
    }

    return (
        <div className="page fade-in">

            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h2>Workspaces</h2>
                    <p className="text-muted">Organize your team projects</p>
                </div>

                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} /> New Workspace
                </button>
            </div>

            {/* CREATE FORM */}
            {showForm && (
                <form onSubmit={handleCreate} className="create-form glass fade-in">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Workspace name"
                        required
                    />
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                    />
                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Create</button>
                        <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            {/* WORKSPACE GRID */}
            <div className="workspace-grid">
                {workspaces?.map(ws => (
                    <div key={ws.id} className="workspace-card glass">

                        {/* CARD CLICK NAVIGATION */}
                        <div onClick={() => navigate(`/workspaces/${ws.id}`)} style={{cursor:"pointer"}}>
                            <div className="workspace-card-header">
                                <div className="workspace-icon">
                                    <Building2 size={24} />
                                </div>

                                <button
                                    className="btn-icon-danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(ws.id);
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <h3>{ws.name}</h3>
                            <p className="text-muted">{ws.description || 'No description'}</p>

                            <div className="workspace-card-footer">
                                <span className="badge">
                                    <Users size={14} /> {ws.role}
                                </span>
                                <ChevronRight size={18} className="text-muted" />
                            </div>
                        </div>

                        {/* INVITE SECTION */}
                        <div style={{ marginTop: "12px" }}>
                            {activeWorkspace === ws.id ? (
                                <>
                                    <input
                                        placeholder="Enter user email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        style={{ width: "100%", marginBottom: "6px" }}
                                    />
                                    <button
                                        className="btn-primary"
                                        onClick={() => inviteUser(ws.id)}
                                        style={{ width: "100%" }}
                                    >
                                        Send Invite
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-ghost"
                                    style={{ width: "100%" }}
                                    onClick={() => setActiveWorkspace(ws.id)}
                                >
                                    <UserPlus size={16} /> Invite Collaborator
                                </button>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
