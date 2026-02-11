import type { ChatCompletionTool } from 'openai/resources/chat/completions';

// ─── LEADS ──────────────────────────────────────────────────────────────────
const leadFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_leads',
      description: 'List leads with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'disqualified'], description: 'Filter by lead status' },
          limit: { type: 'number', description: 'Max results to return (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_leads',
      description: 'Search leads by name, email, or company',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'count_leads',
      description: 'Count leads grouped by status',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_lead',
      description: 'Create a new lead record',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Lead email (required)' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          company_name: { type: 'string' },
          phone: { type: 'string' },
          source: { type: 'string', enum: ['voice-agent', 'roi-calculator', 'referral', 'website', 'social-media', 'cold-outreach', 'other'] },
          industry: { type: 'string' },
          employee_count: { type: 'string', enum: ['1-5', '5-10', '10-25', '25-50', '50-100', '100+'] },
        },
        required: ['email', 'source'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_lead_status',
      description: 'Update the status of an existing lead',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'The ID of the lead' },
          status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'disqualified'] },
        },
        required: ['lead_id', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'score_lead',
      description: 'Get the AI-calculated score for a lead',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string' },
        },
        required: ['lead_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lead_summary',
      description: 'Get a summary of all leads with counts by status and recent activity',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ─── BOOKINGS ───────────────────────────────────────────────────────────────
const bookingFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_todays_bookings',
      description: 'Get all bookings scheduled for today',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_bookings',
      description: 'Get upcoming bookings for the next N days',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days ahead to look (default 7)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_bookings',
      description: 'List bookings with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirm_booking',
      description: 'Confirm a pending booking',
      parameters: {
        type: 'object',
        properties: { booking_id: { type: 'string' } },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: 'Cancel a booking',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'block_date',
      description: 'Block a date from accepting new bookings',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          reason: { type: 'string' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unblock_date',
      description: 'Remove a blocked date',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_availability',
      description: 'Get available time slots for a specific date',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_booking_summary',
      description: 'Get a summary of bookings with counts by status',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ─── PIPELINE ───────────────────────────────────────────────────────────────
const pipelineFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_opportunities',
      description: 'List sales pipeline opportunities with optional stage filter',
      parameters: {
        type: 'object',
        properties: {
          stage: { type: 'string', enum: ['new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pipeline_summary',
      description: 'Get pipeline summary with total value and counts by stage',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_opportunity',
      description: 'Create a new pipeline opportunity',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tier: { type: 'string', enum: ['discovery', 'foundation', 'architect'], description: 'Service tier' },
          setup_fee: { type: 'number', description: 'Setup fee in dollars' },
          monthly_fee: { type: 'number', description: 'Monthly fee in dollars' },
          stage: { type: 'string', enum: ['new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'] },
          company_id: { type: 'string' },
          primary_contact_id: { type: 'string' },
          expected_close_date: { type: 'string', description: 'Expected close date YYYY-MM-DD' },
        },
        required: ['name', 'tier', 'setup_fee'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'move_deal',
      description: 'Move a deal to a different pipeline stage',
      parameters: {
        type: 'object',
        properties: {
          opportunity_id: { type: 'string' },
          stage: { type: 'string', enum: ['new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'] },
        },
        required: ['opportunity_id', 'stage'],
      },
    },
  },
];

// ─── CONTACTS ───────────────────────────────────────────────────────────────
const contactFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_contacts',
      description: 'Search contacts by name or email',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contact',
      description: 'Get full details of a contact',
      parameters: {
        type: 'object',
        properties: { contact_id: { type: 'string' } },
        required: ['contact_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contact',
      description: 'Create a new contact',
      parameters: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company_id: { type: 'string', description: 'Company ID (required)' },
          title: { type: 'string' },
          role: { type: 'string' },
          decision_maker: { type: 'number', description: '1 if decision maker, 0 if not' },
        },
        required: ['first_name', 'last_name', 'email', 'company_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_companies',
      description: 'Search companies by name',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_company',
      description: 'Create a new company record',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          industry: { type: 'string', description: 'Industry (required)' },
          employee_count: { type: 'string', enum: ['1-5', '5-10', '10-25', '25-50', '50-100', '100+'], description: 'Employee count range (required)' },
          website: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['name', 'industry', 'employee_count'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_company_contacts',
      description: 'Get all contacts associated with a company',
      parameters: {
        type: 'object',
        properties: { company_id: { type: 'string' } },
        required: ['company_id'],
      },
    },
  },
];

// ─── PARTNERSHIPS ───────────────────────────────────────────────────────────
const partnershipFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_partnerships',
      description: 'List all partnerships with optional phase or status filter',
      parameters: {
        type: 'object',
        properties: {
          phase: { type: 'string', enum: ['discover', 'co-create', 'deploy', 'independent'], description: 'Filter by current phase' },
          status: { type: 'string', description: 'Filter by status (active, onboarding, completed, churned)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_partnership_summary',
      description: 'Get summary of partnerships by phase and satisfaction score',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_partnership_phase',
      description: 'Update the phase of a partnership (discover → co-create → deploy → independent)',
      parameters: {
        type: 'object',
        properties: {
          partnership_id: { type: 'string' },
          phase: { type: 'string', enum: ['discover', 'co-create', 'deploy', 'independent'] },
        },
        required: ['partnership_id', 'phase'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_satisfaction_score',
      description: 'Update the satisfaction score of a partnership',
      parameters: {
        type: 'object',
        properties: {
          partnership_id: { type: 'string' },
          score: { type: 'number', description: 'Score from 0-100' },
        },
        required: ['partnership_id', 'score'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_partnership',
      description: 'Create a new partnership record',
      parameters: {
        type: 'object',
        properties: {
          company_id: { type: 'string', description: 'Company ID (required)' },
          opportunity_id: { type: 'string', description: 'Opportunity ID (required)' },
          tier: { type: 'string', enum: ['discovery', 'foundation', 'architect'], description: 'Service tier' },
          phase: { type: 'string', enum: ['discover', 'co-create', 'deploy', 'independent'], description: 'Initial phase (default discover)' },
          customer_email: { type: 'string', description: 'Customer email for portal access' },
        },
        required: ['company_id', 'opportunity_id', 'tier'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_partner_interaction',
      description: 'Log an interaction or touchpoint with a partner',
      parameters: {
        type: 'object',
        properties: {
          partnership_id: { type: 'string', description: 'ID of the partnership' },
          type: { type: 'string', enum: ['call', 'email', 'meeting', 'note'], description: 'Interaction type' },
          subject: { type: 'string', description: 'Brief subject line (required)' },
          description: { type: 'string', description: 'Details of what happened' },
        },
        required: ['partnership_id', 'type', 'subject'],
      },
    },
  },
];

// ─── ANALYTICS ──────────────────────────────────────────────────────────────
const analyticsFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get overview dashboard statistics (leads, bookings, pipeline value, etc.)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_summary',
      description: 'Get a summary of today\'s activities and metrics',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_activities',
      description: 'Get recent activity log entries',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of activities to return (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_voice_session_insights',
      description: 'Get insights from voice agent sessions (sentiment, topics, conversion)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_roi_calculation_insights',
      description: 'Get insights from ROI calculator usage',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_activity',
      description: 'Log a CRM activity (call, email, meeting, note) linked to a company, contact, opportunity, or partnership',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['call', 'email', 'meeting', 'note'], description: 'Activity type' },
          subject: { type: 'string', description: 'Brief subject line (required)' },
          description: { type: 'string', description: 'Details of what happened' },
          company_id: { type: 'string', description: 'Optional company to link to' },
          contact_id: { type: 'string', description: 'Optional contact to link to' },
          opportunity_id: { type: 'string', description: 'Optional opportunity to link to' },
          partnership_id: { type: 'string', description: 'Optional partnership to link to' },
        },
        required: ['type', 'subject'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_followup',
      description: 'Schedule a follow-up activity linked to a company, contact, or partnership',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string', description: 'Brief subject line (required)' },
          description: { type: 'string', description: 'Details of the follow-up' },
          company_id: { type: 'string', description: 'Optional company to link to' },
          contact_id: { type: 'string', description: 'Optional contact to link to' },
          partnership_id: { type: 'string', description: 'Optional partnership to link to' },
        },
        required: ['subject'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_conversion_rate',
      description: 'Calculate the lead-to-won conversion rate',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_revenue_forecast',
      description: 'Get a weighted pipeline revenue forecast based on deal stages and probabilities',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stale_leads',
      description: 'Find leads with no recent activity, useful for identifying neglected prospects',
      parameters: {
        type: 'object',
        properties: {
          days_inactive: { type: 'number', description: 'Number of days without activity to consider stale (default 14)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_opportunities',
      description: 'Rank opportunities by total contract value',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results (default 10)' },
        },
      },
    },
  },
];

// ─── BULK OPERATIONS ───────────────────────────────────────────────────────
const bulkFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'bulk_update_lead_status',
      description: 'Update the status of multiple leads at once',
      parameters: {
        type: 'object',
        properties: {
          lead_ids: { type: 'array', items: { type: 'string' }, description: 'Array of lead IDs to update' },
          status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] },
        },
        required: ['lead_ids', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bulk_assign_leads',
      description: 'Assign multiple leads to a team member',
      parameters: {
        type: 'object',
        properties: {
          lead_ids: { type: 'array', items: { type: 'string' }, description: 'Array of lead IDs to assign' },
          assignee: { type: 'string', description: 'Name or ID of the team member to assign to' },
        },
        required: ['lead_ids', 'assignee'],
      },
    },
  },
];

// ─── MESSAGING DRAFTS ──────────────────────────────────────────────────────
const messagingFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Generate an email draft for the user to review and send manually',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address or name' },
          subject: { type: 'string', description: 'Email subject line' },
          context: { type: 'string', description: 'What the email should be about' },
        },
        required: ['to', 'subject', 'context'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_sms',
      description: 'Generate a short SMS draft for the user to review and send manually',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient phone number or name' },
          context: { type: 'string', description: 'What the message should say' },
        },
        required: ['to', 'context'],
      },
    },
  },
];

// ─── ROI VOICE CONTROL ─────────────────────────────────────────────────────
const roiFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'run_roi_calculation',
      description: 'Run a tier-aware ROI calculation for a business and save the results. Returns estimated savings, hours saved, tier cost, and payback period.',
      parameters: {
        type: 'object',
        properties: {
          business_name: { type: 'string', description: 'Name of the business' },
          monthly_revenue: { type: 'number', description: 'Monthly revenue in dollars' },
          employee_count: { type: 'number', description: 'Number of employees' },
          industry: { type: 'string', description: 'Industry category (optional)' },
          selected_tier: { type: 'string', enum: ['discovery', 'foundation', 'architect'], description: 'Service tier for the calculation (default: foundation)' },
        },
        required: ['business_name', 'monthly_revenue', 'employee_count'],
      },
    },
  },
];

export const ALL_CRM_FUNCTIONS: ChatCompletionTool[] = [
  ...leadFunctions,
  ...bookingFunctions,
  ...pipelineFunctions,
  ...contactFunctions,
  ...partnershipFunctions,
  ...analyticsFunctions,
  ...bulkFunctions,
  ...messagingFunctions,
  ...roiFunctions,
  // Navigation (client-side actions)
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Navigate the UI to a specific CRM section (client-side). Use when the user asks to open or go to a page.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Destination section to open',
            enum: [
              'dashboard',
              'leads',
              'contacts',
              'companies',
              'pipeline',
              'bookings',
              'bookings_availability',
              'partnerships',
              'drafts',
              'voice_sessions',
              'roi_calculations',
              'reports_weekly',
              'settings'
            ],
          },
        },
        required: ['target'],
      },
    },
  },
  // UI client actions (page-level interactions)
  {
    type: 'function',
    function: {
      name: 'ui_set_filter',
      description: 'Set a page filter (e.g., leads status filter, pipeline stage filter).',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','drafts','voice_sessions','roi_calculations','reports_weekly','settings'] },
          filter: { type: 'string' },
        },
        required: ['scope','filter'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ui_search',
      description: 'Populate the search box on the current page.',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','drafts','voice_sessions','roi_calculations','reports_weekly','settings'] },
          query: { type: 'string' },
        },
        required: ['scope','query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ui_open_new',
      description: 'Open the new record modal/form for the current page (e.g., new lead).',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','drafts','voice_sessions','roi_calculations','reports_weekly','settings'] },
        },
        required: ['scope'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ui_open_edit',
      description: 'Open the edit modal for a specific record by id or fuzzy query (first match).',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','drafts','voice_sessions','roi_calculations','reports_weekly','settings'] },
          id: { type: 'string', description: 'Record ID to edit. Provide id or query, not both.' },
          query: { type: 'string', description: 'Fuzzy search query to find the record. Provide query or id, not both.' },
        },
        required: ['scope'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ui_open_view',
      description: 'Open the view/details modal for a specific record by id or fuzzy query (first match).',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','drafts','voice_sessions','roi_calculations','reports_weekly','settings'] },
          id: { type: 'string', description: 'Record ID to view. Provide id or query, not both.' },
          query: { type: 'string', description: 'Fuzzy search query to find the record. Provide query or id, not both.' },
        },
        required: ['scope'],
      },
    },
  },
];
