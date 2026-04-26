# POC - Auditoria Continua de Acessibilidade Web

POC funcional em Node.js + TypeScript para validar viabilidade tecnica de auditoria automatizada de acessibilidade.

## O que faz

- Recebe uma URL via CLI.
- Executa auditoria com:
  - Lighthouse (categoria accessibility)
  - axe-core via Playwright
  - W3C Nu Validator (opcional, quando a API estiver acessivel)
- Detecta tecnologias assistivas brasileiras:
  - VLibras
  - Hand Talk
- Consolida achados em um unico objeto estruturado com:
  - severidade normalizada
  - mapeamento simplificado eMAG
  - recomendacoes resumidas
- Gera saida:
  - JSON (`report.json`)
  - HTML simples (`report.html`)
  - resumo legivel no terminal

## Requisitos

- Node.js 20+

## Instalacao

```bash
npm install
npx playwright install chromium
```

## Uso

```bash
npm run audit -- https://exemplo.com
```

Opcoes:

- `--no-w3c` desativa validacao W3C
- `--json ./saida/meu-relatorio.json` altera caminho do JSON
- `--html ./saida/meu-relatorio.html` altera caminho do HTML

Exemplo completo:

```bash
npm run audit -- https://www.gov.br --json ./report-gov.json --html ./report-gov.html
```

## Estrutura

```text
src/
  auditors/
    axe-auditor.ts
    lighthouse-auditor.ts
    w3c-auditor.ts
  config/
    emag-mapping.ts
    enrichment.ts
  detectors/
    assistive-tech-detector.ts
  reporters/
    html-reporter.ts
    json-reporter.ts
    terminal-reporter.ts
  consolidator.ts
  index.ts
  types.ts
```

## Observacoes

- O mapeamento eMAG desta POC e simplificado por palavras-chave.
- Para uso produtivo, recomenda-se evoluir para mapeamento formal por regra WCAG/eMAG e incorporar historico para auditoria continua.
