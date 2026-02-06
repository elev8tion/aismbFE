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
          status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'], description: 'Filter by lead status' },
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
          name: { type: 'string' },
          email: { type: 'string' },
          company: { type: 'string' },
          phone: { type: 'string' },
          source: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
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
          status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] },
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
          stage: { type: 'string', enum: ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
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
          value: { type: 'number', description: 'Deal value in dollars' },
          stage: { type: 'string', enum: ['discovery', 'proposal', 'negotiation'] },
          company_id: { type: 'string' },
          contact_id: { type: 'string' },
        },
        required: ['name', 'value'],
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
          stage: { type: 'string', enum: ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
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
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company_id: { type: 'string' },
          title: { type: 'string' },
        },
        required: ['name'],
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
          industry: { type: 'string' },
          website: { type: 'string' },
          size: { type: 'string' },
        },
        required: ['name'],
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
      description: 'List all partnerships with optional phase filter',
      parameters: {
        type: 'object',
        properties: {
          phase: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_partnership_summary',
      description: 'Get summary of partnerships by phase and health',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_partnership_phase',
      description: 'Update the phase of a partnership',
      parameters: {
        type: 'object',
        properties: {
          partnership_id: { type: 'string' },
          phase: { type: 'string' },
        },
        required: ['partnership_id', 'phase'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_health_score',
      description: 'Update the health score of a partnership',
      parameters: {
        type: 'object',
        properties: {
          partnership_id: { type: 'string' },
          health_score: { type: 'number', description: 'Score from 0-100' },
        },
        required: ['partnership_id', 'health_score'],
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
      name: 'create_task',
      description: 'Create a task/reminder',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List tasks with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
        },
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
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','voice_sessions','roi_calculations','reports_weekly','settings'] },
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
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','voice_sessions','roi_calculations','reports_weekly','settings'] },
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
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','voice_sessions','roi_calculations','reports_weekly','settings'] },
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
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','voice_sessions','roi_calculations','reports_weekly','settings'] },
          id: { type: 'string' },
          query: { type: 'string' },
        },
        oneOf: [
          { required: ['scope','id'] },
          { required: ['scope','query'] },
        ],
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
          scope: { type: 'string', enum: ['leads','contacts','companies','pipeline','bookings','partnerships','voice_sessions','roi_calculations','reports_weekly','settings'] },
          id: { type: 'string' },
          query: { type: 'string' },
        },
        oneOf: [
          { required: ['scope','id'] },
          { required: ['scope','query'] },
        ],
      },
    },
  },
];
