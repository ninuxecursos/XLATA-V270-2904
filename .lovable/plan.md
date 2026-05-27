## Correção

Gerar o template offline que está faltando em `public/downloads/`.

### Passos

1. Rodar `bash scripts/build-offline-template.sh` no sandbox. O script:
   - Faz `vite build` com `vite.config.offline.ts` → `dist-offline/`
   - Monta `/tmp/xlata-pdv-offline/` com `scripts/offline-template/` + `dist/` + `start.bat` (CRLF)
   - Zipa em `public/downloads/xlata-pdv-offline-template.zip` (sem `node_modules` — instalado no cliente pelo `start.bat`)

2. Confirmar que o arquivo foi gerado e ver o tamanho final.

3. Nenhum arquivo de código-fonte (`src/**`) será alterado. O único arquivo novo é o ZIP em `public/downloads/`.

Depois disso, o botão **"Gerar e Baixar .zip"** em `/covildomal` vai conseguir buscar o template, injetar a licença/credenciais do cliente e disparar o download.