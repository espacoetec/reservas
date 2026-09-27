O que é o projeto:
O Espaço ETEC é uma Single Page Application (SPA) desenvolvida para eliminar conflitos e agilizar o processo de reserva de salas e laboratórios de TI entre professores e coordenação pedagógica.

Diferenciais Técnicos:

Zero Custo de Servidor: Arquitetura serverless que utiliza uma Planilha do Google Sheets como banco de dados em tempo real através do Google Apps Script.
Pronto para GitHub Pages: Desenvolvido em HTML5 semântico, Tailwind CSS v3 e JavaScript ES6 Modular, rodando direto no navegador sem necessidade de builds complexos.
Interface Mobile-First: Grade matricial completa para Desktop e exibição compacta em cards verticais para smartphones.
Validação Anticonflito: Impede agendamentos duplicados no mesmo turno, aula e laboratório.
Exportação Excel/Planilhas: Geração nativa com SheetJS em formatos .xlsx e .csv, permitindo visão geral com ou sem as reservas.
Perfis de Acesso: Separação estrita de permissões entre Professores (agendamento e histórico) e Administradores (aprovações, CRUD de cursos/turmas/disciplinas e configurações).
