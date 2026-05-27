import { ScaleConfig, ScaleDriver, ScaleReading, parseFrame, toHex } from '../types';
import { loadQzTray } from '@/utils/qzTrayLoader';

export class QzTrayDriver implements ScaleDriver {
  private connected = false;
  private buffer = '';
  private readingCb: ((r: ScaleReading) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;

  constructor(private config: ScaleConfig) {}

  static async listPorts(): Promise<string[]> {
    await loadQzTray();
    const qz = (window as any).qz;
    if (!qz?.websocket?.isActive()) await qz.websocket.connect();
    return await qz.serial.findPorts();
  }

  async connect(): Promise<void> {
    await loadQzTray();
    const qz = (window as any).qz;
    if (!qz?.serial) throw new Error('QZ Tray não suporta serial nesta instalação.');
    if (!qz.websocket.isActive()) await qz.websocket.connect();

    if (!this.config.qz_port_name) throw new Error('Porta QZ Tray não configurada.');

    const opts = {
      baudRate: this.config.baud_rate,
      dataBits: this.config.data_bits,
      stopBits: this.config.stop_bits,
      parity: this.config.parity.toUpperCase(),
      flowControl: 'NONE',
    };

    qz.serial.setSerialCallbacks((evt: any) => {
      if (evt.type === 'ERROR') {
        this.errorCb?.(new Error(evt.exception?.message || 'Erro QZ Tray'));
        return;
      }
      const data: string = evt.output ?? '';
      this.buffer += data;
      if (this.buffer.length > 4096) this.buffer = this.buffer.slice(-2048);
      const w = parseFrame(this.buffer, this.config.frame_regex, this.config.weight_divisor);
      if (w !== null) {
        this.readingCb?.({
          weight: w,
          raw: this.buffer.slice(-64),
          rawHex: toHex(this.buffer.slice(-32)),
          at: Date.now(),
        });
        this.buffer = '';
      }
    });

    await qz.serial.openPort(this.config.qz_port_name, opts);
    this.connected = true;
  }

  async requestWeight(): Promise<void> {
    if (this.config.request_byte == null || !this.config.qz_port_name) return;
    const qz = (window as any).qz;
    await qz.serial.sendData(this.config.qz_port_name, String.fromCharCode(this.config.request_byte));
  }

  async disconnect(): Promise<void> {
    const qz = (window as any).qz;
    try { if (this.config.qz_port_name) await qz?.serial?.closePort(this.config.qz_port_name); } catch {}
    this.connected = false;
  }

  onReading(cb: (r: ScaleReading) => void) { this.readingCb = cb; }
  onError(cb: (e: Error) => void) { this.errorCb = cb; }
  isConnected() { return this.connected; }
}
