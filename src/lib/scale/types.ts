export type ScaleTransport = 'web_serial' | 'qz_tray' | 'tcp';
export type ScaleParity = 'none' | 'even' | 'odd';

export interface ScaleConfig {
  id?: string;
  nickname: string;
  profile_id?: string | null;
  transport: ScaleTransport;
  baud_rate: number;
  data_bits: number;
  parity: ScaleParity;
  stop_bits: number;
  request_byte: number | null;
  frame_regex: string;
  weight_divisor: number;
  unit: 'kg' | 'g';
  decimal_places: number;
  tcp_host?: string | null;
  tcp_port?: number | null;
  qz_port_name?: string | null;
  auto_connect?: boolean;
  is_default?: boolean;
  pdv_input_mode?: 'manual' | 'automatic';
}

export interface ScaleProfile {
  id: string;
  brand: string;
  model: string;
  protocol: string;
  transport: string;
  default_baud_rate: number;
  data_bits: number;
  parity: string;
  stop_bits: number;
  request_byte: number | null;
  frame_regex: string;
  weight_divisor: number;
  default_tcp_port: number | null;
  notes: string | null;
  is_active: boolean;
}

export interface ScaleReading {
  weight: number;
  raw: string;
  rawHex: string;
  stable?: boolean;
  at: number;
}

export interface ScaleDriver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  requestWeight?(): Promise<void>;
  onReading(cb: (r: ScaleReading) => void): void;
  onError(cb: (e: Error) => void): void;
  isConnected(): boolean;
}

export function parseFrame(buffer: string, regexStr: string, divisor: number): number | null {
  try {
    const re = new RegExp(regexStr);
    const m = buffer.match(re);
    if (!m) return null;
    const numStr = m[1] ?? m[2] ?? m[0];
    const n = Number(numStr);
    if (!isFinite(n)) return null;
    return n / (divisor || 1);
  } catch {
    return null;
  }
}

export function toHex(s: string): string {
  return Array.from(s)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}
