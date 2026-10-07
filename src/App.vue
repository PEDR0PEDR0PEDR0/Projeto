<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

import KycReviewDialog from './components/KycReviewDialog.vue'
import {
  clearDemoState,
  createInitialDemoState,
  loadDemoState,
  saveDemoState,
  type KycAuditEntry,
  type KycCase,
  type KycDemoState,
  type KycReviewStatus,
} from './kyc-data'

type QueueFilter = 'todos' | 'duvidoso' | 'reprovado'
type Decision = 'Aprovado' | 'Reprovado'

const demoState = loadDemoState()
const cases = ref<KycCase[]>(demoState.cases)
const audit = ref<KycAuditEntry[]>(demoState.audit)
const currentView = ref<'kyc' | 'users'>('kyc')
const queueFilter = ref<QueueFilter>('todos')
const searchQuery = ref('')
const selectedCase = ref<KycCase | null>(null)
const saveError = ref('')
const notice = ref('')
const reviewDialogVisible = ref(false)

const reviewCases = computed(() =>
  cases.value.filter((kycCase) =>
    kycCase.reviewStatus === 'duvidoso' || kycCase.reviewStatus === 'reprovado',
  ),
)

const visibleCases = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLocaleLowerCase('pt-BR')
  return reviewCases.value.filter((kycCase) => {
    const matchesFilter = queueFilter.value === 'todos' || kycCase.reviewStatus === queueFilter.value
    const searchableContent = `${kycCase.name} ${kycCase.email} ${kycCase.cpf} ${kycCase.id}`
      .toLocaleLowerCase('pt-BR')
    return matchesFilter && searchableContent.includes(normalizedQuery)
  })
})

const flaggedCount = computed(() => reviewCases.value.length)
const rejectedCount = computed(() =>
  reviewCases.value.filter((kycCase) => kycCase.reviewStatus === 'reprovado').length,
)
const doubtfulCount = computed(() =>
  reviewCases.value.filter((kycCase) => kycCase.reviewStatus === 'duvidoso').length,
)
function statusSeverity(status: KycReviewStatus): 'warn' | 'danger' | 'success' {
  if (status === 'reprovado' || status === 'reprovado-manual') {
    return 'danger'
  }
  if (status === 'aprovado') {
    return 'success'
  }
  return 'warn'
}

function formatStatus(status: KycReviewStatus): string {
  if (status === 'duvidoso') {
    return 'Duvidoso'
  }
  if (status === 'reprovado') {
    return 'Reprovado automático'
  }
  if (status === 'reprovado-manual') {
    return 'Reprovado na análise'
  }
  return 'Aprovado'
}

function formatDecisionDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function openReview(kycCase: KycCase): void {
  selectedCase.value = kycCase
  saveError.value = ''
  reviewDialogVisible.value = true
}

function getAuditDecisionDate(caseId: string): string | null {
  const entry = audit.value.find((auditEntry) => auditEntry.caseId === caseId)
  return entry === undefined ? null : formatDecisionDate(entry.decidedAt)
}

function submitDecision(decision: Decision, reason: string): void {
  const targetCase = selectedCase.value
  if (targetCase === null) {
    throw new Error('Não é possível registrar uma decisão sem um caso de KYC selecionado.')
  }

  const normalizedReason = reason.trim()
  if (normalizedReason.length < 10) {
    saveError.value = 'Informe um motivo com pelo menos 10 caracteres.'
    return
  }

  const nextCases = cases.value.map((kycCase): KycCase => {
    if (kycCase.id !== targetCase.id) {
      return kycCase
    }
    return {
      ...kycCase,
      reviewStatus: decision === 'Aprovado' ? 'aprovado' : 'reprovado-manual',
      userStatus: decision === 'Aprovado' ? 'Ativo' : 'KYC reprovado',
    }
  })
  const auditEntry: KycAuditEntry = {
    id: `${targetCase.id}-${Date.now()}`,
    caseId: targetCase.id,
    userName: targetCase.name,
    reviewer: 'Ana Souza',
    decision,
    reason: normalizedReason,
    decidedAt: new Date().toISOString(),
  }
  const nextAudit = [auditEntry, ...audit.value]
  const nextState: KycDemoState = { cases: nextCases, audit: nextAudit }

  try {
    saveDemoState(nextState)
  } catch (error) {
    saveError.value = `Não foi possível salvar a decisão localmente: ${String(error)}`
    return
  }

  cases.value = nextCases
  audit.value = nextAudit
  reviewDialogVisible.value = false
  notice.value = `Decisão registrada. O status de ${targetCase.name} foi atualizado na tela de Usuários (D03).`
}

function resetDemo(): void {
  try {
    clearDemoState()
  } catch (error) {
    saveError.value = `Não foi possível reiniciar os dados locais: ${String(error)}`
    return
  }

  const freshState = createInitialDemoState()
  cases.value = freshState.cases
  audit.value = freshState.audit
  notice.value = 'Demonstração reiniciada com os dados de exemplo.'
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#" aria-label="Plataforma, início">
        <span class="brand-mark"><i class="pi pi-shield" aria-hidden="true"></i></span>
        <span class="brand-name">orla<span>admin</span></span>
      </a>

      <div class="workspace-label">WORKSPACE</div>
      <div class="workspace-switcher">
        <span class="workspace-avatar">O</span>
        <span class="workspace-copy"><strong>Orla Mobilidade</strong><small>Operações</small></span>
        <i class="pi pi-angle-down" aria-hidden="true"></i>
      </div>

      <nav class="side-nav" aria-label="Navegação principal">
        <span class="nav-section-label">OPERAÇÃO</span>
        <button class="nav-item" type="button">
          <i class="pi pi-th-large" aria-hidden="true"></i><span>Visão geral</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: currentView === 'users' }"
          type="button"
          @click="currentView = 'users'"
        >
          <i class="pi pi-users" aria-hidden="true"></i><span>Usuários</span><span class="nav-id">D03</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: currentView === 'kyc' }"
          type="button"
          @click="currentView = 'kyc'"
        >
          <i class="pi pi-id-card" aria-hidden="true"></i><span>Fila de KYC</span>
          <span v-if="flaggedCount > 0" class="nav-count">{{ flaggedCount }}</span>
          <span class="nav-id">D04</span>
        </button>
        <button class="nav-item" type="button">
          <i class="pi pi-car" aria-hidden="true"></i><span>Veículos</span>
        </button>
        <button class="nav-item" type="button">
          <i class="pi pi-calendar" aria-hidden="true"></i><span>Reservas</span>
        </button>

        <span class="nav-section-label nav-section-spaced">SISTEMA</span>
        <button class="nav-item" type="button">
          <i class="pi pi-chart-bar" aria-hidden="true"></i><span>Relatórios</span>
        </button>
        <button class="nav-item" type="button">
          <i class="pi pi-cog" aria-hidden="true"></i><span>Configurações</span>
        </button>
      </nav>

      <div class="sidebar-bottom">
        <div class="sidebar-help">
          <span class="help-icon"><i class="pi pi-question-circle" aria-hidden="true"></i></span>
          <span><strong>Precisa de ajuda?</strong><small>Acesse nossa central</small></span>
          <i class="pi pi-arrow-up-right" aria-hidden="true"></i>
        </div>
        <button class="profile-button" type="button" aria-label="Perfil de Ana Souza">
          <span class="profile-avatar">AS</span>
          <span class="profile-copy"><strong>Ana Souza</strong><small>Administradora</small></span>
          <i class="pi pi-ellipsis-h" aria-hidden="true"></i>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumbs">
          <span>Operação</span><i class="pi pi-angle-right" aria-hidden="true"></i>
          <span>{{ currentView === 'kyc' ? 'Verificação de identidade' : 'Usuários' }}</span>
        </div>
        <div class="topbar-actions">
          <span class="demo-label"><span></span>DADOS DE DEMONSTRAÇÃO</span>
          <button class="icon-button" type="button" aria-label="Notificações">
            <i class="pi pi-bell" aria-hidden="true"></i><span class="notification-dot"></span>
          </button>
          <span class="topbar-divider"></span>
          <span class="today-label">Quarta-feira, 07 de outubro</span>
        </div>
      </header>

      <div class="page-content">
        <div v-if="notice" class="notice-banner" role="status">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <span>{{ notice }}</span>
          <button type="button" aria-label="Fechar mensagem" @click="notice = ''">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <div v-if="saveError" class="error-banner" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>{{ saveError }}</span>
        </div>

        <template v-if="currentView === 'kyc'">
          <div class="page-heading">
            <div>
              <div class="eyebrow"><span class="eyebrow-dot"></span>IDENTIDADE &amp; SEGURANÇA</div>
              <h1>Fila de KYC</h1>
              <p class="page-subtitle">Revise os casos que precisam de uma análise manual.</p>
            </div>
            <div class="heading-meta">
              <span class="requirement-pill">D04 <span>·</span> RF-ADM-011</span>
              <Button class="reset-button" label="Reiniciar demonstração" icon="pi pi-refresh" severity="secondary" outlined @click="resetDemo" />
            </div>
          </div>

          <section class="summary-grid" aria-label="Resumo da fila de KYC">
            <article class="summary-card">
              <div class="summary-top"><span class="summary-icon icon-total"><i class="pi pi-inbox" aria-hidden="true"></i></span><span class="summary-trend">AGORA</span></div>
              <strong class="summary-value">{{ flaggedCount.toString().padStart(2, '0') }}</strong>
              <span class="summary-label">Casos na fila</span>
              <span class="summary-foot">Aguardando análise manual</span>
            </article>
            <article class="summary-card">
              <div class="summary-top"><span class="summary-icon icon-doubt"><i class="pi pi-eye" aria-hidden="true"></i></span><span class="summary-trend">REVISÃO</span></div>
              <strong class="summary-value">{{ doubtfulCount.toString().padStart(2, '0') }}</strong>
              <span class="summary-label">Casos duvidosos</span>
              <span class="summary-foot">Verificação inconclusiva</span>
            </article>
            <article class="summary-card">
              <div class="summary-top"><span class="summary-icon icon-rejected"><i class="pi pi-exclamation-triangle" aria-hidden="true"></i></span><span class="summary-trend">PROVEDOR</span></div>
              <strong class="summary-value">{{ rejectedCount.toString().padStart(2, '0') }}</strong>
              <span class="summary-label">Reprovados automaticamente</span>
              <span class="summary-foot">Precisam de decisão humana</span>
            </article>
            <article class="summary-card summary-card-accent">
              <div class="summary-top"><span class="summary-icon icon-sla"><i class="pi pi-clock" aria-hidden="true"></i></span><span class="summary-trend">TEMPO MÉDIO</span></div>
              <strong class="summary-value">12<span class="summary-unit">min</span></strong>
              <span class="summary-label">Até a primeira análise</span>
              <span class="summary-foot"><i class="pi pi-arrow-down" aria-hidden="true"></i> dentro da meta de 30 min</span>
            </article>
          </section>

          <section class="queue-panel" aria-labelledby="queue-title">
            <div class="panel-heading">
              <div>
                <h2 id="queue-title">Casos aguardando análise <span class="heading-count">{{ flaggedCount }}</span></h2>
                <p>Somente reprovações automáticas e verificações inconclusivas.</p>
              </div>
              <div class="queue-tools">
                <label class="search-field">
                  <i class="pi pi-search" aria-hidden="true"></i>
                  <InputText v-model="searchQuery" aria-label="Buscar usuário ou protocolo" placeholder="Buscar usuário ou protocolo" />
                  <kbd>⌘ K</kbd>
                </label>
                <button class="filter-button" type="button" aria-label="Opções de filtro"><i class="pi pi-sliders-h" aria-hidden="true"></i></button>
              </div>
            </div>

            <div class="filter-tabs" role="group" aria-label="Filtrar por resultado automático">
              <button :class="{ selected: queueFilter === 'todos' }" type="button" @click="queueFilter = 'todos'">
                Todos <span>{{ flaggedCount }}</span>
              </button>
              <button :class="{ selected: queueFilter === 'duvidoso' }" type="button" @click="queueFilter = 'duvidoso'">
                Duvidosos <span>{{ doubtfulCount }}</span>
              </button>
              <button :class="{ selected: queueFilter === 'reprovado' }" type="button" @click="queueFilter = 'reprovado'">
                Reprovados <span>{{ rejectedCount }}</span>
              </button>
            </div>

            <div class="table-scroll">
              <table class="cases-table">
                <thead>
                  <tr>
                    <th scope="col">USUÁRIO</th>
                    <th scope="col">RESULTADO AUTOMÁTICO</th>
                    <th scope="col">RISCO</th>
                    <th scope="col">RECEBIDO EM</th>
                    <th scope="col"><span class="sr-only">Ação</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="kycCase in visibleCases" :key="kycCase.id">
                    <td>
                      <div class="user-cell">
                        <span class="user-avatar" :class="{ 'avatar-warm': kycCase.risk === 'Alto' }">{{ kycCase.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</span>
                        <span class="user-info"><strong>{{ kycCase.name }}</strong><small>{{ kycCase.email }}</small></span>
                      </div>
                    </td>
                    <td><Tag :value="formatStatus(kycCase.reviewStatus)" :severity="statusSeverity(kycCase.reviewStatus)" /></td>
                    <td><span class="risk-label" :class="kycCase.risk === 'Alto' ? 'risk-high' : 'risk-medium'"><span></span>{{ kycCase.risk }}</span></td>
                    <td><span class="received-date">{{ kycCase.submittedAt }}</span><small class="protocol-id">{{ kycCase.id }}</small></td>
                    <td class="action-cell">
                      <Button label="Analisar" icon="pi pi-arrow-up-right" iconPos="right" severity="secondary" outlined @click="openReview(kycCase)" />
                    </td>
                  </tr>
                  <tr v-if="visibleCases.length === 0">
                    <td class="empty-cell" colspan="5">
                      <span class="empty-icon"><i class="pi pi-check" aria-hidden="true"></i></span>
                      <strong>{{ flaggedCount === 0 ? 'Fila em dia' : 'Nenhum caso encontrado' }}</strong>
                      <span>{{ flaggedCount === 0 ? 'Todos os casos sinalizados já foram analisados.' : 'Tente outro nome ou filtro.' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <footer class="table-footer">
              <span>Exibindo <strong>{{ visibleCases.length }}</strong> de <strong>{{ flaggedCount }}</strong> casos</span>
              <span class="updated-label"><i class="pi pi-sync" aria-hidden="true"></i> Atualizado agora</span>
            </footer>
          </section>

          <section class="audit-panel" aria-labelledby="audit-title">
            <div class="audit-heading">
              <div class="audit-title-group">
                <span class="audit-icon"><i class="pi pi-history" aria-hidden="true"></i></span>
                <div><h2 id="audit-title">Trilha de auditoria</h2><p>Decisões registradas nesta demonstração</p></div>
              </div>
              <Tag :value="`${audit.length} registros`" severity="secondary" />
            </div>
            <div v-if="audit.length === 0" class="audit-empty">
              <i class="pi pi-lock" aria-hidden="true"></i>
              <span>As decisões tomadas na fila aparecerão aqui com responsável, horário e justificativa.</span>
            </div>
            <ol v-else class="audit-list">
              <li v-for="entry in audit" :key="entry.id">
                <span class="audit-dot" :class="entry.decision === 'Aprovado' ? 'audit-approved' : 'audit-rejected'"></span>
                <div class="audit-event">
                  <strong>{{ entry.decision }} · {{ entry.userName }}</strong>
                  <span>{{ entry.reason }}</span>
                  <small>{{ entry.reviewer }} · {{ formatDecisionDate(entry.decidedAt) }} · {{ entry.caseId }}</small>
                </div>
              </li>
            </ol>
          </section>
          <p class="demo-disclaimer"><i class="pi pi-info-circle" aria-hidden="true"></i> Ambiente demonstrativo. Documentos, provedores e decisões são dados mockados e ficam salvos apenas neste navegador.</p>
        </template>

        <template v-else>
          <div class="page-heading">
            <div>
              <div class="eyebrow"><span class="eyebrow-dot"></span>OPERAÇÃO</div>
              <h1>Usuários</h1>
              <p class="page-subtitle">Visão D03 · status de conta sincronizado com a análise de KYC.</p>
            </div>
            <span class="requirement-pill">D03 <span>·</span> RF-ADM-010</span>
          </div>
          <section class="queue-panel users-panel" aria-labelledby="users-title">
            <div class="panel-heading">
              <div><h2 id="users-title">Contas da demonstração <span class="heading-count">{{ cases.length }}</span></h2><p>Uma decisão manual atualiza o status da conta nesta lista.</p></div>
            </div>
            <div class="table-scroll">
              <table class="cases-table users-table">
                <thead><tr><th scope="col">USUÁRIO</th><th scope="col">CPF</th><th scope="col">STATUS DA CONTA</th><th scope="col">ÚLTIMA DECISÃO</th><th scope="col">PROTOCOLO</th></tr></thead>
                <tbody>
                  <tr v-for="kycCase in cases" :key="kycCase.id">
                    <td><div class="user-cell"><span class="user-avatar">{{ kycCase.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</span><span class="user-info"><strong>{{ kycCase.name }}</strong><small>{{ kycCase.email }}</small></span></div></td>
                    <td><span class="received-date">{{ kycCase.cpf }}</span></td>
                    <td><Tag :value="kycCase.userStatus" :severity="kycCase.userStatus === 'Ativo' ? 'success' : kycCase.userStatus === 'KYC reprovado' ? 'danger' : 'warn'" /></td>
                    <td><span v-if="getAuditDecisionDate(kycCase.id)" class="received-date">{{ getAuditDecisionDate(kycCase.id) }}</span><span v-else class="muted-cell">—</span></td>
                    <td><span class="protocol-id">{{ kycCase.id }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="audit-panel user-audit-panel" aria-labelledby="user-audit-title">
            <div class="audit-heading"><div class="audit-title-group"><span class="audit-icon"><i class="pi pi-shield" aria-hidden="true"></i></span><div><h2 id="user-audit-title">Decisões recentes de KYC</h2><p>Trilha vinculada às contas listadas acima</p></div></div></div>
            <div v-if="audit.length === 0" class="audit-empty"><i class="pi pi-info-circle" aria-hidden="true"></i><span>Nenhuma decisão manual foi registrada ainda. Acesse a fila D04 para analisar um caso.</span></div>
            <ol v-else class="audit-list"><li v-for="entry in audit" :key="entry.id"><span class="audit-dot" :class="entry.decision === 'Aprovado' ? 'audit-approved' : 'audit-rejected'"></span><div class="audit-event"><strong>{{ entry.decision }} · {{ entry.userName }}</strong><span>{{ entry.reason }}</span><small>{{ entry.reviewer }} · {{ formatDecisionDate(entry.decidedAt) }}</small></div></li></ol>
          </section>
        </template>
      </div>
    </main>

    <KycReviewDialog
      v-model:visible="reviewDialogVisible"
      :kyc-case="selectedCase"
      :save-error="saveError"
      @decision="submitDecision"
    />
  </div>
</template>
