# Caderno do Campo — página de vendas

Página de vendas (Juca da Mata). Site estático de um arquivo só (`index.html`) + imagem em `assets/`.

## Como está no ar
- Hospedagem: **GitHub Pages** (publica sozinho a cada push na branch `main`).
- Domínio próprio configurado via arquivo `CNAME` + DNS no registrador.

## Como atualizar o texto/site
1. Edite `index.html` (o texto todo, os preços, o FAQ etc. estão nele).
2. Commit e push:
   ```bash
   git add -A && git commit -m "ajuste na copy" && git push
   ```
3. Em ~1 minuto o site atualiza sozinho.

## Rascunhar a copy direto no navegador
Abra o site com `?editar` no fim do endereço (ex.: `https://SEUDOMINIO/?editar`).
Aparece o botão "Editar texto": toque em qualquer texto e escreva por cima.
As mudanças ficam só no seu navegador (rascunho) — depois é só passar o texto final pra fixar no `index.html`.

## Pendências
- Trocar os 4 depoimentos de exemplo por reais (marcados com a etiqueta "Exemplo").
- Definir data real do fim do preço de lançamento (contador em `index.html`, variável `JANELA_MS` / `DATA_FIM`).
- Link real do checkout (botão "Pegar o Caderno", `href="#checkout"`).
- Preencher razão social, CNPJ e contatos de suporte no rodapé.

## Análise do site (painel)
- Painel: `https://jucadamata.com.br/painel.html` (não aparece no Google). Abrir o painel marca o aparelho como administrador: suas visitas não contam nas estatísticas e o site passa a mostrar os botões "Editar texto" e "Painel".
- Ferramentas: Google Analytics 4 (acessos, origem, eventos) e Microsoft Clarity (mapa de calor, gravações). Os IDs ficam em `assets/config.js`; vazio = desligado.
- Só carregam depois do "Aceitar" no aviso de cookies (LGPD). Código em `assets/analytics.js`.
- Eventos: `clique_comprar` (campo `local`), `begin_checkout`, `vsl_play_com_som`, `clique_tarja`, `secao_vista`, `rolagem`, `faq_abrir`.
- UTMs da URL são repassadas pro checkout da Kiwify.
- Para desmarcar um aparelho: botão no painel ou abrir o site com `?sair-admin`.

## Medição própria do painel (anônima, sem cookies)
- O painel (`painel.html`) lê os números de uma planilha Google do Lucas, via um "App da Web" do Google Apps Script.
- O código da planilha fica **fora deste repositório público**, em `JUCA DA MATA/OFERTA/painel-coletor.gs`, porque contém a chave do painel. Nunca publique esse arquivo.
- O site manda os eventos pro endereço em `assets/config.js` → `coletor` (URL que termina em `/exec`). Vazio = medição desligada.
- A chave fica só no navegador de quem administra: abra `painel.html#chave=SUA_CHAVE` uma vez em cada aparelho.
- O que é registrado: visita, origem (UTM ou site de origem), toques com posição relativa ao bloco (mapa de calor), cliques em comprar (por botão), play do vídeo, perguntas abertas, rolagem máxima, tempo e blocos vistos. Sem IP, sem cookie, sem identificador permanente.
- Se trocar o código da planilha: Implantar › Gerenciar implantações › editar › Nova versão (o URL continua o mesmo).
