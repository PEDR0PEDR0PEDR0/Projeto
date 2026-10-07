export type KycReviewStatus = 'duvidoso' | 'reprovado' | 'aprovado' | 'reprovado-manual'

export type UserAccountStatus = 'Pendente KYC' | 'Ativo' | 'KYC reprovado'

export interface KycDocument {
  label: string
  kind: 'front' | 'back' | 'selfie'
  image: string
}

export interface KycProviderResult {
  name: string
  score: number
  status: 'Aprovado' | 'Atenção' | 'Reprovado'
  reason: string
}

export interface KycCase {
  id: string
  name: string
  email: string
  cpf: string
  submittedAt: string
  reviewStatus: KycReviewStatus
  userStatus: UserAccountStatus
  risk: 'Alto' | 'Médio'
  documents: KycDocument[]
  providers: KycProviderResult[]
}

export interface KycAuditEntry {
  id: string
  caseId: string
  userName: string
  reviewer: string
  decision: 'Aprovado' | 'Reprovado'
  reason: string
  decidedAt: string
}

export interface KycDemoState {
  cases: KycCase[]
  audit: KycAuditEntry[]
}

const STORAGE_KEY = 'kyc-review-demo-state-v1'

const frontImage =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22380%22 viewBox=%220 0 600 380%22%3E%3Crect width=%22600%22 height=%22380%22 rx=%2224%22 fill=%22%23e8eee9%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22560%22 height=%22340%22 rx=%2216%22 fill=%22%23fffdf7%22 stroke=%22%23cbd7cd%22 stroke-width=%222%22/%3E%3Crect x=%2244%22 y=%2244%22 width=%2292%22 height=%22112%22 rx=%2210%22 fill=%22%23d5e3d7%22/%3E%3Ccircle cx=%2290%22 cy=%2284%22 r=%2222%22 fill=%22%23829b87%22/%3E%3Cpath d=%22M55 143c5-27 65-27 70 0%22 fill=%22%23829b87%22/%3E%3Crect x=%22162%22 y=%2250%22 width=%22234%22 height=%2212%22 rx=%226%22 fill=%22%233d5946%22/%3E%3Crect x=%22162%22 y=%2274%22 width=%22172%22 height=%229%22 rx=%224%22 fill=%22%23c2cbc2%22/%3E%3Crect x=%2244%22 y=%22184%22 width=%22470%22 height=%2210%22 rx=%225%22 fill=%22%23d9dfd8%22/%3E%3Crect x=%2244%22 y=%22210%22 width=%22382%22 height=%2210%22 rx=%225%22 fill=%22%23d9dfd8%22/%3E%3Crect x=%2244%22 y=%22268%22 width=%22162%22 height=%2216%22 rx=%226%22 fill=%22%23b5c5b8%22/%3E%3Ctext x=%2244%22 y=%22330%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23717d72%22%3EDOCUMENTO DE DEMONSTRACAO%3C/text%3E%3C/svg%3E'

const backImage =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22380%22 viewBox=%220 0 600 380%22%3E%3Crect width=%22600%22 height=%22380%22 rx=%2224%22 fill=%22%23e8eee9%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22560%22 height=%22340%22 rx=%2216%22 fill=%22%23fffdf7%22 stroke=%22%23cbd7cd%22 stroke-width=%222%22/%3E%3Crect x=%2244%22 y=%2250%22 width=%22512%22 height=%2211%22 rx=%225%22 fill=%22%233d5946%22/%3E%3Crect x=%2244%22 y=%2280%22 width=%22438%22 height=%229%22 rx=%224%22 fill=%22%23c2cbc2%22/%3E%3Crect x=%2244%22 y=%22112%22 width=%22470%22 height=%229%22 rx=%224%22 fill=%22%23c2cbc2%22/%3E%3Crect x=%2244%22 y=%22172%22 width=%22512%22 height=%2290%22 rx=%2210%22 fill=%22%23edf1eb%22 stroke=%22%23d8e0d8%22/%3E%3Cpath d=%22M65 196h470M65 218h470M65 240h470%22 stroke=%22%23b5c1b6%22 stroke-width=%222%22/%3E%3Ctext x=%2244%22 y=%22322%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23717d72%22%3EDOCUMENTO DE DEMONSTRACAO%3C/text%3E%3C/svg%3E'

const selfieImage =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22380%22 viewBox=%220 0 600 380%22%3E%3Cdefs%3E%3ClinearGradient id=%22b%22 x2=%220%22 y2=%221%22%3E%3Cstop stop-color=%22%23dce9df%22/%3E%3Cstop offset=%221%22 stop-color=%22%23bdd0c1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22600%22 height=%22380%22 rx=%2224%22 fill=%22url(%23b)%22/%3E%3Ccircle cx=%22300%22 cy=%22142%22 r=%2274%22 fill=%22%23d7b49a%22/%3E%3Cpath d=%22M226 138c4-78 145-90 149 5-30-7-51-28-63-44-16 23-47 38-86 39%22 fill=%22%23463e39%22/%3E%3Cpath d=%22M175 358c11-103 69-150 125-150s114 47 125 150%22 fill=%22%23586b5d%22/%3E%3Crect x=%2224%22 y=%2224%22 width=%22552%22 height=%22332%22 rx=%2218%22 fill=%22none%22 stroke=%22%23fff%22 stroke-opacity=%22.8%22 stroke-width=%224%22/%3E%3Ctext x=%2242%22 y=%22338%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23fff%22%3ESELFIE DE DEMONSTRACAO%3C/text%3E%3C/svg%3E'

const mockCases: KycCase[] = [
  {
    id: 'KYC-2026-0184',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    cpf: '***.482.***-09',
    submittedAt: '07 out, 09:42',
    reviewStatus: 'duvidoso',
    userStatus: 'Pendente KYC',
    risk: 'Médio',
    documents: [
      { label: 'Documento · frente', kind: 'front', image: frontImage },
      { label: 'Documento · verso', kind: 'back', image: backImage },
      { label: 'Selfie com prova de vida', kind: 'selfie', image: selfieImage },
    ],
    providers: [
      { name: 'Veriff', score: 72, status: 'Atenção', reason: 'Similaridade facial abaixo do limite de confiança.' },
      { name: 'Unico Check', score: 91, status: 'Aprovado', reason: 'Documento válido e dados biográficos compatíveis.' },
    ],
  },
  {
    id: 'KYC-2026-0183',
    name: 'Rafael Mendes',
    email: 'rafael.mendes@email.com',
    cpf: '***.105.***-44',
    submittedAt: '07 out, 09:18',
    reviewStatus: 'reprovado',
    userStatus: 'Pendente KYC',
    risk: 'Alto',
    documents: [
      { label: 'Documento · frente', kind: 'front', image: frontImage },
      { label: 'Documento · verso', kind: 'back', image: backImage },
      { label: 'Selfie com prova de vida', kind: 'selfie', image: selfieImage },
    ],
    providers: [
      { name: 'Veriff', score: 38, status: 'Reprovado', reason: 'Documento expirado; data de validade não reconhecida como vigente.' },
      { name: 'Unico Check', score: 54, status: 'Atenção', reason: 'Face não corresponde com segurança à foto do documento.' },
    ],
  },
  {
    id: 'KYC-2026-0182',
    name: 'Bianca Almeida',
    email: 'bianca.almeida@email.com',
    cpf: '***.779.***-21',
    submittedAt: '07 out, 08:56',
    reviewStatus: 'duvidoso',
    userStatus: 'Pendente KYC',
    risk: 'Médio',
    documents: [
      { label: 'Documento · frente', kind: 'front', image: frontImage },
      { label: 'Documento · verso', kind: 'back', image: backImage },
      { label: 'Selfie com prova de vida', kind: 'selfie', image: selfieImage },
    ],
    providers: [
      { name: 'Veriff', score: 67, status: 'Atenção', reason: 'Reflexo na imagem dificulta leitura do número do documento.' },
      { name: 'Unico Check', score: 83, status: 'Aprovado', reason: 'Prova de vida aprovada; necessário revisar legibilidade.' },
    ],
  },
  {
    id: 'KYC-2026-0181',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@email.com',
    cpf: '***.321.***-70',
    submittedAt: '06 out, 17:31',
    reviewStatus: 'aprovado',
    userStatus: 'Ativo',
    risk: 'Médio',
    documents: [
      { label: 'Documento · frente', kind: 'front', image: frontImage },
      { label: 'Documento · verso', kind: 'back', image: backImage },
      { label: 'Selfie com prova de vida', kind: 'selfie', image: selfieImage },
    ],
    providers: [
      { name: 'Veriff', score: 96, status: 'Aprovado', reason: 'Identidade verificada com alta confiança.' },
      { name: 'Unico Check', score: 94, status: 'Aprovado', reason: 'Documento e prova de vida aprovados.' },
    ],
  },
]

export function createInitialDemoState(): KycDemoState {
  return { cases: mockCases, audit: [] }
}

function isKycDemoState(value: unknown): value is KycDemoState {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const state = value as Partial<KycDemoState>
  return Array.isArray(state.cases) && Array.isArray(state.audit)
}

export function loadDemoState(): KycDemoState {
  const serializedState = localStorage.getItem(STORAGE_KEY)
  if (serializedState === null) {
    return createInitialDemoState()
  }

  const parsedState: unknown = JSON.parse(serializedState)
  if (!isKycDemoState(parsedState)) {
    throw new Error('Os dados locais da demonstração de KYC estão inválidos. Limpe os dados do site para reiniciar.')
  }

  return parsedState
}

export function saveDemoState(state: KycDemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearDemoState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
