export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    bookings: string;
    leads: string;
    pipeline: string;
    companies: string;
    contacts: string;
    partnerships: string;
    documents: string;
    drafts: string;
    voiceSessions: string;
    roiCalculations: string;
    reports: string;
    helpCenter: string;
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
  // Documents / Contracts
  documents: {
    title: string;
    sendContract: string;
    viewDocuments: string;
    counterSign: string;
    downloadPdf: string;
    statuses: {
      draft: string;
      pending: string;
      clientSigned: string;
      fullyExecuted: string;
    };
    types: {
      msa: string;
      sow: string;
      addendum: string;
    };
    sendModal: {
      title: string;
      description: string;
      clientName: string;
      clientEmail: string;
      send: string;
      sending: string;
    };
    signing: {
      title: string;
      reviewAll: string;
      signBelow: string;
      fullName: string;
      jobTitle: string;
      sign: string;
      signing: string;
      success: string;
      expired: string;
      alreadySigned: string;
      viewedCheck: string;
    };
    templates: string;
    templatesDescription: string;
    preview: string;
    hidePreview: string;
  };
  // Drafts
  drafts: {
    title: string;
    subtitle: string;
    newDraft: string;
    allDrafts: string;
    emails: string;
    sms: string;
    notes: string;
    toRecipient: string;
    subject: string;
    body: string;
    status: string;
    draft: string;
    sent: string;
    archived: string;
    copyToClipboard: string;
    copied: string;
    totalDrafts: string;
    emptyState: string;
    type: string;
    date: string;
    selectType: string;
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
  // Bookings
  bookings: {
    title: string;
    subtitle: string;
    totalBookings: string;
    upcoming: string;
    past: string;
    all: string;
    pending: string;
    confirmed: string;
    cancelled: string;
    guest: string;
    date: string;
    time: string;
    status: string;
    noBookings: string;
    confirmBooking: string;
    cancelBooking: string;
    viewDetails: string;
    availability: string;
    availabilitySubtitle: string;
    weeklyHours: string;
    blockedDates: string;
    addBlockedDate: string;
    removeBlockedDate: string;
    available: string;
    unavailable: string;
    startTime: string;
    endTime: string;
    reason: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    saved: string;
    saveAvailability: string;
    bookingConfirmed: string;
    bookingCancelled: string;
    notes: string;
    phone: string;
    timezone: string;
    duration: string;
    minutesShort: string;
    reschedule: string;
    rescheduleBooking: string;
    newDate: string;
    newTime: string;
  };
  // Voice Sessions
  voiceSessions: {
    title: string;
    subtitle: string;
    totalSessions: string;
    avgDuration: string;
    positiveRate: string;
    questionsAsked: string;
    all: string;
    positive: string;
    neutral: string;
    negative: string;
    english: string;
    spanish: string;
    session: string;
    language: string;
    duration: string;
    questions: string;
    sentiment: string;
    outcome: string;
    topics: string;
    painPoints: string;
    objections: string;
    intents: string;
    device: string;
    referrer: string;
    transcript: string;
    noSessions: string;
    userMessage: string;
    assistantMessage: string;
    actions: string;
    minutes: string;
    seconds: string;
    outcomes: {
      continuedBrowsing: string;
      roiCalculator: string;
      bookingScheduled: string;
      leftSite: string;
      unknown: string;
    };
    sentiments: {
      positive: string;
      neutral: string;
      negative: string;
      mixed: string;
    };
    devices: {
      desktop: string;
      mobile: string;
      tablet: string;
    };
  };
  // ROI Calculations
  roiCalculations: {
    title: string;
    subtitle: string;
    totalCalculations: string;
    avgROI: string;
    emailsCaptured: string;
    popularTier: string;
    all: string;
    withEmail: string;
    reportRequested: string;
    industry: string;
    employees: string;
    hourlyRate: string;
    weeklyHours: string;
    selectedTier: string;
    projectedROI: string;
    email: string;
    timeSaved: string;
    weeklyValue: string;
    totalValue: string;
    investment: string;
    paybackWeeks: string;
    timeOnCalc: string;
    adjustments: string;
    reportSent: string;
    noCalculations: string;
    calculationDetails: string;
    inputParameters: string;
    projectedResults: string;
    perWeek: string;
    weeks: string;
    tiers: {
      discovery: string;
      foundation: string;
      architect: string;
    };
  };
  // Payments
  payments: {
    collectPayment: string;
    payNow: string;
    paymentSuccess: string;
    paymentFailed: string;
    thankYou: string;
    paymentReceived: string;
    amount: string;
    receiptNote: string;
    nextSteps: string;
    backToPipeline: string;
    backToPartnerships: string;
    viewDashboard: string;
    processing: string;
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
    creating: string;
    created: string;
    saving: string;
    saved: string;
    required: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    website: string;
    industry: string;
    selectIndustry: string;
    selectSource: string;
    selectTier: string;
    selectStage: string;
    selectRole: string;
    selectCompany: string;
    selectContact: string;
    companyName: string;
    name: string;
    notes: string;
  };
  // Customer Portal
  portal: {
    title: string;
    welcome: string;
    customerPortal: string;
    nav: {
      dashboard: string;
      documents: string;
      meetings: string;
      settings: string;
      signOut: string;
    };
    partnershipProgress: string;
    phase: string;
    healthScore: string;
    systems: string;
    systemStatus: {
      live: string;
      building: string;
      planned: string;
    };
    hoursSaved: string;
    documents: string;
    noContracts: string;
    upcoming: string;
    noMeetings: string;
    noAccess: string;
    noAccessMessage: string;
    grantAccess: string;
    grantAccessTitle: string;
    customerUserId: string;
    accessLevel: string;
    granting: string;
    accessGranted: string;
    settings: {
      profile: string;
      displayName: string;
      email: string;
      phone: string;
      timezone: string;
      language: string;
      notifications: string;
      meetingReminders: string;
      systemUpdates: string;
      accountInfo: string;
      partnershipTier: string;
      partnershipStatus: string;
      memberSince: string;
      role: string;
      security: string;
      changePassword: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
      passwordChanged: string;
      passwordError: string;
      updating: string;
      support: string;
      contactSupport: string;
      contactSupportMessage: string;
    };
  };
  // Unauthorized
  unauthorized: string;
  unauthorizedMessage: string;
  backToLogin: string;
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
  // Billing
  billing: {
    sendSetupInvoice: string;
    viewInvoices: string;
    invoiceSent: string;
    setupPaid: string;
    notInvoiced: string;
    monthlyActive: string;
    pastDue: string;
    notStarted: string;
    confirmSendInvoice: string;
    invoiceAmount: string;
    sendInvoice: string;
    invoiceHistory: string;
    invoiceDate: string;
    invoiceStatus: string;
    invoiceNumber: string;
    paid: string;
    open: string;
    void: string;
    overdue: string;
    setupFee: string;
    monthlyPartnership: string;
  };
  // Voice Operator
  voiceAgent: {
    states: {
      idle: { title: string; description: string };
      listening: { title: string; description: string };
      processing: { title: string; description: string };
      speaking: { title: string; description: string };
    };
    transcript: string;
    aiResponse: string;
    yourQuestion: string;
    autoClose: {
      prompt: string;
      seconds: string;
      askAnother: string;
      stayOpen: string;
    };
    buttons: {
      stop: string;
      close: string;
    };
    errors: {
      notSupported: string;
    };
  };
}

export const translations: Record<'en' | 'es', Translations> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      bookings: 'Bookings',
      leads: 'Leads',
      pipeline: 'Pipeline',
      companies: 'Companies',
      contacts: 'Contacts',
      partnerships: 'Partnerships',
      documents: 'Documents',
      drafts: 'Drafts',
      voiceSessions: 'Voice Sessions',
      roiCalculations: 'ROI Calculations',
      reports: 'Reports',
      helpCenter: 'Help Center',
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
    documents: {
      title: 'Documents & Contracts',
      sendContract: 'Send Contract',
      viewDocuments: 'View Documents',
      counterSign: 'Counter-Sign',
      downloadPdf: 'Download PDF',
      statuses: {
        draft: 'Draft',
        pending: 'Pending Signature',
        clientSigned: 'Client Signed',
        fullyExecuted: 'Fully Executed',
      },
      types: {
        msa: 'Master Services Agreement',
        sow: 'Statement of Work',
        addendum: 'AI & Automation Addendum',
      },
      sendModal: {
        title: 'Send Contract Package',
        description: 'Send the MSA, SOW, and AI Addendum for e-signature.',
        clientName: 'Client Name',
        clientEmail: 'Client Email',
        send: 'Send for Signature',
        sending: 'Sending...',
      },
      signing: {
        title: 'Contract Signing',
        reviewAll: 'Please review all documents before signing.',
        signBelow: 'Sign below to accept all documents.',
        fullName: 'Full Legal Name',
        jobTitle: 'Job Title',
        sign: 'Sign Documents',
        signing: 'Signing...',
        success: 'Documents signed successfully!',
        expired: 'This signing link has expired. Please contact us for a new one.',
        alreadySigned: 'These documents have already been signed.',
        viewedCheck: 'Reviewed',
      },
      templates: 'Contract Templates',
      templatesDescription: 'Preview the standard contract documents sent to partners',
      preview: 'Preview',
      hidePreview: 'Hide Preview',
    },
    drafts: {
      title: 'Drafts',
      subtitle: 'Manage your email, SMS, and note drafts',
      newDraft: 'New Draft',
      allDrafts: 'All Drafts',
      emails: 'Emails',
      sms: 'SMS',
      notes: 'Notes',
      toRecipient: 'To',
      subject: 'Subject',
      body: 'Body',
      status: 'Status',
      draft: 'Draft',
      sent: 'Sent',
      archived: 'Archived',
      copyToClipboard: 'Copy to Clipboard',
      copied: 'Copied!',
      totalDrafts: 'total drafts',
      emptyState: 'No drafts yet. Use the voice agent or create one manually.',
      type: 'Type',
      date: 'Date',
      selectType: 'Select type',
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
    bookings: {
      title: 'Bookings',
      subtitle: 'Manage your strategy call bookings',
      totalBookings: 'total bookings',
      upcoming: 'Upcoming',
      past: 'Past',
      all: 'All',
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      guest: 'Guest',
      date: 'Date',
      time: 'Time',
      status: 'Status',
      noBookings: 'No bookings found',
      confirmBooking: 'Confirm',
      cancelBooking: 'Cancel',
      viewDetails: 'View Details',
      availability: 'Availability',
      availabilitySubtitle: 'Set your weekly hours and blocked dates',
      weeklyHours: 'Weekly Hours',
      blockedDates: 'Blocked Dates',
      addBlockedDate: 'Block Date',
      removeBlockedDate: 'Remove',
      available: 'Available',
      unavailable: 'Unavailable',
      startTime: 'Start',
      endTime: 'End',
      reason: 'Reason',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      saved: 'Changes saved',
      saveAvailability: 'Save Availability',
      bookingConfirmed: 'Booking confirmed',
      bookingCancelled: 'Booking cancelled',
      notes: 'Notes',
      phone: 'Phone',
      timezone: 'Timezone',
      duration: 'Duration',
      minutesShort: 'min',
      reschedule: 'Reschedule Booking',
      rescheduleBooking: 'Reschedule',
      newDate: 'New Date',
      newTime: 'New Start Time',
    },
    voiceSessions: {
      title: 'Voice Sessions',
      subtitle: 'AI voice agent conversations from your landing page',
      totalSessions: 'Total Sessions',
      avgDuration: 'Avg Duration',
      positiveRate: 'Positive Rate',
      questionsAsked: 'Questions Asked',
      all: 'All',
      positive: 'Positive',
      neutral: 'Neutral',
      negative: 'Negative',
      english: 'English',
      spanish: 'Spanish',
      session: 'Session',
      language: 'Language',
      duration: 'Duration',
      questions: 'Questions',
      sentiment: 'Sentiment',
      outcome: 'Outcome',
      topics: 'Topics',
      painPoints: 'Pain Points',
      objections: 'Objections',
      intents: 'Intents',
      device: 'Device',
      referrer: 'Referrer',
      transcript: 'Transcript',
      noSessions: 'No voice sessions yet',
      userMessage: 'Visitor',
      assistantMessage: 'AI Agent',
      actions: 'Actions Taken',
      minutes: 'min',
      seconds: 'sec',
      outcomes: {
        continuedBrowsing: 'Continued Browsing',
        roiCalculator: 'Used ROI Calculator',
        bookingScheduled: 'Booked a Call',
        leftSite: 'Left Site',
        unknown: 'Unknown',
      },
      sentiments: {
        positive: 'Positive',
        neutral: 'Neutral',
        negative: 'Negative',
        mixed: 'Mixed',
      },
      devices: {
        desktop: 'Desktop',
        mobile: 'Mobile',
        tablet: 'Tablet',
      },
    },
    roiCalculations: {
      title: 'ROI Calculations',
      subtitle: 'ROI calculator submissions from prospects',
      totalCalculations: 'Total Calculations',
      avgROI: 'Avg ROI',
      emailsCaptured: 'Emails Captured',
      popularTier: 'Most Popular Tier',
      all: 'All',
      withEmail: 'With Email',
      reportRequested: 'Report Requested',
      industry: 'Industry',
      employees: 'Employees',
      hourlyRate: 'Hourly Rate',
      weeklyHours: 'Weekly Admin Hours',
      selectedTier: 'Selected Tier',
      projectedROI: 'Projected ROI',
      email: 'Email',
      timeSaved: 'Time Saved',
      weeklyValue: 'Weekly Value',
      totalValue: 'Total Value',
      investment: 'Investment',
      paybackWeeks: 'Payback Period',
      timeOnCalc: 'Time on Calculator',
      adjustments: 'Adjustments',
      reportSent: 'Report Sent',
      noCalculations: 'No ROI calculations yet',
      calculationDetails: 'Calculation Details',
      inputParameters: 'Input Parameters',
      projectedResults: 'Projected Results',
      perWeek: '/week',
      weeks: 'weeks',
      tiers: {
        discovery: 'Discovery',
        foundation: 'Foundation',
        architect: 'Architect',
      },
    },
    payments: {
      collectPayment: 'Collect Payment',
      payNow: 'Pay Now',
      paymentSuccess: 'Payment Successful',
      paymentFailed: 'Payment Failed',
      thankYou: 'Thank you for your payment!',
      paymentReceived: 'Your payment has been received and processed.',
      amount: 'Amount',
      receiptNote: 'A receipt has been sent to your email.',
      nextSteps: 'Next Steps',
      backToPipeline: 'Back to Pipeline',
      backToPartnerships: 'Back to Partnerships',
      viewDashboard: 'View Dashboard',
      processing: 'Processing...',
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
      creating: 'Creating...',
      created: 'Created successfully',
      saving: 'Saving...',
      saved: 'Saved successfully',
      required: 'Required',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      website: 'Website',
      industry: 'Industry',
      selectIndustry: 'Select industry',
      selectSource: 'Select source',
      selectTier: 'Select tier',
      selectStage: 'Select stage',
      selectRole: 'Select role',
      selectCompany: 'Select company',
      selectContact: 'Select contact',
      companyName: 'Company Name',
      name: 'Name',
      notes: 'Notes',
    },
    portal: {
      title: 'Customer Portal',
      welcome: 'Welcome',
      customerPortal: 'Customer Portal',
      nav: {
        dashboard: 'Dashboard',
        documents: 'Documents',
        meetings: 'Meetings',
        settings: 'Settings',
        signOut: 'Sign Out',
      },
      partnershipProgress: 'Partnership Progress',
      phase: 'Phase',
      healthScore: 'Health Score',
      systems: 'Systems',
      systemStatus: {
        live: 'Live',
        building: 'Building',
        planned: 'Planned',
      },
      hoursSaved: 'Hours Saved / Week',
      documents: 'Documents',
      noContracts: 'No contracts found.',
      upcoming: 'Upcoming Meetings',
      noMeetings: 'No upcoming meetings.',
      noAccess: 'No Access',
      noAccessMessage: 'You have not been granted access to any partnership yet. Please contact your administrator.',
      grantAccess: 'Grant Access',
      grantAccessTitle: 'Grant Customer Access',
      customerUserId: 'Customer User ID',
      accessLevel: 'Access Level',
      granting: 'Granting...',
      accessGranted: 'Access granted successfully',
      settings: {
        profile: 'Profile',
        displayName: 'Display Name',
        email: 'Email',
        phone: 'Phone',
        timezone: 'Timezone',
        language: 'Language',
        notifications: 'Notifications',
        meetingReminders: 'Meeting reminders',
        systemUpdates: 'System update notifications',
        accountInfo: 'Account Information',
        partnershipTier: 'Partnership Tier',
        partnershipStatus: 'Partnership Status',
        memberSince: 'Member Since',
        role: 'Role',
        security: 'Security',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        passwordChanged: 'Password changed successfully',
        passwordError: 'Failed to change password. Check your current password.',
        updating: 'Updating...',
        support: 'Support',
        contactSupport: 'Contact Support',
        contactSupportMessage: 'Need help? Reach out to your partnership manager.',
      },
    },
    unauthorized: 'Access Denied',
    unauthorizedMessage: 'Your account does not have permission to access this application. Please contact an administrator if you believe this is an error.',
    backToLogin: 'Back to Login',
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
    billing: {
      sendSetupInvoice: 'Send Setup Invoice',
      viewInvoices: 'View Invoices',
      invoiceSent: 'Invoice Sent',
      setupPaid: 'Setup Paid',
      notInvoiced: 'Not Invoiced',
      monthlyActive: 'Active',
      pastDue: 'Past Due',
      notStarted: 'Not Started',
      confirmSendInvoice: 'Send a setup invoice to this client?',
      invoiceAmount: 'Invoice Amount',
      sendInvoice: 'Send Invoice',
      invoiceHistory: 'Invoice History',
      invoiceDate: 'Date',
      invoiceStatus: 'Status',
      invoiceNumber: 'Invoice #',
      paid: 'Paid',
      open: 'Open',
      void: 'Void',
      overdue: 'Overdue',
      setupFee: 'Setup Fee',
      monthlyPartnership: 'Monthly Partnership',
    },
    voiceAgent: {
      states: {
        idle: { title: 'Voice Operator', description: 'Tap to start speaking' },
        listening: { title: 'Listening...', description: 'Speak your command' },
        processing: { title: 'Processing Your Question...', description: 'Analyzing and preparing response...' },
        speaking: { title: 'AI Response', description: 'Listen or read below ↓' },
      },
      transcript: 'You said:',
      aiResponse: 'AI Response:',
      yourQuestion: 'Your Question:',
      autoClose: {
        prompt: 'Need anything else?',
        seconds: 'seconds',
        askAnother: 'Ask another',
        stayOpen: 'Stay open',
      },
      buttons: {
        stop: 'Done speaking',
        close: 'Close',
      },
      errors: {
        notSupported: 'Voice not supported in this browser',
      },
    },
  },
  es: {
    nav: {
      dashboard: 'Panel',
      bookings: 'Reservas',
      leads: 'Prospectos',
      pipeline: 'Pipeline',
      companies: 'Empresas',
      contacts: 'Contactos',
      partnerships: 'Asociaciones',
      documents: 'Documentos',
      drafts: 'Borradores',
      voiceSessions: 'Sesiones de Voz',
      roiCalculations: 'Cálculos de ROI',
      reports: 'Informes',
      helpCenter: 'Centro de Ayuda',
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
    documents: {
      title: 'Documentos y Contratos',
      sendContract: 'Enviar Contrato',
      viewDocuments: 'Ver Documentos',
      counterSign: 'Contrafirmar',
      downloadPdf: 'Descargar PDF',
      statuses: {
        draft: 'Borrador',
        pending: 'Pendiente de Firma',
        clientSigned: 'Firmado por Cliente',
        fullyExecuted: 'Completamente Ejecutado',
      },
      types: {
        msa: 'Acuerdo Marco de Servicios',
        sow: 'Declaracion de Trabajo',
        addendum: 'Adenda de IA y Automatizacion',
      },
      sendModal: {
        title: 'Enviar Paquete de Contrato',
        description: 'Enviar el MSA, SOW y Adenda de IA para firma electronica.',
        clientName: 'Nombre del Cliente',
        clientEmail: 'Correo del Cliente',
        send: 'Enviar para Firma',
        sending: 'Enviando...',
      },
      signing: {
        title: 'Firma de Contrato',
        reviewAll: 'Por favor revise todos los documentos antes de firmar.',
        signBelow: 'Firme abajo para aceptar todos los documentos.',
        fullName: 'Nombre Legal Completo',
        jobTitle: 'Titulo del Cargo',
        sign: 'Firmar Documentos',
        signing: 'Firmando...',
        success: 'Documentos firmados exitosamente!',
        expired: 'Este enlace de firma ha expirado. Por favor contactenos para uno nuevo.',
        alreadySigned: 'Estos documentos ya han sido firmados.',
        viewedCheck: 'Revisado',
      },
      templates: 'Plantillas de Contrato',
      templatesDescription: 'Vista previa de los documentos de contrato estándar enviados a socios',
      preview: 'Vista Previa',
      hidePreview: 'Ocultar Vista Previa',
    },
    drafts: {
      title: 'Borradores',
      subtitle: 'Gestiona tus borradores de email, SMS y notas',
      newDraft: 'Nuevo Borrador',
      allDrafts: 'Todos los Borradores',
      emails: 'Emails',
      sms: 'SMS',
      notes: 'Notas',
      toRecipient: 'Para',
      subject: 'Asunto',
      body: 'Cuerpo',
      status: 'Estado',
      draft: 'Borrador',
      sent: 'Enviado',
      archived: 'Archivado',
      copyToClipboard: 'Copiar al Portapapeles',
      copied: '¡Copiado!',
      totalDrafts: 'borradores en total',
      emptyState: 'No hay borradores aún. Usa el agente de voz o crea uno manualmente.',
      type: 'Tipo',
      date: 'Fecha',
      selectType: 'Seleccionar tipo',
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
    bookings: {
      title: 'Reservas',
      subtitle: 'Gestiona tus reservas de llamadas estratégicas',
      totalBookings: 'reservas en total',
      upcoming: 'Próximas',
      past: 'Pasadas',
      all: 'Todas',
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      guest: 'Invitado',
      date: 'Fecha',
      time: 'Hora',
      status: 'Estado',
      noBookings: 'No se encontraron reservas',
      confirmBooking: 'Confirmar',
      cancelBooking: 'Cancelar',
      viewDetails: 'Ver Detalles',
      availability: 'Disponibilidad',
      availabilitySubtitle: 'Configura tu horario semanal y fechas bloqueadas',
      weeklyHours: 'Horario Semanal',
      blockedDates: 'Fechas Bloqueadas',
      addBlockedDate: 'Bloquear Fecha',
      removeBlockedDate: 'Eliminar',
      available: 'Disponible',
      unavailable: 'No Disponible',
      startTime: 'Inicio',
      endTime: 'Fin',
      reason: 'Motivo',
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
      saved: 'Cambios guardados',
      saveAvailability: 'Guardar Disponibilidad',
      bookingConfirmed: 'Reserva confirmada',
      bookingCancelled: 'Reserva cancelada',
      notes: 'Notas',
      phone: 'Teléfono',
      timezone: 'Zona Horaria',
      duration: 'Duración',
      minutesShort: 'min',
      reschedule: 'Reprogramar Reserva',
      rescheduleBooking: 'Reprogramar',
      newDate: 'Nueva Fecha',
      newTime: 'Nueva Hora de Inicio',
    },
    voiceSessions: {
      title: 'Sesiones de Voz',
      subtitle: 'Conversaciones del agente de voz IA desde tu landing page',
      totalSessions: 'Total de Sesiones',
      avgDuration: 'Duración Promedio',
      positiveRate: 'Tasa Positiva',
      questionsAsked: 'Preguntas Hechas',
      all: 'Todas',
      positive: 'Positiva',
      neutral: 'Neutral',
      negative: 'Negativa',
      english: 'Inglés',
      spanish: 'Español',
      session: 'Sesión',
      language: 'Idioma',
      duration: 'Duración',
      questions: 'Preguntas',
      sentiment: 'Sentimiento',
      outcome: 'Resultado',
      topics: 'Temas',
      painPoints: 'Puntos de Dolor',
      objections: 'Objeciones',
      intents: 'Intenciones',
      device: 'Dispositivo',
      referrer: 'Referencia',
      transcript: 'Transcripción',
      noSessions: 'No hay sesiones de voz aún',
      userMessage: 'Visitante',
      assistantMessage: 'Agente IA',
      actions: 'Acciones Realizadas',
      minutes: 'min',
      seconds: 'seg',
      outcomes: {
        continuedBrowsing: 'Siguió Navegando',
        roiCalculator: 'Usó Calculadora ROI',
        bookingScheduled: 'Reservó una Llamada',
        leftSite: 'Abandonó el Sitio',
        unknown: 'Desconocido',
      },
      sentiments: {
        positive: 'Positivo',
        neutral: 'Neutral',
        negative: 'Negativo',
        mixed: 'Mixto',
      },
      devices: {
        desktop: 'Escritorio',
        mobile: 'Móvil',
        tablet: 'Tableta',
      },
    },
    roiCalculations: {
      title: 'Cálculos de ROI',
      subtitle: 'Cálculos de ROI enviados por prospectos',
      totalCalculations: 'Total de Cálculos',
      avgROI: 'ROI Promedio',
      emailsCaptured: 'Emails Capturados',
      popularTier: 'Nivel Más Popular',
      all: 'Todos',
      withEmail: 'Con Email',
      reportRequested: 'Informe Solicitado',
      industry: 'Industria',
      employees: 'Empleados',
      hourlyRate: 'Tarifa por Hora',
      weeklyHours: 'Horas Admin Semanales',
      selectedTier: 'Nivel Seleccionado',
      projectedROI: 'ROI Proyectado',
      email: 'Email',
      timeSaved: 'Tiempo Ahorrado',
      weeklyValue: 'Valor Semanal',
      totalValue: 'Valor Total',
      investment: 'Inversión',
      paybackWeeks: 'Período de Retorno',
      timeOnCalc: 'Tiempo en Calculadora',
      adjustments: 'Ajustes',
      reportSent: 'Informe Enviado',
      noCalculations: 'No hay cálculos de ROI aún',
      calculationDetails: 'Detalles del Cálculo',
      inputParameters: 'Parámetros de Entrada',
      projectedResults: 'Resultados Proyectados',
      perWeek: '/semana',
      weeks: 'semanas',
      tiers: {
        discovery: 'Descubrimiento',
        foundation: 'Base',
        architect: 'Arquitecto',
      },
    },
    payments: {
      collectPayment: 'Cobrar Pago',
      payNow: 'Pagar Ahora',
      paymentSuccess: 'Pago Exitoso',
      paymentFailed: 'Pago Fallido',
      thankYou: '¡Gracias por tu pago!',
      paymentReceived: 'Tu pago ha sido recibido y procesado.',
      amount: 'Monto',
      receiptNote: 'Se ha enviado un recibo a tu correo electrónico.',
      nextSteps: 'Próximos Pasos',
      backToPipeline: 'Volver al Pipeline',
      backToPartnerships: 'Volver a Asociaciones',
      viewDashboard: 'Ver Panel',
      processing: 'Procesando...',
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
      creating: 'Creando...',
      created: 'Creado exitosamente',
      saving: 'Guardando...',
      saved: 'Guardado exitosamente',
      required: 'Requerido',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      website: 'Sitio Web',
      industry: 'Industria',
      selectIndustry: 'Seleccionar industria',
      selectSource: 'Seleccionar fuente',
      selectTier: 'Seleccionar nivel',
      selectStage: 'Seleccionar etapa',
      selectRole: 'Seleccionar cargo',
      selectCompany: 'Seleccionar empresa',
      selectContact: 'Seleccionar contacto',
      companyName: 'Nombre de Empresa',
      name: 'Nombre',
      notes: 'Notas',
    },
    portal: {
      title: 'Portal del Cliente',
      welcome: 'Bienvenido',
      customerPortal: 'Portal del Cliente',
      nav: {
        dashboard: 'Panel',
        documents: 'Documentos',
        meetings: 'Reuniones',
        settings: 'Configuración',
        signOut: 'Cerrar Sesión',
      },
      partnershipProgress: 'Progreso de la Asociación',
      phase: 'Fase',
      healthScore: 'Puntaje de Salud',
      systems: 'Sistemas',
      systemStatus: {
        live: 'En Vivo',
        building: 'En Construcción',
        planned: 'Planeado',
      },
      hoursSaved: 'Horas Ahorradas / Semana',
      documents: 'Documentos',
      noContracts: 'No se encontraron contratos.',
      upcoming: 'Próximas Reuniones',
      noMeetings: 'No hay reuniones próximas.',
      noAccess: 'Sin Acceso',
      noAccessMessage: 'Aún no se te ha otorgado acceso a ninguna asociación. Por favor contacta a tu administrador.',
      grantAccess: 'Otorgar Acceso',
      grantAccessTitle: 'Otorgar Acceso al Cliente',
      customerUserId: 'ID de Usuario del Cliente',
      accessLevel: 'Nivel de Acceso',
      granting: 'Otorgando...',
      accessGranted: 'Acceso otorgado exitosamente',
      settings: {
        profile: 'Perfil',
        displayName: 'Nombre para Mostrar',
        email: 'Correo Electrónico',
        phone: 'Teléfono',
        timezone: 'Zona Horaria',
        language: 'Idioma',
        notifications: 'Notificaciones',
        meetingReminders: 'Recordatorios de reuniones',
        systemUpdates: 'Notificaciones de actualizaciones del sistema',
        accountInfo: 'Información de la Cuenta',
        partnershipTier: 'Nivel de Asociación',
        partnershipStatus: 'Estado de la Asociación',
        memberSince: 'Miembro Desde',
        role: 'Rol',
        security: 'Seguridad',
        changePassword: 'Cambiar Contraseña',
        currentPassword: 'Contraseña Actual',
        newPassword: 'Nueva Contraseña',
        confirmPassword: 'Confirmar Nueva Contraseña',
        passwordChanged: 'Contraseña cambiada exitosamente',
        passwordError: 'Error al cambiar la contraseña. Verifica tu contraseña actual.',
        updating: 'Actualizando...',
        support: 'Soporte',
        contactSupport: 'Contactar Soporte',
        contactSupportMessage: 'Necesitas ayuda? Comunícate con tu gerente de asociación.',
      },
    },
    unauthorized: 'Acceso Denegado',
    unauthorizedMessage: 'Tu cuenta no tiene permiso para acceder a esta aplicación. Contacta a un administrador si crees que esto es un error.',
    backToLogin: 'Volver al Inicio de Sesión',
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
    billing: {
      sendSetupInvoice: 'Enviar Factura de Inicio',
      viewInvoices: 'Ver Facturas',
      invoiceSent: 'Factura Enviada',
      setupPaid: 'Inicio Pagado',
      notInvoiced: 'Sin Facturar',
      monthlyActive: 'Activo',
      pastDue: 'Vencido',
      notStarted: 'No Iniciado',
      confirmSendInvoice: 'Enviar factura de inicio a este cliente?',
      invoiceAmount: 'Monto de Factura',
      sendInvoice: 'Enviar Factura',
      invoiceHistory: 'Historial de Facturas',
      invoiceDate: 'Fecha',
      invoiceStatus: 'Estado',
      invoiceNumber: 'Factura #',
      paid: 'Pagado',
      open: 'Abierto',
      void: 'Anulado',
      overdue: 'Vencido',
      setupFee: 'Tarifa de Inicio',
      monthlyPartnership: 'Asociación Mensual',
    },
    voiceAgent: {
      states: {
        idle: { title: 'Operador de Voz', description: 'Toca para hablar' },
        listening: { title: 'Escuchando...', description: 'Di tu comando' },
        processing: { title: 'Procesando Tu Pregunta...', description: 'Analizando y preparando respuesta...' },
        speaking: { title: 'Respuesta de IA', description: 'Escucha o lee abajo ↓' },
      },
      transcript: 'Dijiste:',
      aiResponse: 'Respuesta de IA:',
      yourQuestion: 'Tu Pregunta:',
      autoClose: {
        prompt: 'Necesitas algo mas?',
        seconds: 'segundos',
        askAnother: 'Preguntar otra cosa',
        stayOpen: 'Mantener abierto',
      },
      buttons: {
        stop: 'Listo',
        close: 'Cerrar',
      },
      errors: {
        notSupported: 'Voz no soportada en este navegador',
      },
    },
  },
};
