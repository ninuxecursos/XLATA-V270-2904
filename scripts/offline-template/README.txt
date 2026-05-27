XLATA PDV OFFLINE
=================

>>> MODO DIRETO: o sistema abre direto no Dashboard / PDV. <<<
>>> Nao ha tela de login, planos, blog ou loja. <<<


COMO USAR
---------
1. Extraia este .zip em uma pasta (ex: C:\XLataPDV)
2. Instale Node.js LTS (https://nodejs.org/) se ainda nao tiver
3. Execute start.bat (Windows) ou ./start.sh (Linux/Mac)
4. O navegador abrira em http://localhost:3939
5. Voce ja entra direto no Dashboard. Use o menu lateral para navegar
   entre PDV, Materiais, Vendas, Compras, Estoque, Fluxo etc.


LICENCA
-------
- Definida em license.json (plan, expires_at, license_key, client_name)
- Quando "expires_at" passar, o sistema mostra "Licenca expirada" e bloqueia
- Para renovar: contate o fornecedor e troque o license.json


DADOS
-----
- Banco SQLite local em data/xlata.db (criado automaticamente)
- Backup: copie a pasta data/ periodicamente para um pendrive / nuvem
- Para resetar tudo: apague data/xlata.db e reinicie


CREDENCIAIS (credentials.json)
------------------------------
Este arquivo guarda apenas o nome do dono da licenca para fins de
identificacao. Nao ha autenticacao por senha nesta versao offline -
o acesso ao PDV e direto.


PROBLEMAS COMUNS
----------------
- "Node.js nao encontrado" -> instale https://nodejs.org/ (versao LTS)
- "Porta 3939 ja em uso" -> feche o outro processo ou reinicie o PC
- Tela em branco -> apague node_modules/ e rode start.bat de novo
- Logs detalhados em start.log


SUPORTE
-------
Logs em start.log (mesma pasta do start.bat).
Em caso de problema, envie esse arquivo para o suporte.
