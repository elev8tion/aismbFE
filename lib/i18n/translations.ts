export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    leads: string;
    pipeline: string;
    companies: string;
    contacts: string;
    partnerships: string;
    voiceSessions: string;
    roiCalculations: string;
    settings: string;
    signOut: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    newLeads: string;
    pipelineValue: string;
    activePartners: string;
    mrr: string;
    recentActivity: string;
    tasksDueToday: string;
    viewAll: string;
  };
  // Leads
  leads: {
    title: string;
    newLead: string;
    allLeads: string;
    qualified: string;
    unqualified: string;
    converted: string;
    score: string;
    source: string;
    status: string;
    assignedTo: string;
  };
  // Pipeline
  pipeline: {
    title: string;
    newOpportunity: string;
    stages: {
      newLead: string;
      contacted: string;
      discoveryCall: string;
      proposalSent: string;
      negotiation: string;
      closedWon: string;
      closedLost: string;
    };
    tier: string;
    value: string;
    closeDate: string;
  };
  // Common
  common: {
    search: string;
    filter: string;
    export: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    add: string;
    loading: string;
    noData: string;
    actions: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
  };
  // Auth
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
  };
}

export const translations: Record<'en' | 'es', Translations> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      leads: 'Leads',
      pipeline: 'Pipeline',
      companies: 'Companies',
      contacts: 'Contacts',
      partnerships: 'Partnerships',
      voiceSessions: 'Voice Sessions',
      roiCalculations: 'ROI Calculations',
      settings: 'Settings',
      signOut: 'Sign Out',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      newLeads: 'New Leads',
      pipelineValue: 'Pipeline Value',
      activePartners: 'Active Partners',
      mrr: 'MRR',
      recentActivity: 'Recent Activity',
      tasksDueToday: 'Tasks Due Today',
      viewAll: 'View All',
    },
    leads: {
      title: 'Leads',
      newLead: 'New Lead',
      allLeads: 'All Leads',
      qualified: 'Qualified',
      unqualified: 'Unqualified',
      converted: 'Converted',
      score: 'Score',
      source: 'Source',
      status: 'Status',
      assignedTo: 'Assigned To',
    },
    pipeline: {
      title: 'Pipeline',
      newOpportunity: 'New Opportunity',
      stages: {
        newLead: 'New Lead',
        contacted: 'Contacted',
        discoveryCall: 'Discovery Call',
        proposalSent: 'Proposal Sent',
        negotiation: 'Negotiation',
        closedWon: 'Closed Won',
        closedLost: 'Closed Lost',
      },
      tier: 'Tier',
      value: 'Value',
      closeDate: 'Close Date',
    },
    common: {
      search: 'Search...',
      filter: 'Filter',
      export: 'Export',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      add: 'Add',
      loading: 'Loading...',
      noData: 'No data found',
      actions: 'Actions',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
    },
  },
  es: {
    nav: {
      dashboard: 'Panel',
      leads: 'Prospectos',
      pipeline: 'Pipeline',
      companies: 'Empresas',
      contacts: 'Contactos',
      partnerships: 'Asociaciones',
      voiceSessions: 'Sesiones de Voz',
      roiCalculations: 'Calculaciones ROI',
      settings: 'Configuración',
      signOut: 'Cerrar Sesión',
    },
    dashboard: {
      title: 'Panel',
      welcome: 'Bienvenido de nuevo',
      newLeads: 'Nuevos Prospectos',
      pipelineValue: 'Valor del Pipeline',
      activePartners: 'Socios Activos',
      mrr: 'MRR',
      recentActivity: 'Actividad Reciente',
      tasksDueToday: 'Tareas para Hoy',
      viewAll: 'Ver Todo',
    },
    leads: {
      title: 'Prospectos',
      newLead: 'Nuevo Prospecto',
      allLeads: 'Todos los Prospectos',
      qualified: 'Calificado',
      unqualified: 'No Calificado',
      converted: 'Convertido',
      score: 'Puntaje',
      source: 'Fuente',
      status: 'Estado',
      assignedTo: 'Asignado A',
    },
    pipeline: {
      title: 'Pipeline',
      newOpportunity: 'Nueva Oportunidad',
      stages: {
        newLead: 'Nuevo Prospecto',
        contacted: 'Contactado',
        discoveryCall: 'Llamada Descubrimiento',
        proposalSent: 'Propuesta Enviada',
        negotiation: 'Negociación',
        closedWon: 'Cerrado Ganado',
        closedLost: 'Cerrado Perdido',
      },
      tier: 'Nivel',
      value: 'Valor',
      closeDate: 'Fecha de Cierre',
    },
    common: {
      search: 'Buscar...',
      filter: 'Filtrar',
      export: 'Exportar',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      view: 'Ver',
      add: 'Agregar',
      loading: 'Cargando...',
      noData: 'No se encontraron datos',
      actions: 'Acciones',
      today: 'Hoy',
      thisWeek: 'Esta Semana',
      thisMonth: 'Este Mes',
    },
    auth: {
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      hasAccount: '¿Ya tienes una cuenta?',
    },
  },
};
