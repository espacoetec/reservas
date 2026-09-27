// ============================================================
// export-service.js
// Exportação de dados do calendário para Excel (.xlsx) e CSV
// Formatação fidedigna à grade visual do calendário online
// ============================================================

import { SCHEDULE_CONFIG, STATUS_CONFIG, getDisciplinaSigla } from './schedule-config.js';
import { formatDateBR, formatDateISO, getDayName, getWeekDates } from './utils.js';
import { getLaboratorios, getCursos, getDisciplinas, getReservasSemana, normalizeDate } from './sheet-service.js';
import { showToast, showLoader, openModal, closeModal } from './ui-helpers.js';
import { getCurrentDate, getCurrentTurno } from './calendar-view.js';
import { isAdmin } from './auth.js';
import { getSheetApiUrl, isApiConfigured } from './sheet-config.js';

/**
 * Inicializa os controles e eventos de exportação de planilha
 */
export function initExportService() {
    setupExportEventListeners();
}

/**
 * Configura listeners dos botões de exportação e do modal
 */
function setupExportEventListeners() {
    // Botão na barra de controles do calendário
    document.getElementById('admin-export-calendar-btn')?.addEventListener('click', () => {
        openExportModal();
    });

    // Botão no painel administrativo
    document.getElementById('admin-export-panel-btn')?.addEventListener('click', () => {
        openExportModal();
    });

    // Botão de confirmação de download dentro do modal
    document.getElementById('confirm-export-calendar-btn')?.addEventListener('click', async () => {
        await handleExportSubmit();
    });

    // Botão de abrir no Google Planilhas
    document.getElementById('open-in-google-sheets-btn')?.addEventListener('click', () => {
        handleOpenGoogleSheets();
    });

    // Fechar ao clicar no backdrop
    document.getElementById('export-calendar-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'export-calendar-modal' || e.target.classList.contains('modal-backdrop')) {
            closeModal('export-calendar-modal');
        }
    });

    // Feedback visual ao alternar opções de radio no modal
    document.querySelectorAll('#export-calendar-modal input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateModalRadioVisuals();
        });
    });
}

/**
 * Atualiza o estilo dos cartões de seleção no modal de exportação
 */
function updateModalRadioVisuals() {
    ['export-mode', 'export-scope', 'export-format'].forEach(groupName => {
        const checked = document.querySelector(`input[name="${groupName}"]:checked`);
        document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
            const card = r.closest('label');
            if (!card) return;
            if (r === checked) {
                card.classList.add('border-indigo-600', 'bg-indigo-50/50');
                card.classList.remove('border-gray-200');
            } else {
                card.classList.remove('border-indigo-600', 'bg-indigo-50/50');
                card.classList.add('border-gray-200');
            }
        });
    });
}

/**
 * Abre o modal de exportação com os dados do calendário atual preenchidos
 */
export function openExportModal() {
    if (!isAdmin()) {
        showToast('Apenas administradores podem exportar a grade de agendamentos.', 'warning');
        return;
    }

    const curDate = getCurrentDate() || new Date();
    const curTurno = getCurrentTurno() || 'noite';

    // Atualiza label do dia atual
    const dayLabelEl = document.getElementById('export-current-day-label');
    if (dayLabelEl) {
        dayLabelEl.textContent = `${getDayName(curDate)}, ${formatDateBR(curDate)}`;
    }

    // Atualiza label da semana atual (Segunda a Sexta)
    const weekLabelEl = document.getElementById('export-current-week-label');
    if (weekLabelEl) {
        const weekDates = getWeekDates(curDate);
        if (weekDates.length >= 5) {
            weekLabelEl.textContent = `${formatDateBR(weekDates[0])} a ${formatDateBR(weekDates[4])}`;
        }
    }

    // Atualiza label do turno atual
    const turnoAtualEl = document.getElementById('export-turno-atual-label');
    if (turnoAtualEl) {
        const tCfg = SCHEDULE_CONFIG[curTurno];
        turnoAtualEl.textContent = `${tCfg?.icon || '🌙'} ${tCfg?.label || 'Atual'}`;
    }

    updateModalRadioVisuals();
    openModal('export-calendar-modal');
}

/**
 * Processa a submissão e dispara o download da planilha
 */
async function handleExportSubmit() {
    if (!isAdmin()) {
        showToast('Apenas administradores podem exportar a planilha.', 'warning');
        return;
    }

    const mode = document.querySelector('input[name="export-mode"]:checked')?.value || 'com-reservas';
    const scope = document.querySelector('input[name="export-scope"]:checked')?.value || 'dia';
    const turnoOption = document.querySelector('input[name="export-turno"]:checked')?.value || 'atual';
    const format = document.querySelector('input[name="export-format"]:checked')?.value || 'xlsx';

    const curDate = getCurrentDate() || new Date();
    const curTurno = getCurrentTurno() || 'noite';

    const selectedTurno = turnoOption === 'atual' ? curTurno : turnoOption;

    try {
        showLoader(true, 'Gerando planilha formatada do calendário...');
        await generateAndDownloadSpreadsheet({
            mode,
            scope,
            turno: selectedTurno,
            date: curDate,
            format
        });
        closeModal('export-calendar-modal');
    } catch (err) {
        console.error('Erro ao gerar planilha:', err);
        showToast('Erro ao exportar planilha: ' + (err.message || err), 'error');
    } finally {
        showLoader(false);
    }
}

/**
 * Abre o Google Planilhas para importação
 */
function handleOpenGoogleSheets() {
    window.open('https://sheets.new', '_blank');
    showToast('Dica: No Google Sheets, clique em Arquivo > Importar > Fazer upload para abrir a planilha gerada.', 'info', 7000);
}

/**
 * Normaliza os dados para exibição do card exatamente como no calendário web
 */
function getReservaCardData(reserva, cursosCache = [], disciplinasCache = []) {
    if (!reserva) return null;

    let displayCursoNome = reserva.cursoNome || '';
    let displayCursoSigla = reserva.cursoSigla || '';

    if (!displayCursoNome && reserva.cursoId && cursosCache.length > 0) {
        const cObj = cursosCache.find(c => String(c.id) === String(reserva.cursoId));
        if (cObj) {
            displayCursoNome = cObj.nome || '';
            if (!displayCursoSigla) displayCursoSigla = cObj.sigla || '';
        }
    }

    if (!displayCursoNome) {
        displayCursoNome = reserva.turmaNome || reserva.turma || 'Sem curso';
    }

    const professorNome = reserva.professorNome || 'Sem professor';

    let discSigla = reserva.disciplinaSigla || '';
    const rawDisc = reserva.disciplinaNome || reserva.disciplina || '';
    if (!discSigla && rawDisc) {
        const discObj = disciplinasCache.find(d =>
            d.nome?.toLowerCase().trim() === rawDisc.toLowerCase().trim() ||
            String(d.id) === String(rawDisc)
        );
        discSigla = discObj?.sigla || getDisciplinaSigla(rawDisc);
    }

    return {
        cursoNome: displayCursoNome,
        cursoSigla: displayCursoSigla,
        professorNome,
        disciplinaSigla: discSigla || rawDisc,
        status: reserva.status || 'confirmado'
    };
}

/**
 * Formata o conteúdo textual da célula da reserva (estilo Card visual do calendário)
 */
function formatCellCard(card, mode) {
    if (mode === 'sem-reservas') {
        return 'Disponível';
    }
    if (!card) {
        return '🟢 Disponível';
    }

    const lines = [];

    // Indicador de status se não for confirmado
    if (card.status === 'pendente') {
        lines.push('🟠 [PENDENTE]');
    } else if (card.status === 'manutencao') {
        lines.push('🔴 [MANUTENÇÃO]');
    }

    // Linha 1: Curso / Identificação
    if (card.cursoNome) {
        lines.push(`🎓 ${card.cursoNome}`);
    }

    // Linha 2: Professor Solicitante
    if (card.professorNome) {
        lines.push(`👤 ${card.professorNome}`);
    }

    // Linha 3: Sigla da Disciplina
    if (card.disciplinaSigla) {
        lines.push(`📖 ${card.disciplinaSigla}`);
    }

    return lines.join('\n');
}

/**
 * Constrói a estrutura completa da Grade do Calendário para um ou mais dias
 * (Com cabeçalhos estilizados, linhas de intervalos e cards de reservas)
 */
function buildCalendarGridData({ dates, turnosList, labs, reservas, mode, cursosList, discList, titlePrefix = '' }) {
    const aoa = [];
    const merges = [];
    const rowHeights = [];
    const totalCols = 1 + labs.length; // Coluna A (Horário) + Laboratórios

    // 1. TÍTULO INSTITUCIONAL SUPERIOR
    aoa.push(['ESPAÇO ETEC — RESERVA DE LABORATÓRIOS · ETEC DR. DOMINGOS MINICUCCI FILHO (UNIDADE 051)']);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: totalCols - 1 } });
    rowHeights.push({ hpt: 26 });

    // 2. SUBTÍTULO COM INFORMAÇÕES DO RELATÓRIO
    const subtitle = mode === 'com-reservas'
        ? `${titlePrefix || 'GRADE DO CALENDÁRIO COM RESERVAS DOS PROFESSORES'} · GERADO EM: ${new Date().toLocaleString('pt-BR')}`
        : `${titlePrefix || 'MODELO DE GRADE HORÁRIA EM BRANCO'} · GERADO EM: ${new Date().toLocaleString('pt-BR')}`;
    aoa.push([subtitle]);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: totalCols - 1 } });
    rowHeights.push({ hpt: 18 });

    // Linha em branco separadora
    aoa.push([]);
    rowHeights.push({ hpt: 10 });

    dates.forEach((d) => {
        const dISO = formatDateISO(d);
        const dBR = formatDateBR(d);
        const dNome = getDayName(d);

        turnosList.forEach(tKey => {
            const tCfg = SCHEDULE_CONFIG[tKey];
            if (!tCfg) return;

            const firstAula = tCfg.aulas[0]?.inicio || '';
            const lastAula = tCfg.aulas[tCfg.aulas.length - 1]?.fim || '';

            // BANNER DO DIA E TURNO (Estilo idêntico ao cabeçalho azul-escuro do calendário web)
            const bannerText = `📅 ${dNome.toUpperCase()}, ${dBR} · TURNO DA ${tCfg.label.toUpperCase()} (${firstAula} às ${lastAula}) · ${labs.length} ${labs.length === 1 ? 'LABORATÓRIO' : 'LABORATÓRIOS'}`;
            aoa.push([bannerText]);
            merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: totalCols - 1 } });
            rowHeights.push({ hpt: 28 });

            // CABEÇALHOS DAS COLUNAS (Horário / Aula + Nome de cada Laboratório e Especificação)
            const colHeaders = [
                'Horário / Aula',
                ...labs.map(l => l.descricao ? `${l.nome}\n(${l.descricao})` : l.nome)
            ];
            aoa.push(colHeaders);
            rowHeights.push({ hpt: 32 });

            // LINHAS DE CADA AULA
            tCfg.aulas.forEach((aula) => {
                // Indicador de Intervalo antes da aula, se configurado no turno
                if (tCfg.intervalo && aula.numero === tCfg.intervalo.aposAula + 1) {
                    const intervaloText = `☕ Intervalo do Turno (${tCfg.intervalo.inicio} às ${tCfg.intervalo.fim})`;
                    const intRow = [intervaloText];
                    for (let i = 0; i < labs.length; i++) {
                        intRow.push(intervaloText);
                    }
                    aoa.push(intRow);
                    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: totalCols - 1 } });
                    rowHeights.push({ hpt: 22 });
                }

                // Célula da esquerda: Horário e Número da Aula
                const aulaLabel = `${aula.numero}ª Aula\n(${aula.inicio} às ${aula.fim})`;
                const row = [aulaLabel];

                // Células de cada laboratório (Cards de Reserva)
                labs.forEach((lab) => {
                    if (mode === 'sem-reservas') {
                        row.push('Livre');
                    } else {
                        const res = reservas.find(r =>
                            String(r.labId) === String(lab.id) &&
                            r.normData === dISO &&
                            r.turno === tKey &&
                            (r.aulas || []).includes(aula.numero)
                        );

                        if (res) {
                            const cardData = getReservaCardData(res, cursosList, discList);
                            row.push(formatCellCard(cardData, mode));
                        } else {
                            row.push('🟢 Disponível');
                        }
                    }
                });

                aoa.push(row);
                // Altura confortável de 55pt para exibir as 3 linhas do card sem corte
                rowHeights.push({ hpt: 55 });
            });

            // Espaçador entre turnos
            aoa.push([]);
            rowHeights.push({ hpt: 12 });
        });

        // Espaçador entre dias
        aoa.push([]);
        rowHeights.push({ hpt: 12 });
    });

    // LEGENDA DE STATUS (Idêntica à barra de legenda do rodapé do calendário online)
    aoa.push(['LEGENDA DE STATUS:   🟣 Confirmada (Aprovada)   |   🟠 Pendente (Aguardando Aprovação)   |   🔴 Manutenção   |   🟢 Disponível para Reserva']);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: totalCols - 1 } });
    rowHeights.push({ hpt: 22 });

    const colWidths = [
        { wch: 18 }, // Coluna A: Horário / Aula
        ...Array(labs.length).fill({ wch: 35 }) // Colunas dos Labs: Largura ideal para nomes de cursos e professores
    ];

    return { aoa, merges, rowHeights, colWidths };
}

/**
 * Constrói tabela detalhada de agendamentos em formato tabular (linha a linha)
 */
function buildReservasTableAOA({ dates, turnosList, labs, reservas, mode, cursosList, discList }) {
    const aoa = [];

    // Cabeçalho da tabela de listagem
    aoa.push([
        'Data',
        'Dia da Semana',
        'Turno',
        'Aula(s)',
        'Laboratório',
        'Professor',
        'Curso',
        'Turma',
        'Disciplina',
        'Sigla',
        'Status',
        'Recursos Extras',
        'Observações',
        'Recorrente'
    ]);

    if (mode === 'sem-reservas') {
        aoa.push(['Nenhuma reserva incluída (Modelo de Grade em Branco).']);
        return aoa;
    }

    const datesISO = dates.map(d => formatDateISO(d));

    // Filtra reservas que pertencem às datas e turnos selecionados
    const filtered = reservas.filter(r =>
        datesISO.includes(r.normData) &&
        turnosList.includes(r.turno)
    );

    // Ordena por data, turno, laboratório e aula
    filtered.sort((a, b) => {
        const dCompare = (a.normData || '').localeCompare(b.normData || '');
        if (dCompare !== 0) return dCompare;
        return (a.labNome || '').localeCompare(b.labNome || '');
    });

    if (filtered.length === 0) {
        aoa.push(['Nenhum agendamento cadastrado para o período selecionado.']);
        return aoa;
    }

    filtered.forEach(r => {
        const dObj = new Date(r.normData + 'T00:00:00');
        const dBR = formatDateBR(dObj);
        const dNome = getDayName(dObj);
        const tLabel = SCHEDULE_CONFIG[r.turno]?.label || r.turno;
        const aulasTexto = (r.aulas || []).map(a => `${a}ª aula`).join(', ') || 'Todas';

        const cardData = getReservaCardData(r, cursosList, discList);

        const statusLabel = {
            confirmado: 'Confirmado',
            pendente: 'Pendente',
            manutencao: 'Manutenção',
            rejeitado: 'Rejeitado'
        }[r.status] || (r.status || 'Confirmado');

        aoa.push([
            dBR,
            dNome,
            tLabel,
            aulasTexto,
            r.labNome || '',
            cardData?.professorNome || r.professorNome || '',
            cardData?.cursoNome || r.cursoNome || '',
            r.turmaNome || r.turma || '',
            r.disciplinaNome || r.disciplina || '',
            cardData?.disciplinaSigla || r.disciplinaSigla || '',
            statusLabel,
            (r.recursos || r.recursosExtras || []).join(', ') || 'Nenhum',
            r.observacoes || '',
            r.recorrente ? 'Sim' : 'Não'
        ]);
    });

    return aoa;
}

/**
 * Cria uma planilha SheetJS configurada com larguras, alturas, mesclagens e quebras de linha
 */
function createStyledWorksheet(XLSX, gridData) {
    const ws = XLSX.utils.aoa_to_sheet(gridData.aoa);

    if (gridData.colWidths) ws['!cols'] = gridData.colWidths;
    if (gridData.rowHeights) ws['!rows'] = gridData.rowHeights;
    if (gridData.merges && gridData.merges.length > 0) ws['!merges'] = gridData.merges;

    // Aplica formatação de quebra de linha (wrapText) e alinhamento em todas as células
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellAddress];
            if (!cell) continue;

            if (!cell.s) cell.s = {};
            cell.s.alignment = {
                wrapText: true,
                vertical: 'center',
                horizontal: C === 0 ? 'center' : 'left'
            };

            // Estilos visuais adicionais (para visualizadores compatíveis com estilos XLSX)
            cell.s.border = {
                top: { style: 'thin', color: { rgb: 'CBD5E1' } },
                bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
                left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            };
        }
    }

    return ws;
}

/**
 * Gera os dados da planilha e dispara o download no formato escolhido
 */
async function generateAndDownloadSpreadsheet({ mode, scope, turno, date, format }) {
    // 1. Carrega dados essenciais em paralelo
    const [allLabs, cursosList, discList] = await Promise.all([
        getLaboratorios(),
        getCursos().catch(() => []),
        getDisciplinas().catch(() => [])
    ]);

    const labs = allLabs.filter(l => l.ativo !== false);
    if (labs.length === 0) {
        throw new Error('Nenhum laboratório ativo encontrado para exportar.');
    }

    // 2. Determina datas do período selecionado
    let dates = [];
    if (scope === 'semana') {
        dates = getWeekDates(date);
    } else {
        dates = [date];
    }

    // 3. Determina turnos
    let turnosList = [];
    if (turno === 'todos') {
        turnosList = ['manha', 'tarde', 'noite'];
    } else {
        turnosList = [turno];
    }

    // 4. Carrega reservas para o período
    const datesISO = dates.map(d => formatDateISO(d));
    const reservas = await getReservasSemana(datesISO);

    const normalizedReservas = (reservas || []).map(r => ({
        ...r,
        normData: normalizeDate(r.data)
    }));

    // 5. Monta a Tabela Detalhada de Agendamentos
    const listAOA = buildReservasTableAOA({
        dates,
        turnosList,
        labs,
        reservas: normalizedReservas,
        mode,
        cursosList,
        discList
    });

    // 6. Define o nome do arquivo gerado
    const prefix = mode === 'com-reservas' ? 'Calendario_Reservas_ETEC' : 'Modelo_Grade_Horaria_ETEC';
    const dateTag = scope === 'semana'
        ? `${formatDateISO(dates[0])}_a_${formatDateISO(dates[dates.length - 1])}`
        : formatDateISO(dates[0]);
    const fileName = `${prefix}_${dateTag}.${format}`;

    // 7. Exportação Excel (.xlsx) com múltiplas abas estilizadas
    if (format === 'xlsx') {
        const XLSX = await ensureXLSX();
        if (XLSX) {
            const wb = XLSX.utils.book_new();

            if (scope === 'semana') {
                // Aba 1: Grade Completa da Semana
                const fullWeekGrid = buildCalendarGridData({
                    dates,
                    turnosList,
                    labs,
                    reservas: normalizedReservas,
                    mode,
                    cursosList,
                    discList,
                    titlePrefix: 'GRADE SEMANAL COMPLETA (SEGUNDA A SEXTA)'
                });
                const wsFullWeek = createStyledWorksheet(XLSX, fullWeekGrid);
                XLSX.utils.book_append_sheet(wb, wsFullWeek, 'Semana_Completa');

                // Abas 2 a 6: Cada dia individual (Segunda, Terça, Quarta, Quinta, Sexta)
                dates.forEach(d => {
                    const dayNameShort = getDayName(d).replace('-feira', '');
                    const dayGrid = buildCalendarGridData({
                        dates: [d],
                        turnosList,
                        labs,
                        reservas: normalizedReservas,
                        mode,
                        cursosList,
                        discList,
                        titlePrefix: `GRADE DE ${getDayName(d).toUpperCase()}`
                    });
                    const wsDay = createStyledWorksheet(XLSX, dayGrid);
                    const tabName = `${dayNameShort} (${formatDateISO(d).substring(8, 10)})`;
                    XLSX.utils.book_append_sheet(wb, wsDay, tabName);
                });
            } else {
                // Modo Dia Único: Aba da Grade do Dia
                const singleDayGrid = buildCalendarGridData({
                    dates,
                    turnosList,
                    labs,
                    reservas: normalizedReservas,
                    mode,
                    cursosList,
                    discList,
                    titlePrefix: `GRADE DE ${getDayName(dates[0]).toUpperCase()} (${formatDateBR(dates[0])})`
                });
                const wsDay = createStyledWorksheet(XLSX, singleDayGrid);
                XLSX.utils.book_append_sheet(wb, wsDay, 'Grade_Calendario');
            }

            // Última Aba: Listagem Analítica de Agendamentos (se com reservas)
            if (mode === 'com-reservas') {
                const wsList = XLSX.utils.aoa_to_sheet(listAOA);
                wsList['!cols'] = [
                    { wch: 12 }, // Data
                    { wch: 14 }, // Dia
                    { wch: 10 }, // Turno
                    { wch: 16 }, // Aulas
                    { wch: 22 }, // Lab
                    { wch: 26 }, // Professor
                    { wch: 26 }, // Curso
                    { wch: 26 }, // Turma
                    { wch: 26 }, // Disciplina
                    { wch: 10 }, // Sigla
                    { wch: 14 }, // Status
                    { wch: 22 }, // Recursos
                    { wch: 32 }, // Observações
                    { wch: 12 }  // Recorrente
                ];
                XLSX.utils.book_append_sheet(wb, wsList, 'Lista_Agendamentos');
            }

            // Dispara download do arquivo Excel formatado
            triggerExcelDownload(XLSX, wb, fileName);
            showToast('Planilha Excel (.xlsx) formatada baixada com sucesso!', 'success');
            return;
        }
    }

    // Fallback para CSV estruturado com UTF-8 BOM
    const gridData = buildCalendarGridData({
        dates,
        turnosList,
        labs,
        reservas: normalizedReservas,
        mode,
        cursosList,
        discList
    });
    exportViaCSV({
        fileName: fileName.replace('.xlsx', '.csv'),
        aoaData: gridData.aoa
    });
    showToast('Planilha CSV compatível com Excel e Google Sheets baixada com sucesso!', 'success');
}

/**
 * Garante que a biblioteca SheetJS esteja carregada e pronta para uso
 */
async function ensureXLSX() {
    if (typeof window.XLSX !== 'undefined') return window.XLSX;

    return new Promise((resolve) => {
        let resolved = false;
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => {
            resolved = true;
            resolve(window.XLSX || null);
        };
        script.onerror = () => {
            const fallback = document.createElement('script');
            fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            fallback.onload = () => {
                resolved = true;
                resolve(window.XLSX || null);
            };
            fallback.onerror = () => {
                resolved = true;
                resolve(null);
            };
            document.head.appendChild(fallback);
        };
        document.head.appendChild(script);

        setTimeout(() => {
            if (!resolved) resolve(window.XLSX || null);
        }, 4000);
    });
}

/**
 * Dispara o download do arquivo Excel (.xlsx) com fallback por Blob
 */
function triggerExcelDownload(XLSX, wb, fileName) {
    try {
        XLSX.writeFile(wb, fileName);
    } catch (writeErr) {
        console.warn('XLSX.writeFile direto falhou, usando download por Blob:', writeErr);
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * Fallback: Exporta para CSV com UTF-8 BOM e delimitador ponto e vírgula
 */
function exportViaCSV({ fileName, aoaData }) {
    const csvContent = aoaData.map(row => {
        return row.map(cell => {
            const text = String(cell ?? '').replace(/"/g, '""');
            return `"${text}"`;
        }).join(';');
    }).join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
