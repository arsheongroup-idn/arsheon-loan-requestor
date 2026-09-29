// Maps technical errors to safe, user-facing messages. Internal details are never shown.
export function toFriendlyError(err) {
  const code = String(err?.code ?? '').toLowerCase();
  if (code === 'app/not-configured') return 'Layanan belum dikonfigurasi. Silakan hubungi Arsheon Group.';
  if (code === 'app/rate-limited') return err.message;
  if (code === 'app/not-found') return 'Request ID atau Access Code tidak cocok. Periksa kembali data Anda.';
  if (code.includes('permission') || code.includes('unauthorized')) return 'Permintaan ditolak. Silakan coba lagi nanti.';
  if (code.includes('network') || code.includes('unavailable') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 'Koneksi internet bermasalah. Periksa koneksi Anda lalu coba lagi.';
  }
  return 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
}
