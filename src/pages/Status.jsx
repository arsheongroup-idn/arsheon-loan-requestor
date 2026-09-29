import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ConfigNotice from '../components/ConfigNotice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import { isFirebaseConfigured } from '../config/firebase.js';
import {
  beginLookup, lookupKey, normalizeAccessCode, normalizeRequestId, watchStatus,
} from '../services/requestService.js';
import { toFriendlyError } from '../utils/errors.js';
import { formatDate, formatIDR } from '../utils/format.js';

const DESCRIPTIONS = {
  SUBMITTED: 'Pengajuan Anda sudah kami terima.',
  UNDER_REVIEW: 'Tim Arsheon sedang meninjau pengajuan Anda.',
  ACCEPTED: 'Pengajuan Anda diterima untuk tahap berikutnya.',
  CONTACT_REQUIRED: 'Tim Arsheon akan menghubungi Anda melalui kontak yang Anda berikan.',
  AGREEMENT: 'Perjanjian sedang disusun dan ditandatangani.',
  FUNDED: 'Dana telah dicairkan.',
  ACTIVE: 'Pendanaan sedang berjalan.',
  COMPLETED: 'Pendanaan telah selesai.',
  REJECTED: 'Mohon maaf, pengajuan ini tidak dapat dilanjutkan.',
};

export default function Status() {
  const location = useLocation();
  const initial = location.state ?? {};
  const [form, setForm] = useState({ requestId: initial.requestId ?? '', accessCode: initial.accessCode ?? '' });
  const [phase, setPhase] = useState('idle'); // idle | checking | found | error
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const unsub = useRef(null);

  const stop = () => { unsub.current?.(); unsub.current = null; };

  async function lookup(requestId, accessCode) {
    stop();
    setError('');
    if (!normalizeRequestId(requestId) || !normalizeAccessCode(accessCode)) {
      setPhase('error');
      setError('Isi Request ID dan Access Code.');
      return;
    }
    try {
      beginLookup();
      setPhase('checking');
      const key = await lookupKey(requestId, accessCode);
      unsub.current = watchStatus(
        key,
        (value) => {
          if (!value) { setData(null); setPhase('error'); setError(toFriendlyError({ code: 'app/not-found' })); return; }
          setData(value);
          setPhase('found');
        },
        (err) => { setPhase('error'); setError(toFriendlyError(err)); }
      );
    } catch (err) {
      setPhase('error');
      setError(toFriendlyError(err));
    }
  }

  useEffect(() => {
    if (isFirebaseConfigured && initial.requestId && initial.accessCode) lookup(initial.requestId, initial.accessCode);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isFirebaseConfigured) return <ConfigNotice />;

  const onSubmit = (e) => { e.preventDefault(); if (phase !== 'checking') lookup(form.requestId, form.accessCode); };
  const reset = () => { stop(); setData(null); setPhase('idle'); setError(''); setForm({ requestId: '', accessCode: '' }); };

  if (phase === 'found' && data) {
    return (
      <section className="narrow page slide-in" aria-live="polite">
        <div className="row between">
          <h1 className="h-md">Status pengajuan</h1>
          <StatusBadge status={data.status} />
        </div>
        <dl className="card details">
          <div><dt>Request ID</dt><dd className="mono">{data.requestId}</dd></div>
          <div><dt>Nama usaha</dt><dd>{data.businessName}</dd></div>
          <div><dt>Jumlah diajukan</dt><dd>{formatIDR(data.requestedAmount)}</dd></div>
          <div><dt>Tanggal pengajuan</dt><dd>{formatDate(data.createdAt)}</dd></div>
          <div><dt>Status saat ini</dt><dd>{data.status.replace('_', ' ')}</dd></div>
        </dl>
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Perjalanan pengajuan</h3>
          <StatusTimeline status={data.status} descriptions={DESCRIPTIONS} />
        </div>
        <p className="small muted" style={{ marginTop: '1rem' }}>Halaman ini diperbarui otomatis saat status berubah.</p>
        <button type="button" className="btn secondary" onClick={reset}>Cek pengajuan lain</button>
      </section>
    );
  }

  const checking = phase === 'checking';
  return (
    <section className="narrow page fade-in">
      <h1 className="h-md">Cek status pengajuan</h1>
      <p className="muted">Masukkan Request ID dan Access Code yang Anda terima saat mengajukan.</p>
      <form className="card stack" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="requestId">Request ID</label>
          <input id="requestId" className="input mono" placeholder="AR-2026-123456" autoComplete="off" value={form.requestId}
            onChange={(e) => setForm((f) => ({ ...f, requestId: e.target.value }))} disabled={checking} />
        </div>
        <div className="field">
          <label htmlFor="accessCode">Access Code</label>
          <input id="accessCode" className="input mono" autoComplete="off" value={form.accessCode}
            onChange={(e) => setForm((f) => ({ ...f, accessCode: e.target.value }))} disabled={checking} />
        </div>
        {checking && <div className="skeleton" style={{ height: 14 }} aria-hidden="true" />}
        {error && <div className="alert error" role="alert">{error}</div>}
        <button className="btn block" type="submit" disabled={checking} aria-busy={checking}>
          {checking ? 'Memeriksa...' : 'Cek status'}
        </button>
      </form>
    </section>
  );
}
