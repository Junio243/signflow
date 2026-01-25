export const dashboardTourSteps = [
  {
    element: '#welcome-message',
    popover: {
      title: '👋 Bem-vindo ao SignFlow!',
      description:
        'Este é seu dashboard. Aqui você gerencia todos os seus documentos assinados e pode acessar rapidamente as principais funcionalidades.',
      side: 'bottom' as const,
    },
  },
  {
    element: '#new-signature-btn',
    popover: {
      title: '✍️ Nova Assinatura',
      description:
        'Clique aqui para começar a assinar um novo documento. Você poderá fazer upload de um PDF e adicionar sua assinatura.',
      side: 'bottom' as const,
    },
  },
  {
    element: '#documents-list',
    popover: {
      title: '📄 Seus Documentos',
      description:
        'Todos os documentos que você assinou aparecem aqui. Você pode visualizar, baixar ou validar a assinatura a qualquer momento.',
      side: 'top' as const,
    },
  },
  {
    element: '#profile-menu',
    popover: {
      title: '⚙️ Configurações',
      description:
        'Acesse seu perfil e configurações da conta aqui. Você pode atualizar seus dados e gerenciar preferências.',
      side: 'left' as const,
    },
  },
];
