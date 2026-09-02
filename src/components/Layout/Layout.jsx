import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../context/AppContext';

/**
 * Kop khusus hasil cetak/PDF.
 *
 * Topbar disembunyikan saat mencetak, sehingga PDF yang tersimpan sebelumnya
 * tidak punya judul, nama perusahaan, maupun keterangan kapan dan oleh siapa
 * dicetak — praktis tidak bisa dipertanggungjawabkan saat diarsipkan atau
 * dikirim ke pihak leasing. Diletakkan di Layout agar berlaku untuk semua
 * halaman sekaligus, bukan ditempel satu per satu di tiap laporan.
 */
function PrintHeader({ title, subtitle }) {
  const { settings, currentUser } = useApp();
  const dicetak = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return (
    <div className="print-header">
      <div className="print-header-top">
        <div>
          <p className="print-company">{settings?.companyName || 'FinanceERP'}</p>
          {settings?.address && <p className="print-meta">{settings.address}</p>}
          {(settings?.phone || settings?.email) && (
            <p className="print-meta">
              {[settings.phone, settings.email].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="print-header-right">
          <p className="print-meta">Dicetak: {dicetak}</p>
          {currentUser?.name && <p className="print-meta">Oleh: {currentUser.name}</p>}
        </div>
      </div>
      <div className="print-title-block">
        <p className="print-title">{title}</p>
        {subtitle && <p className="print-meta">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Layout({ title, subtitle, children, actions }) {
  const { sidebarOpen } = useApp();
  return (
    <div>
      <Sidebar />
      <div className={`main-content${!sidebarOpen ? ' collapsed' : ''}`}>
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-content anim-fade-up">
          <PrintHeader title={title} subtitle={subtitle} />
          {actions && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }} className="no-print">
              {actions}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
