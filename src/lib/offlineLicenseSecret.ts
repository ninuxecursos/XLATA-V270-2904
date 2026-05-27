/**
 * Master secret + tipos da licença offline.
 *
 * Esta string é compartilhada literalmente com `xlata-pdv-offline/server.js`
 * dentro do template — qualquer alteração aqui exige regerar o template ZIP.
 *
 * NÃO é "segurança contra atacante avançado"; o objetivo é impedir que o
 * cliente edite a licença com bloco de notas para estender a validade.
 */
export const OFFLINE_LICENSE_MASTER_SECRET =
  'XLATA-OFFLINE-2026::v1::do-not-edit-this-secret-after-first-deploy';

export const MAGIC = 'XLATA1';

export type OfflinePlan = 'essencial' | 'pro';

export interface OfflineLicensePayload {
  plan: OfflinePlan;
  client_name: string;
  license_key: string;
  expires_at: string; // ISO
  generated_at: string; // ISO
  /** Identificador opcional do dispositivo/instalação (futuro lock por host). */
  hardware_id?: string;
}
