import { Link } from 'react-router-dom';
import { Music2, Library, Home, Search } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Brand logo removed as requested */}
            <div style={{ visibility: 'hidden' }}>
                 <Music2 size={24} />
            </div>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
                <NavLink to="/" icon={<Home size={20} />} label="Home" />
                <NavLink to="/library" icon={<Library size={20} />} label="Library" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={18} />
                    <input type="text" placeholder="Search songs..." style={{ background: 'none', border: 'none', color: 'white', outline: 'none' }} />
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, icon, label }) => (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-dim)'}>
        {icon}
        <span style={{ fontWeight: '500' }}>{label}</span>
    </Link>
);

export default Navbar;
