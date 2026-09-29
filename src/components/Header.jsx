import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Arsheon Loan Request — beranda">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>
            <strong>ARSHEON GROUP</strong>
            <small>Loan Request</small>
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="row">
          <NavLink to="/status" className="nav-link">Cek Status</NavLink>
          <Link to="/apply" className="btn small">Ajukan</Link>
        </nav>
      </div>
    </header>
  );
}
