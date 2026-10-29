import React, { useState, useEffect } from 'react';
import { Database, Download, History, RotateCcw, Wrench } from 'lucide-react';
import { BackupDto } from '../types/api.types';
import { ApiClient } from '../services/api.client';
import { ToastService } from '../services/toast.service';
import { Pagination } from '../components/Pagination';

export const BackupsView: React.FC = () => {
  const [backups, setBackups] = useState<BackupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadBackups = async () => {
    try {
      const data = await ApiClient.getBackups();
      setBackups(data);
    } catch (e: any) { ToastService.error(e.message); }
  };

  useEffect(() => { loadBackups(); }, []);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await ApiClient.createBackup();
      ToastService.success('Copia de seguridad creada correctamente.');
      loadBackups();
    } catch (e: any) { ToastService.error(e.message); } finally { setLoading(false); }
  };

  const handleRestore = async (filename: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas rebobinar la base de datos al snapshot "${filename}"? Esta acción reemplazará los datos actuales.`)) return;
    setLoading(true);
    try {
      await ApiClient.restoreBackup(filename);
      ToastService.success('Base de datos restaurada correctamente.');
      loadBackups();
    } catch (e: any) { ToastService.error(e.message); } finally { setLoading(false); }
  };

  const handleDefrag = async () => {
    try {
      await ApiClient.defragment();
      ToastService.success('Base de datos desfragmentada y optimizada.');
    } catch (e: any) { ToastService.error(e.message); }
  };

  const totalPages = Math.ceil(backups.length / pageSize) || 1;
  const paginatedBackups = backups.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Mantenimiento y Respaldo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Copias de seguridad automáticas, exportación y restauración de datos</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" disabled={loading} onClick={handleCreateBackup}><Database size={16} /> Crear Respaldo Ahora</button>
          <a href="/api/options/download-database" download="data.db" className="btn btn-secondary"><Download size={16} /> Descargar data.db</a>
          <button className="btn btn-secondary" onClick={handleDefrag} title="Ejecutar VACUUM"><Wrench size={16} /> Optimizar</button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} /> Historial de Copias de Seguridad (Snapshots)
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead><tr><th>Archivo</th><th>Fecha y Hora</th><th>Tamaño</th><th style={{ width: '130px' }}>Acción</th></tr></thead>
            <tbody>
              {paginatedBackups.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay respaldos disponibles.</td></tr>
              ) : (
                paginatedBackups.map((b) => (
                  <tr key={b.filename}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{b.filename}</td>
                    <td>{new Date(b.createdAt).toLocaleString()}</td>
                    <td>{(b.size / 1024).toFixed(1)} KB</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem', color: '#0369a1' }} disabled={loading} onClick={() => handleRestore(b.filename)}>
                        <RotateCcw size={14} /> Rebobinar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} totalItems={backups.length} onPageChange={setPage} disabled={loading} />
    </div>
  );
};

