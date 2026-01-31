export interface FinancialCheck {
  isValid: boolean;
  totalContractValue: number;
  currency: string;
  discrepancies: string[];
  paymentMilestones: {
    description: string;
    amount: number;
    percentage: number;
    dueDate: string;
  }[];
}

export interface Deadline {
  date: string;
  description: string;
  type: 'renewal' | 'compliance' | 'expiration' | 'other';
  isOverdue: boolean;
  daysRemaining: number;
}

export interface ComplianceAlert {
  severity: 'high' | 'medium' | 'low';
  type: 'fine' | 'penalty' | 'obligation';
  description: string;
  responsibleParty: 'us' | 'counterparty' | 'mutual';
}

export interface ContractAnalysis {
  summary: string;
  spellingErrors: { context: string; suggestion: string }[];
  deadlines: Deadline[];
  financials: FinancialCheck;
  complianceAlerts: ComplianceAlert[];
  riskScore: number; // 0 to 100
}

export interface Contract {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'error';
  uploadDate: string;
  source: 'upload' | 'drive';
  analysis?: ContractAnalysis;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  CONTRACT_LIST = 'CONTRACT_LIST',
  CONTRACT_DETAIL = 'CONTRACT_DETAIL',
  TEMPLATE_MANAGER = 'TEMPLATE_MANAGER'
}