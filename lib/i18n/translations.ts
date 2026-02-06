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
    pipelineOverview: string;
    viewPipeline: string;
    vsLastMonth: string;
    newThisMonth: string;
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
    totalLeads: string;
    new: string;
    contacted: string;
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
    totalPipelineValue: string;
    addDeal: string;
  };
  // Companies
  companies: {
    title: string;
    addCompany: string;
    companiesCount: string;
    employees: string;
    aiMaturityScore: string;
    contacts: string;
    opportunities: string;
    viewDetails: string;
  };
  // Contacts
  contacts: {
    title: string;
    addContact: string;
    contactsCount: string;
    name: string;
    company: string;
    role: string;
    decisionMaker: string;
    yes: string;
    no: string;
  };
  // Partnerships
  partnerships: {
    title: string;
    activePartnerships: string;
    healthScore: string;
    currentPhase: string;
    systemsDelivered: string;
    viewDetails: string;
    scheduleMeeting: string;
    updateProgress: string;
    started: string;
    phases: {
      discover: string;
      coCreate: string;
      deploy: string;
      independent: string;
    };
    tiers: {
      discovery: string;
      foundation: string;
      architect: string;
    };
    statuses: {
      onboarding: string;
      active: string;
      graduated: string;
    };
  };
  // Settings
  settings: {
    title: string;
    profile: string;
    name: string;
    email: string;
    language: string;
    notifications: string;
    emailNotifications: string;
    dailySummary: string;
    voiceAlerts: string;
    healthWarnings: string;
    saveChanges: string;
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
    backTo: string;
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
    signInSubtitle: string;
    createAccount: string;
    fullName: string;
    confirmPassword: string;
    rememberMe: string;
    signingIn: string;
    creatingAccount: string;
    passwordsNoMatch: string;
    passwordMinLength: string;
    failedSignIn: string;
    failedCreateAccount: string;
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
      pipelineOverview: 'Pipeline Overview',
      viewPipeline: 'View Pipeline',
      vsLastMonth: 'vs last month',
      newThisMonth: 'new this month',
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
      totalLeads: 'total leads',
      new: 'New',
      contacted: 'Contacted',
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
      totalPipelineValue: 'Total pipeline value',
      addDeal: '+ Add deal',
    },
    companies: {
      title: 'Companies',
      addCompany: 'Add Company',
      companiesCount: 'companies',
      employees: 'employees',
      aiMaturityScore: 'AI Maturity Score',
      contacts: 'Contacts',
      opportunities: 'Opportunities',
      viewDetails: 'View Details',
    },
    contacts: {
      title: 'Contacts',
      addContact: 'Add Contact',
      contactsCount: 'contacts',
      name: 'Name',
      company: 'Company',
      role: 'Role',
      decisionMaker: 'Decision Maker',
      yes: 'Yes',
      no: 'No',
    },
    partnerships: {
      title: 'Partnerships',
      activePartnerships: 'active partnerships',
      healthScore: 'Health Score',
      currentPhase: 'Current Phase',
      systemsDelivered: 'Systems Delivered',
      viewDetails: 'View Details',
      scheduleMeeting: 'Schedule Meeting',
      updateProgress: 'Update Progress',
      started: 'Started',
      phases: {
        discover: 'Discover',
        coCreate: 'Co-Create',
        deploy: 'Deploy',
        independent: 'Independent',
      },
      tiers: {
        discovery: 'Discovery',
        foundation: 'Foundation',
        architect: 'Architect',
      },
      statuses: {
        onboarding: 'Onboarding',
        active: 'Active',
        graduated: 'Graduated',
      },
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      name: 'Name',
      email: 'Email',
      language: 'Language',
      notifications: 'Notifications',
      emailNotifications: 'Email notifications for new leads',
      dailySummary: 'Daily pipeline summary',
      voiceAlerts: 'Voice session alerts',
      healthWarnings: 'Partnership health warnings',
      saveChanges: 'Save Changes',
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
      backTo: 'Back to AI KRE8TION Partners',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signInSubtitle: 'Sign in to your account',
      createAccount: 'Create your account',
      fullName: 'Full Name',
      confirmPassword: 'Confirm Password',
      rememberMe: 'Remember me',
      signingIn: 'Signing in...',
      creatingAccount: 'Creating account...',
      passwordsNoMatch: 'Passwords do not match',
      passwordMinLength: 'Password must be at least 8 characters',
      failedSignIn: 'Failed to sign in',
      failedCreateAccount: 'Failed to create account',
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
      roiCalculations: 'Cálculos de ROI',
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
      pipelineOverview: 'Resumen del Pipeline',
      viewPipeline: 'Ver Pipeline',
      vsLastMonth: 'vs mes anterior',
      newThisMonth: 'nuevos este mes',
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
      totalLeads: 'prospectos en total',
      new: 'Nuevo',
      contacted: 'Contactado',
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
      totalPipelineValue: 'Valor total del pipeline',
      addDeal: '+ Agregar trato',
    },
    companies: {
      title: 'Empresas',
      addCompany: 'Agregar Empresa',
      companiesCount: 'empresas',
      employees: 'empleados',
      aiMaturityScore: 'Puntaje de Madurez IA',
      contacts: 'Contactos',
      opportunities: 'Oportunidades',
      viewDetails: 'Ver Detalles',
    },
    contacts: {
      title: 'Contactos',
      addContact: 'Agregar Contacto',
      contactsCount: 'contactos',
      name: 'Nombre',
      company: 'Empresa',
      role: 'Cargo',
      decisionMaker: 'Tomador de Decisiones',
      yes: 'Sí',
      no: 'No',
    },
    partnerships: {
      title: 'Asociaciones',
      activePartnerships: 'asociaciones activas',
      healthScore: 'Puntaje de Salud',
      currentPhase: 'Fase Actual',
      systemsDelivered: 'Sistemas Entregados',
      viewDetails: 'Ver Detalles',
      scheduleMeeting: 'Programar Reunión',
      updateProgress: 'Actualizar Progreso',
      started: 'Iniciado',
      phases: {
        discover: 'Descubrir',
        coCreate: 'Co-Crear',
        deploy: 'Implementar',
        independent: 'Independiente',
      },
      tiers: {
        discovery: 'Descubrimiento',
        foundation: 'Base',
        architect: 'Arquitecto',
      },
      statuses: {
        onboarding: 'Incorporación',
        active: 'Activo',
        graduated: 'Graduado',
      },
    },
    settings: {
      title: 'Configuración',
      profile: 'Perfil',
      name: 'Nombre',
      email: 'Correo Electrónico',
      language: 'Idioma',
      notifications: 'Notificaciones',
      emailNotifications: 'Notificaciones por correo para nuevos prospectos',
      dailySummary: 'Resumen diario del pipeline',
      voiceAlerts: 'Alertas de sesiones de voz',
      healthWarnings: 'Advertencias de salud de asociaciones',
      saveChanges: 'Guardar Cambios',
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
      backTo: 'Volver a AI KRE8TION Partners',
    },
    auth: {
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      hasAccount: '¿Ya tienes una cuenta?',
      signInSubtitle: 'Inicia sesión en tu cuenta',
      createAccount: 'Crea tu cuenta',
      fullName: 'Nombre Completo',
      confirmPassword: 'Confirmar Contraseña',
      rememberMe: 'Recordarme',
      signingIn: 'Iniciando sesión...',
      creatingAccount: 'Creando cuenta...',
      passwordsNoMatch: 'Las contraseñas no coinciden',
      passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
      failedSignIn: 'Error al iniciar sesión',
      failedCreateAccount: 'Error al crear la cuenta',
    },
  },
};
