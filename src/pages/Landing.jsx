import { Link } from 'react-router-dom';

const STEPS = [
  ['Submit Request', 'Isi formulir pengajuan dana usaha Anda.'],
  ['Arsheon Review', 'Tim Arsheon meninjau pengajuan Anda.'],
  ['Decision', 'Anda mendapat keputusan atas pengajuan.'],
  ['Contact', 'Tim kami menghubungi Anda untuk tahap lanjutan.'],
  ['Agreement', 'Kesepakatan disusun dan ditandatangani bersama.'],
];

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container fade-in">
          <p className="hero-kicker">ARSHEON LOAN REQUEST</p>
          <h1>AJUKAN KEBUTUHAN DANA USAHA ANDA</h1>
          <p className="hero-sub">
            Ajukan kebutuhan dana usaha secara terstruktur dan pantau status pengajuan Anda melalui
            Arsheon Loan Request.
          </p>
          <div className="row hero-cta">
            <Link to="/apply" className="btn">MULAI AJUKAN PINJAMAN DANA USAHA</Link>
            <Link to="/status" className="btn secondary">CEK STATUS PENGAJUAN</Link>
          </div>
        </div>
      </section>

      <section className="container page" aria-labelledby="how">
        <h2 id="how">HOW IT WORKS</h2>
        <ol className="steps">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card flat">
              <span className="step-no">{String(i + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p className="muted small">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container page">
        <div className="card notice">
          <p>
            <strong>Submitting a request does not guarantee approval or funding.</strong>
          </p>
          <p className="muted small">
            Mengirim pengajuan tidak menjamin persetujuan atau pencairan dana. Setiap pengajuan
            ditinjau secara individual oleh Arsheon Group.
          </p>
        </div>
      </section>
    </>
  );
}
