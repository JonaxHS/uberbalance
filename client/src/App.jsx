import React, { useState, useEffect } from 'react';
import { Wallet, Play, Square, History, TrendingUp, ArrowRightLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function App() {
    const [activeShift, setActiveShift] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [inputVal, setInputVal] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveShift();
        fetchHistory();
    }, []);

    const fetchActiveShift = async () => {
        try {
            const res = await fetch(`${API_URL}/shifts/active`);
            const data = await res.json();
            setActiveShift(data);
        } catch (err) {
            console.error('Error fetching active shift:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/shifts`);
            const data = await res.json();
            setShifts(data);
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    };

    const handleStartShift = async () => {
        if (!inputVal || isNaN(inputVal)) return;
        try {
            const res = await fetch(`${API_URL}/shifts/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_cash: parseFloat(inputVal) })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveShift(data);
                setInputVal('');
                fetchHistory();
            }
        } catch (err) {
            alert('Error al iniciar turno');
        }
    };

    const handleEndShift = async () => {
        if (!inputVal || isNaN(inputVal)) return;
        try {
            const res = await fetch(`${API_URL}/shifts/end`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ end_cash: parseFloat(inputVal) })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveShift(null);
                setInputVal('');
                fetchHistory();
            }
        } catch (err) {
            alert('Error al finalizar turno');
        }
    };

    if (loading) return <div className="glass-card">Cargando...</div>;

    return (
        <div className="animate">
            <header style={{ marginBottom: '32px' }}>
                <h1>Uber Balance</h1>
                <p className="subtitle">Lleva el control de tus ganancias diarias</p>
            </header>

            <main>
                {activeShift ? (
                    <div className="glass-card animate" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Play size={20} color="#06C167" />
                            <span style={{ fontWeight: 600 }}>Turno Activo</span>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Inicio</span>
                                <span className="stat-value">${activeShift.start_cash}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Fecha</span>
                                <span className="stat-value">{new Date(activeShift.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <label className="stat-label" style={{ marginBottom: '8px' }}>Dinero al regresar:</label>
                        <input
                            type="number"
                            placeholder="$ 0.00"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleEndShift} style={{ background: '#FF4D4D', color: '#fff', boxShadow: 'none' }}>
                            <Square size={18} /> Finalizar Turno
                        </button>
                    </div>
                ) : (
                    <div className="glass-card animate" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Wallet size={20} color="#06C167" />
                            <span style={{ fontWeight: 600 }}>Iniciar Nuevo Turno</span>
                        </div>

                        <label className="stat-label" style={{ marginBottom: '8px' }}>Dinero inicial:</label>
                        <input
                            type="number"
                            placeholder="$ 0.00"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleStartShift}>
                            <Play size={18} /> Comenzar a Trabajar
                        </button>
                    </div>
                )}

                <div className="glass-card animate">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <History size={20} color="#06C167" />
                        <span style={{ fontWeight: 600 }}>Historial Reciente</span>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {shifts.filter(s => s.status === 'completed').map(shift => (
                            <div key={shift.id} className="history-item">
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                        {new Date(shift.date).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        ${shift.start_cash} → ${shift.end_cash}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: shift.profit >= 0 ? '#06C167' : '#FF4D4D', fontWeight: 700 }}>
                                        {shift.profit >= 0 ? '+' : ''}${shift.profit.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {shifts.filter(s => s.status === 'completed').length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '20px' }}>
                                No hay turnos registrados aún.
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
