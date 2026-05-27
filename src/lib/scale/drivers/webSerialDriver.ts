import { ScaleConfig, ScaleDriver, ScaleReading, parseFrame, toHex } from '../types';

declare global {
  interface Navigator {
    serial?: any;
  }
}

export class WebSerialDriver implements ScaleDriver {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private buffer = '';
  private connected = false;
  private readingCb: ((r: ScaleReading) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;
  private abort = false;

  constructor(private config: ScaleConfig) {}

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.serial;
  }

  async connect(): Promise<void> {
    if (!WebSerialDriver.isSupported()) {
      throw new Error('Web Serial API não suportada neste navegador. Use Chrome, Edge ou Opera (HTTPS).');
    }
    this.port = await navigator.serial!.requestPort();
    await this.port.open({
      baudRate: this.config.baud_rate,
      dataBits: this.config.data_bits,
      stopBits: this.config.stop_bits,
      parity: this.config.parity,
    });
    this.connected = true;
    this.abort = false;
    this.writer = this.port.writable?.getWriter();
    this.readLoop();
  }

  private async readLoop() {
    try {
      while (this.port?.readable && !this.abort) {
        this.reader = this.port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            const chunk = new TextDecoder('latin1').decode(value);
            this.buffer += chunk;
            if (this.buffer.length > 4096) this.buffer = this.buffer.slice(-2048);
            this.tryParse();
          }
        } catch (e: any) {
          this.errorCb?.(e);
        } finally {
          this.reader?.releaseLock();
        }
      }
    } catch (e: any) {
      this.errorCb?.(e);
    }
  }

  private tryParse() {
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
  }

  async requestWeight(): Promise<void> {
    if (!this.writer || this.config.request_byte == null) return;
    await this.writer.write(new Uint8Array([this.config.request_byte]));
  }

  async disconnect(): Promise<void> {
    this.abort = true;
    this.connected = false;
    try { await this.reader?.cancel(); } catch {}
    try { this.writer?.releaseLock(); } catch {}
    try { await this.port?.close(); } catch {}
    this.port = null;
  }

  onReading(cb: (r: ScaleReading) => void) { this.readingCb = cb; }
  onError(cb: (e: Error) => void) { this.errorCb = cb; }
  isConnected() { return this.connected; }
}
