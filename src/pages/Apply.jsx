import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigNotice from '../components/ConfigNotice.jsx';
import { isFirebaseConfigured } from '../config/firebase.js';
import { submitRequest } from '../services/requestService.js';
import { toFriendlyError } from '../utils/errors.js';
import { formatIDR } from '../utils/format.js';

const PURPOSES = [
  'Modal kerja',
  'Pembelian stok barang',
  'Pembelian peralatan / mesin',
  'Ekspansi usaha',
  'Renovasi atau sewa tempat usaha',
  'Pemasaran dan promosi',
  'Lainnya',
];

const EMPTY = {
  borrowerName: '', businessName: '', phone: '', email: '', requestedAmount: '',
  purpose: '', businessDescription: '', fundingPlan: '', additionalNotes: '', website: '',
};

function validate(f) {
  const e = {};
  const len = (v) => v.trim().length;
  if (len(f.borrowerName) < 2 || len(f.borrowerName) > 120) e.borrowerName = 'Isi nama lengkap (2–120 karakter).';
  if (len(f.businessName) < 2 || len(f.businessName) > 120) e.businessName = 'Isi nama usaha (2–120 karakter).';
  if (!/^[0-9+ ()-]{8,30}$/.test(f.phone.trim())) e.phone = 'Isi nomor telepon / WhatsApp yang valid, misalnya 0812 3456 7890.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()) || f.email.trim().length > 254) e.email = 'Isi alamat email yang valid.';
  const amount = Number(f.requestedAmount);
  if (!f.requestedAmount || !Number.isFinite(amount) || amount <= 0 || amount > 1e12) e.requestedAmount = 'Isi jumlah dana yang diajukan dalam Rupiah.';
  if (!f.purpose) e.purpose = 'Pilih tujuan penggunaan dana.';
  if (len(f.businessDescription) < 20 || len(f.businessDescription) > 2000) e.businessDescription = 'Jelaskan usaha Anda (minimal 20 karakter, maksimal 2000).';
  if (len(f.fundingPlan) < 20 || len(f.fundingPlan) > 2000) e.fundingPlan = 'Jelaskan rencana penggunaan dana (minimal 20 karakter, maksimal 2000).';
  if (len(f.additionalNotes) > 2000) e.additionalNotes = 'Catatan maksimal 2000 karakter.';
  return e;
}

export default function Apply() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');
  const lock = useRef(false); // blocks double-submit even before React re-renders

  if (!isFirebaseConfigured) return <ConfigNotice />;

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const setAmount = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
    setForm((f) => ({ ...f, requestedAmount: digits }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (lock.current) return;
    setSubmitError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`f-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (form.website) return; // honeypot: real users never fill this field
    lock.current = true;
    setSubmitting(true);
    try {
      setResult(await submitRequest(form));
      setForm(EMPTY);
    } catch (err) {
      setSubmitError(toFriendlyError(err));
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  async function copy(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  }

  if (result) {
    return (
      <section className="narrow page slide-in">
        <h1 className="h-md">Pengajuan berhasil dikirim</h1>
        <p className="muted">
          Simpan dua data berikut. Anda memerlukan keduanya untuk melihat status pengajuan. Access
          Code hanya ditampilkan sekali dan tidak dapat kami tampilkan ulang.
        </p>
        <div className="card credentials" role="status">
          <div>
            <span className="small muted">Request ID</span>
            <strong className="mono">{result.requestId}</strong>
            <button type="button" className="btn secondary small" onClick={() => copy('id', result.requestId)}>
              {copied === 'id' ? 'Tersalin' : 'Salin'}
            </button>
          </div>
          <div>
            <span className="small muted">Access Code</span>
            <strong className="mono">{result.accessCode}</strong>
            <button type="button" className="btn secondary small" onClick={() => copy('code', result.accessCode)}>
              {copied === 'code' ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>
        <div className="row" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="btn" onClick={() => navigate('/status', { state: result })}>
            Cek status sekarang
          </button>
          <button type="button" className="btn secondary" onClick={() => setResult(null)}>
            Kembali ke formulir
          </button>
        </div>
      </section>
    );
  }

  const field = (name, label, control, hint) => (
    <div className="field">
      <label htmlFor={`f-${name}`}>{label}</label>
      {control}
      {hint && !errors[name] && <span className="hint">{hint}</span>}
      {errors[name] && <span className="error-text" id={`e-${name}`}>{errors[name]}</span>}
    </div>
  );
  const aria = (name) => ({
    id: `f-${name}`,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `e-${name}` : undefined,
    disabled: submitting,
  });

  return (
    <section className="narrow page fade-in">
      <h1 className="h-md">Pengajuan dana usaha</h1>
      <p className="muted">Lengkapi data berikut. Semua kolom wajib diisi kecuali catatan tambahan.</p>

      <form className="card stack" onSubmit={onSubmit} noValidate>
        {field('borrowerName', 'Nama lengkap',
          <input className="input" autoComplete="name" value={form.borrowerName} onChange={set('borrowerName')} {...aria('borrowerName')} />)}
        {field('businessName', 'Nama usaha',
          <input className="input" autoComplete="organization" value={form.businessName} onChange={set('businessName')} {...aria('businessName')} />)}
        {field('phone', 'Telepon / WhatsApp',
          <input className="input" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} {...aria('phone')} />)}
        {field('email', 'Email',
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} {...aria('email')} />)}
        {field('requestedAmount', 'Jumlah dana yang diajukan (Rp)',
          <input className="input" inputMode="numeric" value={form.requestedAmount ? new Intl.NumberFormat('id-ID').format(form.requestedAmount) : ''} onChange={setAmount} {...aria('requestedAmount')} />,
          form.requestedAmount ? formatIDR(form.requestedAmount) : 'Contoh: 50.000.000')}
        {field('purpose', 'Tujuan penggunaan dana',
          <select className="select" value={form.purpose} onChange={set('purpose')} {...aria('purpose')}>
            <option value="">Pilih tujuan</option>
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>)}
        {field('businessDescription', 'Deskripsi usaha',
          <textarea className="textarea" value={form.businessDescription} onChange={set('businessDescription')} maxLength={2000} {...aria('businessDescription')} />,
          'Jenis usaha, lama berjalan, dan kondisi saat ini.')}
        {field('fundingPlan', 'Rencana penggunaan dana',
          <textarea className="textarea" value={form.fundingPlan} onChange={set('fundingPlan')} maxLength={2000} {...aria('fundingPlan')} />,
          'Rincian penggunaan dana dan rencana pengembalian.')}
        {field('additionalNotes', 'Catatan tambahan (opsional)',
          <textarea className="textarea" value={form.additionalNotes} onChange={set('additionalNotes')} maxLength={2000} {...aria('additionalNotes')} />)}

        <div className="hp" aria-hidden="true">
          <label>Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
        </div>

        {submitError && <div className="alert error" role="alert">{submitError}</div>}
        <button className="btn block" type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Mengirim...' : 'Kirim pengajuan'}
        </button>
        <p className="small muted">Mengirim pengajuan tidak menjamin persetujuan atau pencairan dana.</p>
      </form>
    </section>
  );
}
