import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="narrow page">
      <h1>Halaman tidak ditemukan</h1>
      <p className="muted">Alamat yang Anda buka tidak tersedia.</p>
      <Link to="/" className="btn">Kembali ke beranda</Link>
    </section>
  );
}
