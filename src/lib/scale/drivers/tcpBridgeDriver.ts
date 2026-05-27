import { supabase } from '@/integrations/supabase/client';
import { ScaleConfig, ScaleDriver, ScaleReading, toHex } from '../types';

export class TcpBridgeDriver implements ScaleDriver {
  private connected = false;
  private polling = false;
  private timer: any = null;
  private readingCb: ((r: ScaleReading) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;

  constructor(private config: ScaleConfig) {}

  async connect(): Promise<void> {
    if (!this.config.tcp_host || !this.config.tcp_port) {
      throw new Error('Host e porta TCP são obrigatórios.');
    }
    // Faz uma requisição de teste imediata.
    await this.poll();
    this.connected = true;
    this.polling = true;
    this.timer = setInterval(() => { this.poll().catch((e) => this.errorCb?.(e)); }, 1500);
  }

  async poll(): Promise<void> {
    const { data, error } = await supabase.functions.invoke('scale-tcp-bridge', {
      body: {
        host: this.config.tcp_host,
        port: this.config.tcp_port,
        request_byte: this.config.request_byte,
        timeout_ms: 1200,
        frame_regex: this.config.frame_regex,
        weight_divisor: this.config.weight_divisor,
      },
    });
    if (error) throw new Error(error.message);
    if (data?.success && data.parsed_weight != null) {
      this.readingCb?.({
        weight: data.parsed_weight,
        raw: data.raw ?? '',
        rawHex: toHex(data.raw ?? ''),
        at: Date.now(),
      });
    } else if (data?.error) {
      this.errorCb?.(new Error(data.error));
    }
  }

  async requestWeight(): Promise<void> {
    await this.poll();
  }

  async disconnect(): Promise<void> {
    this.polling = false;
    this.connected = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  onReading(cb: (r: ScaleReading) => void) { this.readingCb = cb; }
  onError(cb: (e: Error) => void) { this.errorCb = cb; }
  isConnected() { return this.connected; }
}
