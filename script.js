// Sistema de Agendamento de Consultas Médicas
// JavaScript principal com todas as funcionalidades

class SistemaAgendamento {
    constructor() {
        this.usuarios = this.carregarDados('usuarios') || [];
        this.especialidades = this.carregarDados('especialidades') || this.inicializarEspecialidades();
        this.medicos = this.carregarDados('medicos') || [];
        this.consultas = this.carregarDados('consultas') || [];
        this.usuarioLogado = this.carregarDados('usuarioLogado') || null;
        this.horariosDisponiveis = this.gerarHorarios();
        
        this.inicializar();
    }

    inicializar() {
        this.setupEventListeners();
        this.inicializarDados();
        this.verificarLogin();
        this.configurarGSAP();
        this.configurarToastify();
    }

    // ==================== GERENCIAMENTO DE DADOS ====================
    
    salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }

    carregarDados(chave) {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : null;
    }

    inicializarEspecialidades() {
        const especialidades = [
            { id: 1, nome: 'Cardiologia', descricao: 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças do coração e sistema cardiovascular.', icone: 'fas fa-heartbeat' },
            { id: 2, nome: 'Dermatologia', descricao: 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças da pele, cabelos e unhas.', icone: 'fas fa-hand-holding-medical' },
            { id: 3, nome: 'Ortopedia', descricao: 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças e lesões dos ossos, articulações e músculos.', icone: 'fas fa-bone' },
            { id: 4, nome: 'Pediatria', descricao: 'Especialidade médica que se ocupa do atendimento médico de bebês, crianças e adolescentes.', icone: 'fas fa-baby' },
            { id: 5, nome: 'Ginecologia', descricao: 'Especialidade médica que se ocupa do sistema reprodutor feminino e suas doenças.', icone: 'fas fa-female' },
            { id: 6, nome: 'Neurologia', descricao: 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças do sistema nervoso.', icone: 'fas fa-brain' },
            { id: 7, nome: 'Oftalmologia', descricao: 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças dos olhos.', icone: 'fas fa-eye' },
            { id: 8, nome: 'Psiquiatria', descricao: 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças mentais.', icone: 'fas fa-head-side-brain' }
        ];
        this.salvarDados('especialidades', especialidades);
        return especialidades;
    }

    gerarHorarios() {
        const horarios = [];
        for (let hora = 8; hora <= 18; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                horarios.push(horaStr);
            }
        }
        return horarios;
    }

    // ==================== GERENCIAMENTO DE USUÁRIOS ====================

    cadastrarUsuario(dados) {
        const usuario = {
            id: Date.now(),
            ...dados,
            dataCadastro: new Date().toISOString()
        };

        this.usuarios.push(usuario);
        this.salvarDados('usuarios', this.usuarios);

        if (dados.tipo === 'medico') {
            this.cadastrarMedico(usuario);
        }

        this.mostrarToast('Usuário cadastrado com sucesso!', 'success');
        return usuario;
    }

    cadastrarMedico(usuario) {
        const medico = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone,
            crm: usuario.crm,
            especialidadeId: usuario.especialidadeId,
            especialidade: this.especialidades.find(esp => esp.id === usuario.especialidadeId)?.nome || '',
            horariosDisponiveis: this.horariosDisponiveis,
            diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
        };

        this.medicos.push(medico);
        this.salvarDados('medicos', this.medicos);
        
        console.log('Médico cadastrado:', medico);
        console.log('Lista de médicos atual:', this.medicos);
    }

    fazerLogin(email, senha, tipo) {
        const usuario = this.usuarios.find(u => 
            u.email === email && u.senha === senha && u.tipo === tipo
        );

        if (usuario) {
            this.usuarioLogado = usuario;
            this.salvarDados('usuarioLogado', this.usuarioLogado);
            this.mostrarToast(`Bem-vindo, ${usuario.nome}!`, 'success');
            this.atualizarInterface();
            return true;
        } else {
            this.mostrarToast('Credenciais inválidas!', 'error');
            return false;
        }
    }

    logout() {
        this.usuarioLogado = null;
        localStorage.removeItem('usuarioLogado');
        this.atualizarInterface();
        this.mostrarToast('Logout realizado com sucesso!', 'info');
    }

    // ==================== GERENCIAMENTO DE CONSULTAS ====================

    agendarConsulta(dados) {
        const consulta = {
            id: Date.now(),
            pacienteId: this.usuarioLogado.id,
            pacienteNome: this.usuarioLogado.nome,
            medicoId: dados.medicoId,
            medicoNome: this.medicos.find(m => m.id === dados.medicoId)?.nome || '',
            especialidadeId: dados.especialidadeId,
            especialidade: this.especialidades.find(esp => esp.id === dados.especialidadeId)?.nome || '',
            data: dados.data,
            horario: dados.horario,
            observacoes: dados.observacoes || '',
            status: 'agendada',
            dataAgendamento: new Date().toISOString()
        };

        this.consultas.push(consulta);
        this.salvarDados('consultas', this.consultas);
        this.mostrarToast('Consulta agendada com sucesso!', 'success');
        
        // Programar notificação de lembrete
        this.programarNotificacao(consulta);
        
        return consulta;
    }

    cancelarConsulta(consultaId) {
        const consulta = this.consultas.find(c => c.id === consultaId);
        if (consulta) {
            consulta.status = 'cancelada';
            consulta.dataCancelamento = new Date().toISOString();
            this.salvarDados('consultas', this.consultas);
            this.mostrarToast('Consulta cancelada com sucesso!', 'warning');
            return true;
        }
        return false;
    }

    reagendarConsulta(consultaId, novaData, novoHorario) {
        const consulta = this.consultas.find(c => c.id === consultaId);
        if (consulta) {
            consulta.data = novaData;
            consulta.horario = novoHorario;
            consulta.status = 'reagendada';
            consulta.dataReagendamento = new Date().toISOString();
            this.salvarDados('consultas', this.consultas);
            this.mostrarToast('Consulta reagendada com sucesso!', 'info');
            return true;
        }
        return false;
    }

    programarNotificacao(consulta) {
        const dataConsulta = new Date(consulta.data + 'T' + consulta.horario);
        const agora = new Date();
        const tempoParaConsulta = dataConsulta.getTime() - agora.getTime();
        
        // Notificar 1 dia antes
        const tempoNotificacao = tempoParaConsulta - (24 * 60 * 60 * 1000);
        
        if (tempoNotificacao > 0) {
            setTimeout(() => {
                this.mostrarToast(
                    `Lembrete: Você tem uma consulta amanhã às ${consulta.horario} com Dr(a). ${consulta.medicoNome}`,
                    'info',
                    10000
                );
            }, tempoNotificacao);
        }
    }

    // ==================== INTERFACE E NAVEGAÇÃO ====================

    setupEventListeners() {
        // Login
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const senha = document.getElementById('loginPassword').value;
            const tipo = document.getElementById('loginTipo').value;
            
            if (this.fazerLogin(email, senha, tipo)) {
                this.fecharModal('loginModal');
            }
        });

        // Cadastro
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const dados = this.coletarDadosCadastro();
            if (dados) {
                this.cadastrarUsuario(dados);
                this.fecharModal('registerModal');
            }
        });

        // Tipo de usuário no cadastro
        document.getElementById('registerTipo')?.addEventListener('change', (e) => {
            const medicoFields = document.getElementById('medicoFields');
            if (e.target.value === 'medico') {
                medicoFields.style.display = 'block';
            } else {
                medicoFields.style.display = 'none';
            }
        });

        // Agendamento
        document.getElementById('agendamentoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const dados = this.coletarDadosAgendamento();
            if (dados) {
                this.agendarConsulta(dados);
                document.getElementById('agendamentoForm').reset();
                this.atualizarConsultasTable();
            }
        });

        // Especialidade no agendamento
        document.getElementById('especialidade')?.addEventListener('change', (e) => {
            this.atualizarMedicos(e.target.value);
        });

        // Médico no agendamento
        document.getElementById('medico')?.addEventListener('change', (e) => {
            this.atualizarHorarios(e.target.value);
            this.atualizarInfoConsulta();
        });

        // Data no agendamento
        document.getElementById('data')?.addEventListener('change', () => {
            this.atualizarInfoConsulta();
        });

        // Horário no agendamento
        document.getElementById('horario')?.addEventListener('change', () => {
            this.atualizarInfoConsulta();
        });
    }

    coletarDadosCadastro() {
        const dados = {
            nome: document.getElementById('registerNome').value,
            email: document.getElementById('registerEmail').value,
            telefone: document.getElementById('registerTelefone').value,
            dataNascimento: document.getElementById('registerDataNascimento').value,
            tipo: document.getElementById('registerTipo').value,
            senha: document.getElementById('registerPassword').value
        };

        if (dados.tipo === 'medico') {
            dados.crm = document.getElementById('registerCRM').value;
            dados.especialidadeId = parseInt(document.getElementById('registerEspecialidade').value);
        }

        return dados;
    }

    coletarDadosAgendamento() {
        const especialidadeId = parseInt(document.getElementById('especialidade').value);
        const medicoId = parseInt(document.getElementById('medico').value);
        const data = document.getElementById('data').value;
        const horario = document.getElementById('horario').value;
        const observacoes = document.getElementById('observacoes').value;

        if (!especialidadeId || !medicoId || !data || !horario) {
            this.mostrarToast('Preencha todos os campos obrigatórios!', 'error');
            return null;
        }

        return {
            especialidadeId,
            medicoId,
            data,
            horario,
            observacoes
        };
    }

    atualizarInterface() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            if (this.usuarioLogado) {
                userNameElement.textContent = this.usuarioLogado.nome;
            } else {
                userNameElement.textContent = 'Usuário';
            }
        }
        
        // Mostrar/ocultar dashboard na página inicial
        const dashboardSection = document.getElementById('dashboard');
        const homeSection = document.getElementById('home');
        
        if (dashboardSection && homeSection) {
            if (this.usuarioLogado) {
                dashboardSection.style.display = 'block';
                homeSection.style.display = 'none';
            } else {
                dashboardSection.style.display = 'none';
                homeSection.style.display = 'block';
            }
        }
    }

    mostrarSecao(secaoId) {
        const secoes = ['home', 'dashboard', 'agendamento', 'consultas', 'doctors', 'specialties'];
        secoes.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.style.display = id === secaoId ? 'block' : 'none';
            }
        });
    }

    verificarLogin() {
        if (this.usuarioLogado) {
            this.atualizarInterface();
        }
    }

    // ==================== ATUALIZAÇÃO DE DADOS ====================

    inicializarDados() {
        this.atualizarEspecialidadesSelect();
        this.atualizarEspecialidadesGrid();
        this.atualizarMedicosGrid();
        this.atualizarConsultasTable();
    }

    atualizarEspecialidadesSelect() {
        const select = document.getElementById('especialidade');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione uma especialidade</option>';
        this.especialidades.forEach(esp => {
            const option = document.createElement('option');
            option.value = esp.id;
            option.textContent = esp.nome;
            select.appendChild(option);
        });

        // No cadastro de médico
        const selectCadastro = document.getElementById('registerEspecialidade');
        if (selectCadastro) {
            selectCadastro.innerHTML = '<option value="">Selecione uma especialidade</option>';
            this.especialidades.forEach(esp => {
                const option = document.createElement('option');
                option.value = esp.id;
                option.textContent = esp.nome;
                selectCadastro.appendChild(option);
            });
        }
    }

    atualizarMedicos(especialidadeId) {
        const select = document.getElementById('medico');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um médico</option>';
        
        // Se não há especialidade selecionada, não mostrar médicos
        if (!especialidadeId) {
            return;
        }
        
        const medicosEspecialidade = this.medicos.filter(m => m.especialidadeId === parseInt(especialidadeId));
        console.log('Especialidade ID:', especialidadeId);
        console.log('Médicos encontrados:', medicosEspecialidade);
        
        if (medicosEspecialidade.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum médico disponível para esta especialidade';
            option.disabled = true;
            select.appendChild(option);
        } else {
            medicosEspecialidade.forEach(medico => {
                const option = document.createElement('option');
                option.value = medico.id;
                option.textContent = `${medico.nome} - CRM: ${medico.crm}`;
                select.appendChild(option);
            });
        }
        
        // Limpar horários quando médico muda
        this.atualizarHorarios('');
    }

    atualizarHorarios(medicoId) {
        const select = document.getElementById('horario');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um horário</option>';
        
        const data = document.getElementById('data').value;
        if (!data || !medicoId) return;

        const medico = this.medicos.find(m => m.id === parseInt(medicoId));
        if (!medico) {
            console.log('Médico não encontrado:', medicoId);
            return;
        }

        console.log('Atualizando horários para médico:', medico.nome, 'Data:', data);

        // Filtrar horários ocupados
        const horariosOcupados = this.consultas
            .filter(c => c.medicoId === parseInt(medicoId) && 
                        c.data === data && 
                        c.status !== 'cancelada')
            .map(c => c.horario);

        console.log('Horários ocupados:', horariosOcupados);

        const horariosDisponiveis = medico.horariosDisponiveis.filter(h => !horariosOcupados.includes(h));
        
        console.log('Horários disponíveis:', horariosDisponiveis);
        
        if (horariosDisponiveis.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum horário disponível para esta data';
            option.disabled = true;
            select.appendChild(option);
        } else {
            horariosDisponiveis.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario;
                option.textContent = horario;
                select.appendChild(option);
            });
        }
    }

    atualizarInfoConsulta() {
        const especialidadeId = document.getElementById('especialidade').value;
        const medicoId = document.getElementById('medico').value;
        const data = document.getElementById('data').value;
        const horario = document.getElementById('horario').value;

        const infoDiv = document.getElementById('consultaInfo');
        if (!infoDiv) return;

        if (especialidadeId && medicoId && data && horario) {
            const especialidade = this.especialidades.find(esp => esp.id === parseInt(especialidadeId));
            const medico = this.medicos.find(m => m.id === parseInt(medicoId));
            
            infoDiv.innerHTML = `
                <div class="consulta-preview">
                    <h6><i class="fas fa-calendar-alt text-primary"></i> Data: ${this.formatarData(data)}</h6>
                    <h6><i class="fas fa-clock text-primary"></i> Horário: ${horario}</h6>
                    <h6><i class="fas fa-user-md text-primary"></i> Médico: ${medico?.nome || ''}</h6>
                    <h6><i class="fas fa-stethoscope text-primary"></i> Especialidade: ${especialidade?.nome || ''}</h6>
                </div>
            `;
        } else {
            infoDiv.innerHTML = '<p class="text-muted">Selecione os dados para ver as informações da consulta</p>';
        }
    }

    atualizarConsultasTable() {
        const tbody = document.getElementById('consultasTableBody');
        if (!tbody) return;

        if (!this.usuarioLogado) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Faça login para ver suas consultas</td></tr>';
            return;
        }

        const consultasUsuario = this.consultas.filter(c => 
            c.pacienteId === this.usuarioLogado.id || 
            (this.usuarioLogado.tipo === 'medico' && c.medicoId === this.usuarioLogado.id)
        );

        if (consultasUsuario.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma consulta encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        consultasUsuario.forEach(consulta => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatarData(consulta.data)}</td>
                <td>${consulta.horario}</td>
                <td>${consulta.medicoNome}</td>
                <td>${consulta.especialidade}</td>
                <td><span class="badge badge-${this.getStatusClass(consulta.status)}">${this.getStatusText(consulta.status)}</span></td>
                <td>
                    ${consulta.status === 'agendada' ? `
                        <button class="btn btn-sm btn-warning me-2" onclick="sistema.reagendarConsultaModal(${consulta.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="sistema.cancelarConsulta(${consulta.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    atualizarMedicosGrid() {
        const grid = document.getElementById('doctorsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.medicos.forEach(medico => {
            const especialidade = this.especialidades.find(esp => esp.id === medico.especialidadeId);
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';
            card.innerHTML = `
                <div class="card doctor-card">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${medico.nome}</h5>
                        <p class="card-text text-muted">${especialidade?.nome || ''}</p>
                        <p class="card-text"><small class="text-muted">CRM: ${medico.crm}</small></p>
                        <div class="d-flex justify-content-center">
                            <span class="badge badge-info">${especialidade?.nome || ''}</span>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    atualizarEspecialidadesGrid() {
        const grid = document.getElementById('specialtiesGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.especialidades.forEach(especialidade => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';
            card.innerHTML = `
                <div class="card specialty-card">
                    <div class="specialty-icon">
                        <i class="${especialidade.icone}"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${especialidade.nome}</h5>
                        <p class="card-text">${especialidade.descricao}</p>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // ==================== MODAIS E INTERFACE ====================

    mostrarModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    fecharModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) modal.hide();
    }

    reagendarConsultaModal(consultaId) {
        const consulta = this.consultas.find(c => c.id === consultaId);
        if (!consulta) return;

        const novaData = prompt('Nova data (YYYY-MM-DD):', consulta.data);
        const novoHorario = prompt('Novo horário (HH:MM):', consulta.horario);
        
        if (novaData && novoHorario) {
            this.reagendarConsulta(consultaId, novaData, novoHorario);
            this.atualizarConsultasTable();
        }
    }

    mostrarPerfil() {
        if (!this.usuarioLogado) return;

        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileContent');
        
        content.innerHTML = `
            <div class="profile-info">
                <div class="text-center mb-4">
                    <div class="profile-avatar mx-auto mb-3">
                        <i class="fas fa-user fa-3x"></i>
                    </div>
                    <h4>${this.usuarioLogado.nome}</h4>
                    <span class="badge badge-info">${this.usuarioLogado.tipo}</span>
                </div>
                <div class="profile-details">
                    <p><strong>Email:</strong> ${this.usuarioLogado.email}</p>
                    <p><strong>Telefone:</strong> ${this.usuarioLogado.telefone}</p>
                    <p><strong>Data de Nascimento:</strong> ${this.formatarData(this.usuarioLogado.dataNascimento)}</p>
                    ${this.usuarioLogado.crm ? `<p><strong>CRM:</strong> ${this.usuarioLogado.crm}</p>` : ''}
                    <p><strong>Membro desde:</strong> ${this.formatarData(this.usuarioLogado.dataCadastro)}</p>
                </div>
            </div>
        `;

        this.mostrarModal('profileModal');
    }

    // ==================== UTILITÁRIOS ====================

    formatarData(data) {
        if (!data) return '';
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    }

    getStatusClass(status) {
        const classes = {
            'agendada': 'success',
            'cancelada': 'danger',
            'reagendada': 'warning',
            'realizada': 'info'
        };
        return classes[status] || 'secondary';
    }

    getStatusText(status) {
        const textos = {
            'agendada': 'Agendada',
            'cancelada': 'Cancelada',
            'reagendada': 'Reagendada',
            'realizada': 'Realizada'
        };
        return textos[status] || status;
    }

    // ==================== CONFIGURAÇÕES EXTERNAS ====================

    configurarGSAP() {
        // Animação de entrada para cards
        gsap.registerPlugin();
        
        gsap.from('.quick-action-card', {
            duration: 0.6,
            y: 50,
            opacity: 0,
            stagger: 0.1,
            ease: 'back.out(1.7)'
        });

        // Animação de hover para cards
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, { duration: 0.3, scale: 1.05, ease: 'power2.out' });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { duration: 0.3, scale: 1, ease: 'power2.out' });
            });
        });
    }

    configurarToastify() {
        // Configuração global do Toastify
        window.Toastify = window.Toastify || {};
    }

    mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
        const cores = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        Toastify({
            text: mensagem,
            duration: duracao,
            gravity: 'top',
            position: 'right',
            backgroundColor: cores[tipo] || cores.info,
            className: `toast-${tipo}`,
            stopOnFocus: true
        }).showToast();
    }
}

// ==================== FUNÇÕES GLOBAIS ====================

let sistema;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    sistema = new SistemaAgendamento();
});

// Funções de navegação
function showLoginModal() {
    if (sistema) {
        sistema.mostrarModal('loginModal');
    }
}

function showRegisterModal() {
    if (sistema) {
        sistema.mostrarModal('registerModal');
    }
}

function showProfileModal() {
    if (sistema) {
        sistema.mostrarPerfil();
    }
}

function logout() {
    if (sistema) {
        sistema.logout();
        // Redirecionar para página inicial após logout
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
}

// Configurar data mínima para agendamento
document.addEventListener('DOMContentLoaded', () => {
    const dataInput = document.getElementById('data');
    if (dataInput) {
        const hoje = new Date();
        const dataMinima = hoje.toISOString().split('T')[0];
        dataInput.min = dataMinima;
        dataInput.value = dataMinima;
    }
});
