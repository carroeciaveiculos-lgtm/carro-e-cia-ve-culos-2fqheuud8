# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior. Leia C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8\MEMORY_WORK.MD
pra entender o estado do projeto da revenda (pendências 1, 8, 9 e 10 são
as mais recentes, de hoje 16/08).

Pendências que precisam de mim (você deve verificar/agir):
1. Rodar `claude mcp list` e conferir se o Canva já aparece conectado —
   se ainda estiver "Needs authentication", me avisar que preciso rodar
   /mcp e autenticar.
2. Testar o NaPista de ponta a ponta: ligar "Publicar no NaPista" num
   veículo de teste em /admin/portais e conferir se enfileira certo.
3. Perguntar se posso dar `git push` dos 7 commits que já estão prontos
   localmente no projeto da revenda (nada foi enviado ainda).

Pendências que são só minhas, sem ação sua necessária agora:
- Meta Ads MCP continua com token rejeitado (403) — só aviso, não é bug
  seu de resolver.
- Google Ads MCP já está disponível a partir daqui (~/.local/bin), não
  só na pasta original.

Não repita a investigação de integridade de migrations nem a
correção de segurança — já foi tudo feito e documentado no
MEMORY_WORK.MD.
```

Depois de usar, pode apagar este arquivo ou atualizar pra próxima vez.
