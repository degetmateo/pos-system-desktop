import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { WhatsappStatusDto } from '../../types/whatsapp.types';

interface WhatsappQrPanelProps {
  statusInfo: WhatsappStatusDto;
  onConnect: () => void;
}

export const WhatsappQrPanel: React.FC<WhatsappQrPanelProps> = ({ statusInfo, onConnect }) => {
  const isConnecting = statusInfo.status === 'connecting';
  const hasQr = statusInfo.status === 'qr_ready' && Boolean(statusInfo.qr);

  return (
    <div className="wa-qr-wrapper">
      <div className="wa-qr-card">
        <div className="wa-qr-instructions">
          <div className="wa-badge-official">
            <Smartphone size={16} /> WhatsApp
          </div>
          <h2>Usá WhatsApp integrado en RD POS</h2>
          <p className="wa-qr-subtitle">
            Vinculá el teléfono de la librería para atender clientes, enviar presupuestos, imágenes de órdenes y comprobantes PDF sin salir del sistema.
          </p>

          <ol className="wa-qr-steps">
            <li>Abrí <strong>WhatsApp</strong> en el teléfono del negocio.</li>
            <li>Tocá <strong>Menú (⋮)</strong> en Android o <strong>Configuración</strong> en iPhone y seleccioná <strong>Dispositivos vinculados</strong>.</li>
            <li>Tocá <strong>Vincular un dispositivo</strong>.</li>
            <li>Apuntá la cámara de tu teléfono hacia el código QR de esta pantalla.</li>
          </ol>

          <div className="wa-qr-security">
            <ShieldCheck size={16} color="#00a884" />
            <span>Tus chats y credenciales se almacenan localmente en este equipo.</span>
          </div>
        </div>

        <div className="wa-qr-box-area">
          {hasQr && statusInfo.qr ? (
            <div className="wa-qr-frame">
              <QRCodeSVG value={statusInfo.qr} size={236} level="M" includeMargin={false} />
            </div>
          ) : isConnecting ? (
            <div className="wa-qr-placeholder">
              <Loader2 size={44} className="wa-spin" color="#00a884" />
              <span>Generando código QR seguro...</span>
            </div>
          ) : (
            <div className="wa-qr-placeholder">
              <Smartphone size={44} color="#64748b" />
              <span>Sesión desconectada</span>
              <button type="button" className="btn wa-btn-green" onClick={onConnect}>
                <RefreshCw size={16} /> Generar Código QR
              </button>
            </div>
          )}

          {hasQr && (
            <span className="wa-qr-caption">
              El código QR se actualiza automáticamente cada pocos segundos.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

