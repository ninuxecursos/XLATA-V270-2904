import { ScaleConfig, ScaleDriver } from './types';
import { WebSerialDriver } from './drivers/webSerialDriver';
import { QzTrayDriver } from './drivers/qzTrayDriver';
import { TcpBridgeDriver } from './drivers/tcpBridgeDriver';

export function createDriver(config: ScaleConfig): ScaleDriver {
  switch (config.transport) {
    case 'web_serial': return new WebSerialDriver(config);
    case 'qz_tray': return new QzTrayDriver(config);
    case 'tcp': return new TcpBridgeDriver(config);
    default: throw new Error(`Transporte desconhecido: ${config.transport}`);
  }
}

export { WebSerialDriver, QzTrayDriver, TcpBridgeDriver };
