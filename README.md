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
