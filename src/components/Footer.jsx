export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="small muted">
          Submitting a request does not guarantee approval or funding. Mengirim pengajuan tidak
          menjamin persetujuan atau pencairan dana.
        </p>
        <p className="small muted">© {new Date().getFullYear()} Arsheon Group. Seluruh hak dilindungi.</p>
      </div>
    </footer>
  );
}
