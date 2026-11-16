# Trip Split

Aplicação web para dividir despesas de viagens em grupo e gerar o acerto final com o menor número de transferências.

## Requisitos

- Node.js 20 ou superior
- npm

## Rodar localmente

Instale as dependências:

```bash
npm install
```

Abra dois terminais na raiz do projeto.

Terminal 1, API:

```bash
npm run server
```

Terminal 2, frontend:

```bash
npm run dev
```

Abra `http://localhost:5173`.

O frontend encaminha `/api` para `http://localhost:3001`. Os dados ficam persistidos em `.data/tripsplit.json`, que não é versionado.

## Cadastro local

Depois de informar e-mail e senha, a conta é criada e a sessão começa imediatamente, sem confirmação por e-mail. O envio de e-mail é usado apenas para redefinir senha; configure `RESEND_API_KEY` e `EMAIL_FROM` conforme `.env.example`. O login com Google permanece oculto até ser configurado.

## API

A API Node fornece:

- Cadastro sem confirmação de e-mail, login, sessão e logout;
- Criação, edição e exclusão de viagens;
- Código de convite e entrada em uma viagem;
- Cadastro e remoção de participantes;
- Criação, edição e exclusão de despesas;
- Validação de pagador, participantes e valores;
- Persistência de pagamentos marcados como pagos;
- Finalização pelo organizador após confirmar todos os pagamentos; os registros ficam disponíveis para consulta e exportação;
- Endpoint de saúde em `GET /api/health`.

## Scripts

```bash
npm run dev       # frontend Vite
npm run server    # API local
npm run build     # build de produção
npm run lint      # validação ESLint
npm test          # testes do cálculo financeiro
```

## Finalizar uma viagem

Na tela de acerto, confirme cada transferência depois de efetuar o pagamento. **Finalizar viagem** abre `/viagem/:tripId/finalizar`, com o resumo e a confirmação do encerramento. Apenas o organizador pode confirmar, depois de registrar despesas e concluir o acerto. A confirmação encerra os convites e bloqueia alterações. A viagem aparece na aba **Finalizadas**, com seu acerto e relatórios preservados.

## Idioma, valores e relatórios

Os formulários de criação, configurações e despesas compartilham os mesmos seletores de data e moeda. O calendário permite escolher mês/ano diretamente, navegar por teclado e usar Hoje/Limpar; a data final respeita a data inicial. Datas continuam armazenadas como `YYYY-MM-DD`, sem conversão de fuso horário. As listas e calendários usam o idioma do navegador e o mesmo padrão visual do site, sem menus nativos do sistema.

O site lê `navigator.languages` automaticamente: português, inglês e espanhol têm traduções completas. Outros idiomas usam inglês como fallback. Valores e datas seguem o locale do navegador; nomes de viagens, pessoas e descrições digitados pelos usuários não são traduzidos. O catálogo está em `src/lib/locales/messages.js`.

A nova despesa usa máscara por centavos: digitar `123456` produz `1.234,56` em português brasileiro ou `1,234.56` em inglês americano. A API recebe o valor decimal, sem separadores. A edição recupera os centavos originais.

**Abrir PDF** abre o relatório em uma nova aba, sem iniciar download; o visualizador do navegador permite salvar ou imprimir. **Copiar texto** coloca o relatório na área de transferência, com confirmação visual. Se a cópia automática não estiver disponível, um diálogo apresenta o texto selecionável para copiar manualmente. Se o navegador bloquear a nova aba, o site orienta a permitir pop-ups.

Os relatórios trazem resumo, pagamentos com situação, saldo original e saldo pendente (descontando transferências confirmadas), e a divisão exata de cada despesa. O PDF utiliza fontes locais Noto Sans, com licença OFL em `public/fonts/OFL.txt`, e pagina automaticamente tabelas e textos longos. Gere exemplos isolados com `node scripts/preview-report.mjs`.

Para conferir o visual com dados fictícios e isolados dos seus registros, execute `node scripts/preview-design.mjs` e abra `http://127.0.0.1:5174`. As credenciais de demonstração aparecem no terminal. Encerre com Ctrl+C.
