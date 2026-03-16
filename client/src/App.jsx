import React, { useState, useEffect } from 'react';
import { Wallet, Play, Square, History, TrendingUp, LogOut, User, Lock, ArrowRight, Trash2, Coins, Banknote } from 'lucide-react';

const API_URL = `http://${window.location.hostname}:5001/api`;

function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [authInput, setAuthInput] = useState({ username: '', password: '' });

    const [activeShift, setActiveShift] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [breakdown, setBreakdown] = useState({ bills: '', coins: '' });
    const [loading, setLoading] = useState(!!token);

    useEffect(() => {
        if (token) {
            fetchActiveShift();
            fetchHistory();
        }
    }, [token]);

    const handleAuth = async () => {
        const endpoint = isRegistering ? '/register' : '/login';
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authInput)
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                setAuthInput({ username: '', password: '' });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error en la autenticación');
        }
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        setActiveShift(null);
        setShifts([]);
    };

    const fetchActiveShift = async () => {
        try {
            const res = await fetch(`${API_URL}/shifts/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setActiveShift(data);
            } else if (res.status === 401 || res.status === 403) {
                logout();
            }
        } catch (err) {
            console.error('Error fetching active shift:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/shifts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setShifts(data);
            } else {
                setShifts([]);
            }
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    };

    const handleStartShift = async () => {
        if (!breakdown.bills && !breakdown.coins) return alert('Ingresa montos');
        try {
            const res = await fetch(`${API_URL}/shifts/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_bills: parseFloat(breakdown.bills) || 0,
                    start_coins: parseFloat(breakdown.coins) || 0
                })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveShift(data);
                setBreakdown({ bills: '', coins: '' });
                fetchHistory();
            }
        } catch (err) {
            alert('Error al iniciar turno');
        }
    };

    const handleEndShift = async () => {
        if (!breakdown.bills && !breakdown.coins) return alert('Ingresa montos');
        try {
            const res = await fetch(`${API_URL}/shifts/end`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    end_bills: parseFloat(breakdown.bills) || 0,
                    end_coins: parseFloat(breakdown.coins) || 0
                })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveShift(null);
                setBreakdown({ bills: '', coins: '' });
                fetchHistory();
            }
        } catch (err) {
            alert('Error al finalizar turno');
        }
    };

    const handleDeleteShift = async (id) => {
        if (!confirm('¿Seguro que quieres borrar este turno?')) return;
        try {
            const res = await fetch(`${API_URL}/shifts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchHistory();
            }
        } catch (err) {
            alert('Error al borrar el turno');
        }
    };

    if (!token) {
        return (
            <div className="animate glass-card">
                <header style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <h1>Uber Balance</h1>
                    <p className="subtitle">{isRegistering ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}</p>
                </header>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-secondary)' }} />
                    <input
                        style={{ paddingLeft: '40px' }}
                        placeholder="Usuario"
                        value={authInput.username}
                        onChange={(e) => setAuthInput({ ...authInput, username: e.target.value })}
                    />
                </div>
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-secondary)' }} />
                    <input
                        type="password"
                        style={{ paddingLeft: '40px' }}
                        placeholder="Contraseña"
                        value={authInput.password}
                        onChange={(e) => setAuthInput({ ...authInput, password: e.target.value })}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleAuth}>
                    {isRegistering ? 'Crear Cuenta' : 'Entrar'} <ArrowRight size={18} />
                </button>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
                    {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <span
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{ color: 'var(--accent-color)', cursor: 'pointer', marginLeft: '8px', fontWeight: 600 }}
                    >
                        {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
                    </span>
                </p>
            </div>
        );
    }

    if (loading) return <div className="glass-card">Cargando...</div>;

    return (
        <div className="animate">
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Uber Balance</h1>
                    <p className="subtitle">Hola, {user.username} 👋</p>
                </div>
                <button onClick={logout} className="btn" style={{ width: 'auto', background: 'transparent', color: 'var(--text-secondary)', padding: '8px' }}>
                    <LogOut size={20} />
                </button>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label className="stat-label" style={{ marginBottom: '4px' }}>Billetes:</label>
                                <div style={{ position: 'relative' }}>
                                    <Banknote size={16} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="number"
                                        style={{ paddingLeft: '32px', marginBottom: 0 }}
                                        placeholder="0.00"
                                        value={breakdown.bills}
                                        onChange={(e) => setBreakdown({ ...breakdown, bills: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="stat-label" style={{ marginBottom: '4px' }}>Monedas:</label>
                                <div style={{ position: 'relative' }}>
                                    <Coins size={16} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="number"
                                        style={{ paddingLeft: '32px', marginBottom: 0 }}
                                        placeholder="0.00"
                                        value={breakdown.coins}
                                        onChange={(e) => setBreakdown({ ...breakdown, coins: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label className="stat-label" style={{ marginBottom: '4px' }}>Billetes:</label>
                                <div style={{ position: 'relative' }}>
                                    <Banknote size={16} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="number"
                                        style={{ paddingLeft: '32px', marginBottom: 0 }}
                                        placeholder="0.00"
                                        value={breakdown.bills}
                                        onChange={(e) => setBreakdown({ ...breakdown, bills: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="stat-label" style={{ marginBottom: '4px' }}>Monedas:</label>
                                <div style={{ position: 'relative' }}>
                                    <Coins size={16} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="number"
                                        style={{ paddingLeft: '32px', marginBottom: 0 }}
                                        placeholder="0.00"
                                        value={breakdown.coins}
                                        onChange={(e) => setBreakdown({ ...breakdown, coins: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary" onClick={handleStartShift}>
                            <Play size={18} /> Comenzar a Trabajar
                        </button>
                    </div>
                )}

                <div className="glass-card animate">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <History size={20} color="#06C167" />
                        <span style={{ fontWeight: 600 }}>Tu Historial</span>
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {shifts.filter(s => s.status === 'completed').map(shift => (
                            <div key={shift.id} className="history-item">
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                        {new Date(shift.date).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        ${shift.start_cash} (${shift.start_bills}b/${shift.start_coins}m) → ${shift.end_cash}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: shift.profit >= 0 ? '#06C167' : '#FF4D4D', fontWeight: 700 }}>
                                        {shift.profit >= 0 ? '+' : ''}${shift.profit.toFixed(2)}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteShift(shift.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#FF4D4D'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {shifts.filter(s => s.status === 'completed').length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '20px' }}>
                                Aún no tienes turnos registrados.
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
