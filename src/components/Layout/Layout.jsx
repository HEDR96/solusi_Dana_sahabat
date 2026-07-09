import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../context/AppContext';

export function Layout({ title, subtitle, children, actions }) {
  const { sidebarOpen } = useApp();
  return (
    <div>
      <Sidebar />
      <div className={`main-content${!sidebarOpen ? ' collapsed' : ''}`}>
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-content anim-fade-up">
          {actions && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              {actions}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
