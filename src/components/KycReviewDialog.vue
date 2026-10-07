<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

import type { KycCase, KycDocument, KycProviderResult } from '../kyc-data'

type Decision = 'Aprovado' | 'Reprovado'

const props = defineProps<{
  visible: boolean
  kycCase: KycCase | null
  saveError: string
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  decision: [decision: Decision, reason: string]
}>()

const selectedDocument = ref<KycDocument | null>(null)
const selectedDecision = ref<Decision | null>(null)
const decisionReason = ref('')
const validationError = ref('')
const documentDialogVisible = ref(false)

const dialogTitle = computed(() =>
  props.kycCase === null ? 'Análise de KYC' : `Análise · ${props.kycCase.name}`,
)
const canSubmitDecision = computed(() =>
  selectedDecision.value !== null && decisionReason.value.trim().length >= 10,
)

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    selectedDecision.value = null
    decisionReason.value = ''
    validationError.value = ''
  }
})

function providerSeverity(status: KycProviderResult['status']): 'success' | 'warn' | 'danger' {
  if (status === 'Aprovado') {
    return 'success'
  }
  if (status === 'Reprovado') {
    return 'danger'
  }
  return 'warn'
}

function chooseDecision(decision: Decision): void {
  selectedDecision.value = decision
  validationError.value = ''
}

function openDocument(document: KycDocument): void {
  selectedDocument.value = document
  documentDialogVisible.value = true
}

function submitDecision(): void {
  if (selectedDecision.value === null) {
    validationError.value = 'Selecione uma decisão para continuar.'
    return
  }

  const reason = decisionReason.value.trim()
  if (reason.length < 10) {
    validationError.value = 'Informe um motivo com pelo menos 10 caracteres.'
    return
  }

  emit('decision', selectedDecision.value, reason)
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="dialogTitle"
    modal
    :draggable="false"
    class="review-dialog"
    :style="{ width: 'min(960px, calc(100vw - 32px))' }"
    @update:visible="emit('update:visible', $event)"
  >
    <template v-if="kycCase">
      <div class="review-person">
        <span class="user-avatar review-avatar">{{ kycCase.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</span>
        <span class="user-info"><strong>{{ kycCase.name }}</strong><small>{{ kycCase.email }} <span>·</span> {{ kycCase.cpf }}</small></span>
        <span class="review-protocol">{{ kycCase.id }}</span>
      </div>
      <div class="review-body">
        <section class="review-section">
          <div class="section-heading"><div><h3>Documentos enviados</h3><p>Pré-visualização dos arquivos recebidos</p></div><span class="section-meta">3 arquivos</span></div>
          <div class="document-grid">
            <button v-for="document in kycCase.documents" :key="document.kind" class="document-card" type="button" :aria-label="`Ampliar ${document.label}`" @click="openDocument(document)">
              <img :src="document.image" :alt="`Imagem mockada: ${document.label}`" />
              <span>{{ document.label }}<i class="pi pi-search-plus" aria-hidden="true"></i></span>
            </button>
          </div>
        </section>

        <section class="review-section provider-section">
          <div class="section-heading"><div><h3>Resultado dos provedores</h3><p>Scores e motivos retornados na análise automática</p></div><span class="provider-source"><i class="pi pi-bolt" aria-hidden="true"></i> MOCK</span></div>
          <div class="provider-list">
            <article v-for="provider in kycCase.providers" :key="provider.name" class="provider-card">
              <span class="provider-logo">{{ provider.name.slice(0, 1) }}</span>
              <div class="provider-details"><div><strong>{{ provider.name }}</strong><Tag :value="provider.status" :severity="providerSeverity(provider.status)" /></div><p>{{ provider.reason }}</p></div>
              <div class="provider-score"><strong>{{ provider.score }}</strong><small>score</small></div>
            </article>
          </div>
        </section>

        <section class="decision-section">
          <div class="section-heading"><div><h3>Decisão do analista</h3><p>A escolha atualizará o status do usuário na tela D03.</p></div><span class="required-label">* Obrigatório</span></div>
          <div class="decision-options" role="group" aria-label="Escolha aprovar ou reprovar">
            <button class="decision-option approve-option" :class="{ chosen: selectedDecision === 'Aprovado' }" type="button" @click="chooseDecision('Aprovado')">
              <span class="decision-option-icon"><i class="pi pi-check" aria-hidden="true"></i></span><span><strong>Aprovar identidade</strong><small>Conta ficará ativa</small></span><i v-if="selectedDecision === 'Aprovado'" class="pi pi-check-circle selected-check" aria-hidden="true"></i>
            </button>
            <button class="decision-option reject-option" :class="{ chosen: selectedDecision === 'Reprovado' }" type="button" @click="chooseDecision('Reprovado')">
              <span class="decision-option-icon"><i class="pi pi-times" aria-hidden="true"></i></span><span><strong>Reprovar identidade</strong><small>Conta ficará reprovada no KYC</small></span><i v-if="selectedDecision === 'Reprovado'" class="pi pi-check-circle selected-check" aria-hidden="true"></i>
            </button>
          </div>
          <label class="reason-label" for="decision-reason">Motivo fundamentado <span>*</span></label>
          <Textarea id="decision-reason" v-model="decisionReason" rows="3" autoResize placeholder="Descreva os elementos que fundamentam sua decisão..." :aria-invalid="Boolean(validationError)" />
          <div class="reason-footer"><span>Obrigatório · mínimo de 10 caracteres</span><span>{{ decisionReason.trim().length }} caracteres</span></div>
          <p v-if="validationError" class="validation-error" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ validationError }}</p>
          <p v-if="saveError" class="validation-error" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ saveError }}</p>
        </section>
      </div>
      <div class="dialog-footer">
        <Button label="Cancelar" severity="secondary" text @click="emit('update:visible', false)" />
        <Button :label="selectedDecision === null ? 'Selecione uma decisão' : `Confirmar ${selectedDecision.toLocaleLowerCase('pt-BR')}`" icon="pi pi-check" :disabled="!canSubmitDecision" @click="submitDecision" />
      </div>
    </template>
  </Dialog>

  <Dialog
    :visible="documentDialogVisible"
    :header="selectedDocument?.label ?? 'Documento enviado'"
    modal
    :draggable="false"
    class="document-dialog"
    :style="{ width: 'min(760px, calc(100vw - 32px))' }"
    @update:visible="documentDialogVisible = $event"
  >
    <img v-if="selectedDocument" class="document-large-image" :src="selectedDocument.image" :alt="`Imagem mockada ampliada: ${selectedDocument.label}`" />
    <p class="image-disclaimer"><i class="pi pi-info-circle" aria-hidden="true"></i> Pré-visualização ilustrativa para demonstração; não contém documento real.</p>
  </Dialog>
</template>
