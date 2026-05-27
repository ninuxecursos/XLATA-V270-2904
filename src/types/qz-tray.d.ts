// Type definitions for QZ Tray
declare namespace qz {
  namespace websocket {
    function connect(): Promise<any>;
    function isActive(): boolean;
  }

  namespace configs {
    function create(printer: string | null): any;
  }

  namespace printers {
    function find(): Promise<string[]>;
  }

  namespace serial {
    function findPorts(): Promise<string[]>;
    function openPort(port: string, opts: any): Promise<any>;
    function closePort(port: string): Promise<any>;
    function sendData(port: string, data: string | Uint8Array): Promise<any>;
    function setSerialCallbacks(cb: (event: any) => void): void;
  }

  function print(config: any, data: any[]): Promise<any>;
}
