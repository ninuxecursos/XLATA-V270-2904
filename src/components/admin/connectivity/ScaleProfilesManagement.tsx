import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Cable, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id?: string;
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

const EMPTY: Profile = {
  brand: '', model: '', protocol: 'generic_enq', transport: 'serial',
  default_baud_rate: 9600, data_bits: 8, parity: 'none', stop_bits: 1,
  request_byte: 5, frame_regex: '\\x02(\\d{6})\\x03', weight_divisor: 1000,
  default_tcp_port: null, notes: '', is_active: true,
};

export default function ScaleProfilesManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [testFrame, setTestFrame] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('scale_profiles').select('*').order('brand').order('model');
    setProfiles((data || []) as any);
  }

  function startNew() { setEditing({ ...EMPTY }); setOpen(true); }
  function startEdit(p: Profile) { setEditing({ ...p }); setOpen(true); }

  async function save() {
    if (!editing) return;
    if (!editing.brand || !editing.model) { toast({ title: 'Marca e modelo obrigatórios', variant: 'destructive' }); return; }
    const payload = { ...editing };
    const { error } = editing.id
      ? await supabase.from('scale_profiles').update(payload).eq('id', editing.id)
      : await supabase.from('scale_profiles').insert(payload);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Salvo' });
    setOpen(false); load();
  }

  async function toggleActive(p: Profile) {
    await supabase.from('scale_profiles').update({ is_active: !p.is_active }).eq('id', p.id!);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Remover este perfil?')) return;
    await supabase.from('scale_profiles').delete().eq('id', id);
    load();
  }

  const previewWeight = (() => {
    if (!editing || !testFrame) return null;
    try {
      // Permite \x02 etc no input
      const decoded = testFrame.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const re = new RegExp(editing.frame_regex);
      const m = decoded.match(re);
      if (!m) return 'sem match';
      const n = Number(m[1] ?? m[2] ?? m[0]);
      return `${(n / (editing.weight_divisor || 1)).toFixed(3)} kg`;
    } catch (e: any) { return `erro: ${e.message}`; }
  })();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Cable className="w-5 h-5" /> Perfis de Balança</CardTitle>
            <Button onClick={startNew}><Plus className="w-4 h-4 mr-2" />Novo perfil</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {p.brand} — {p.model}
                    {!p.is_active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.protocol} · {p.transport} · {p.default_baud_rate} baud · ENQ={p.request_byte ?? '—'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id!)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {profiles.length === 0 && <p className="text-sm text-muted-foreground">Nenhum perfil cadastrado.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Referência rápida de protocolos</CardTitle></CardHeader>
        <CardContent className="text-xs space-y-1 text-muted-foreground">
          <div><b>toledo_p1:</b> ENQ (0x05) → STX + 6 dígitos (gramas) + ETX. Toledo, Filizola, Elgin.</div>
          <div><b>urano_ik:</b> ENQ → "IkX.XXX" em kg.</div>
          <div><b>welmy_ascii:</b> Modo contínuo "X.XXX kg" + CR/LF.</div>
          <div><b>generic_continuous:</b> Sem byte de requisição, balança envia peso continuamente.</div>
          <div className="pt-2"><b>Padrões seriais:</b> 9600/8/N/1 (Toledo) ou 4800/8/N/1 (algumas Filizola).</div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar' : 'Novo'} perfil</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
                <div><Label>Modelo</Label><Input value={editing.model} onChange={(e) => setEditing({ ...editing, model: e.target.value })} /></div>
                <div>
                  <Label>Protocolo</Label>
                  <Select value={editing.protocol} onValueChange={(v) => setEditing({ ...editing, protocol: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['toledo_p1', 'toledo_p2', 'urano_ik', 'welmy_ascii', 'generic_enq', 'generic_continuous', 'custom'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transporte</Label>
                  <Select value={editing.transport} onValueChange={(v) => setEditing({ ...editing, transport: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serial">Serial / USB</SelectItem>
                      <SelectItem value="tcp">TCP/IP</SelectItem>
                      <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Baud rate</Label><Input type="number" value={editing.default_baud_rate} onChange={(e) => setEditing({ ...editing, default_baud_rate: Number(e.target.value) })} /></div>
                <div><Label>Data bits</Label><Input type="number" value={editing.data_bits} onChange={(e) => setEditing({ ...editing, data_bits: Number(e.target.value) })} /></div>
                <div>
                  <Label>Paridade</Label>
                  <Select value={editing.parity} onValueChange={(v) => setEditing({ ...editing, parity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">none</SelectItem><SelectItem value="even">even</SelectItem><SelectItem value="odd">odd</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Stop bits</Label><Input type="number" value={editing.stop_bits} onChange={(e) => setEditing({ ...editing, stop_bits: Number(e.target.value) })} /></div>
                <div><Label>Byte de requisição (decimal)</Label><Input type="number" value={editing.request_byte ?? ''} onChange={(e) => setEditing({ ...editing, request_byte: e.target.value === '' ? null : Number(e.target.value) })} /></div>
                <div><Label>Divisor</Label><Input type="number" value={editing.weight_divisor} onChange={(e) => setEditing({ ...editing, weight_divisor: Number(e.target.value) })} /></div>
                <div><Label>Porta TCP padrão</Label><Input type="number" value={editing.default_tcp_port ?? ''} onChange={(e) => setEditing({ ...editing, default_tcp_port: e.target.value === '' ? null : Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Regex de leitura</Label>
                <Input value={editing.frame_regex} onChange={(e) => setEditing({ ...editing, frame_regex: e.target.value })} className="font-mono" />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
              <div className="border-t pt-3">
                <Label>Pré-visualizar regex (cole um frame de exemplo, use \x02 etc)</Label>
                <Input value={testFrame} onChange={(e) => setTestFrame(e.target.value)} className="font-mono" placeholder="\x02001234\x03" />
                {testFrame && <div className="text-xs mt-1">Resultado: <b>{previewWeight}</b></div>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}><Save className="w-4 h-4 mr-2" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
