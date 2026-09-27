# 🖥️ Espaço ETEC — Reserva de Laboratórios

> **Sistema Web Moderno e Responsivo para Gestão e Agendamento de Laboratórios de Informática da Escola Técnica Estadual Dr. Domingos Minicucci Filho — ETEC Unidade 051.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript_ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Google Sheets](https://img.shields.io/badge/Google_Sheets_API-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)

---

## 📌 Sobre o Projeto

O **Espaço ETEC** é uma Single Page Application (SPA) desenvolvida para otimizar e organizar o fluxo de agendamentos dos laboratórios de informática da **ETEC Dr. Domingos Minicucci Filho (Unidade 051)**.

O sistema opera de forma **100% serverless**, utilizando uma **Planilha do Google Sheets** como banco de dados em tempo real por meio de uma API leve construída em **Google Apps Script**. Essa arquitetura elimina qualquer custo de hospedagem ou servidor, permitindo que o sistema seja hospedado gratuitamente no **GitHub Pages**.

---

## ✨ Principais Funcionalidades

### 👥 Controle de Acesso por Perfis
- **Perfil Professor:**
  - Consulta da disponibilidade de horários e salas em tempo real.
  - Solicitação de reservas com autopreenchimento dos dados do professor logado.
  - Seleção ágil de aulas por turno (pills com atalho "Todas as Aulas").
  - Opção de reserva recorrente semanal (com data limite).
  - Consulta ao histórico de reservas solicitadas e seus status de aprovação.
- **Perfil Administrador (Coordenação / TI):**
  - Aprovação e rejeição de solicitações de reserva pendentes.
  - Cadastro, edição e desativação (CRUD) de Laboratórios, Cursos, Turmas, Disciplinas e Professores.
  - Apenas administradores têm permissão para criar novos Cursos, Turmas e Disciplinas.
  - Configuração segura da URL de integração da API do Google Sheets.
  - Download e exportação do calendário escolar em formato de planilha.

### 📅 Calendário Interativo e Responsivo
- **Navegação Dia a Dia Consecutiva:** Botões de avanço e retrocesso que percorrem dia após dia, com atalho para o dia atual ("Hoje") e seletor via calendário (*datepicker*).
- **Visão por Turnos:** Alternância imediata entre Manhã, Tarde e Noite com marcação visual dos intervalos de aula.
- **Mobile-First:**
  - **Desktop:** Grade matricial completa (Horários/Aulas × Laboratórios) com indicação de salas livres e ocupadas.
  - **Mobile:** Cards verticais compactos e organizados, garantindo legibilidade e rapidez em smartphones.
- **Identificação Visual por Cores:**
  - 🟣 **Confirmada:** Aprovada e garantida para a aula.
  - 🟠 **Pendente:** Aguardando análise da coordenação.
  - 🔴 **Manutenção:** Laboratório bloqueado temporariamente.
  - 🟢 **Livre:** Disponível para agendamento com 1 clique.

### 🛡️ Validação Anticonflito Automática
- Algoritmo que previne agendamentos duplicados ou sobreposição de horários no mesmo laboratório, turno e data.

### 📥 Exportação para Excel e Google Planilhas
- Recurso exclusivo para a gestão/coordenação escolar:
  - Exportação direta nos formatos **Excel (.xlsx)** e **CSV (UTF-8 BOM)**.
  - Opção de exportação **Com Reservas** (visão geral dos professores e disciplinas) ou **Sem Reservas** (grade em branco para planejamento).
  - Filtro por **Dia Selecionado** ou **Semana Completa (Segunda a Sexta)**.
  - Atalho de integração para visualização imediata no Google Planilhas.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
| :--- | :--- |
| **HTML5 Semântico** | Estrutura acessível e otimizada da aplicação |
| **Tailwind CSS (v3)** | Estilização moderna com design system consistente e responsivo |
| **JavaScript (ES6 Modular)** | Lógica reativa sem necessidade de bundlers ou frameworks pesados |
| **Google Apps Script** | API RESTful que conecta o front-end ao Google Sheets |
| **Google Sheets** | Banco de dados relacional e gratuito |
| **SheetJS (xlsx.full.min.js)** | Geração e download nativo de planilhas Excel (.xlsx) |

---

## 📁 Estrutura de Arquivos

```text
├── index.html                     # Interface principal da SPA
├── iniciar_servidor.bat           # Inicializador rápido do servidor local (Windows)
├── iniciar_servidor.ps1           # Servidor HTTP nativo em PowerShell (porta 8000)
├── css/
│   └── custom.css                 # Animações, tema e estilos complementares
├── js/
│   ├── app.js                     # Inicialização da SPA, roteamento e eventos globais
│   ├── auth.js                    # Autenticação de usuários, perfil e controle de sessão
│   ├── admin-panel.js             # Painel administrativo (aprovações e CRUDs)
│   ├── calendar-view.js           # Renderização e navegação dia a dia do calendário
│   ├── reservation-form.js        # Formulário de reserva, seletores dinâmicos e validações
│   ├── export-service.js          # Exportação do calendário para Excel (.xlsx) e CSV
│   ├── sheet-service.js           # Comunicação com a API do Google Sheets
│   ├── sheet-config.js            # Armazenamento e validação da URL da API
│   ├── schedule-config.js         # Horários dos turnos, matriz de aulas e dados padrão
│   ├── ui-helpers.js              # Modais, toasts e skeletons de carregamento
│   └── utils.js                   # Utilitários de formatação de datas e manipulação de arrays
└── google-apps-script/
    ├── Codigo.gs                  # Código-fonte da API para o Google Apps Script
    └── COMO_CONFIGURAR_A_PLANILHA.md # Manual passo a passo para conectar o Google Sheets
```

---

## 🚀 Como Executar Localmente

Como a aplicação utiliza módulos ES6 (`import`/`export`), os navegadores exigem que os arquivos sejam servidos via protocolo HTTP/HTTPS (e não diretamente com dois cliques via `file://`).

### Opção 1: Usando o executável incluso (Windows)
1. Dê um duplo clique no arquivo **`iniciar_servidor.bat`**.
2. O servidor local em PowerShell será iniciado automaticamente e abrirá o navegador no endereço:
   ```text
   http://localhost:8000/
   ```

### Opção 2: Usando o VS Code
1. Abra a pasta do projeto no **VS Code**.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito sobre o arquivo `index.html` e selecione **"Open with Live Server"**.

---

## ☁️ Como Conectar o Google Sheets (Banco de Dados)

O sistema pode funcionar tanto com a planilha conectada quanto em modo demonstrativo. Para vincular a sua própria planilha do Google:

1. Acesse o [Google Drive](https://drive.google.com) e crie uma nova planilha.
2. Siga as instruções detalhadas contidas em:  
   👉 [**google-apps-script/COMO_CONFIGURAR_A_PLANILHA.md**](google-apps-script/COMO_CONFIGURAR_A_PLANILHA.md).
3. Após obter a URL do Web App gerada no Google Apps Script (`/exec`), faça login como administrador no sistema e clique no botão **"Google Sheets"** no topo da página para salvar a URL.

---

## 🌐 Publicação no GitHub Pages

1. Crie um novo repositório no seu GitHub (exemplo: `espaco-etec-reservas`).
2. Faça o upload ou commit dos arquivos do projeto.
3. No GitHub, acesse: **Settings** > **Pages**.
4. Em **Build and deployment**, selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
5. Clique em **Save**. Em instantes, o seu sistema estará disponível online com HTTPS gratuito!

---

## 👨‍💻 Créditos e Autoria

- **Instituição:** Escola Técnica Estadual Dr. Domingos Minicucci Filho — Unidade: 051
- **Desenvolvedor:** Marco A. Forti
- **Ano:** 2026
