export const editorTourSteps = [
  {
    element: '#pdf-upload',
    popover: {
      title: '📄 Upload do Documento',
      description:
        'Primeiro, faça upload do documento PDF que deseja assinar. Arquivos de até 20MB são suportados.',
      side: 'bottom' as const,
    },
  },
  {
    element: '#signature-upload',
    popover: {
      title: '✍️ Sua Assinatura',
      description:
        'Faça upload da imagem da sua assinatura (PNG, JPG). Você pode tirar foto da sua assinatura manuscrita ou usar uma imagem digital.',
      side: 'bottom' as const,
    },
  },
  {
    element: '#pdf-canvas',
    popover: {
      title: '🎨 Posicione a Assinatura',
      description:
        'Arraste e redimensione sua assinatura sobre o documento. Você pode rotacionar e ajustar o tamanho para ficar perfeita.',
      side: 'top' as const,
    },
  },
  {
    element: '#page-navigation',
    popover: {
      title: '📊 Navegação de Páginas',
      description:
        'Navegue entre as páginas do PDF se precisar adicionar assinatura em outras páginas além da primeira.',
      side: 'bottom' as const,
    },
  },
  {
    element: '#save-document',
    popover: {
      title: '✅ Salvar e Download',
      description:
        'Quando estiver satisfeito, clique aqui para gerar o PDF assinado. Um QR Code será adicionado automaticamente para validação.',
      side: 'left' as const,
    },
  },
];
