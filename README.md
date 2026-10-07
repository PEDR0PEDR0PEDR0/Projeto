# Fila de KYC — Orla Admin

Protótipo da tela D04 (RF-ADM-011), feito com Vue 3, TypeScript, Vite e PrimeVue.

## Executar

```sh
npm install
npm run dev
```

Para validar a compilação de produção:

```sh
npm run build
```

## Fluxo demonstrativo

- A fila mostra apenas casos com resultado automático duvidoso ou reprovado.
- A análise exibe pré-visualizações ilustrativas da frente, do verso e da selfie, além dos scores e motivos dos provedores mockados.
- Aprovar ou reprovar exige uma justificativa com pelo menos 10 caracteres.
- A decisão altera o status correspondente na visão Usuários (D03) e registra analista, horário, decisão e justificativa na trilha de auditoria.
- O estado é guardado no `localStorage` deste navegador. Use **Reiniciar demonstração** para restaurar os casos iniciais e apagar as decisões locais.