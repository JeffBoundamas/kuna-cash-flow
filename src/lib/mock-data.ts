export type AccountType = "Bank" | "Mobile Money" | "Cash" | "Tontine";
export type TransactionStatus = "Planned" | "Realized";
export type CategoryType = "Income" | "Expense";
export type CategoryNature = "Essential" | "Desire" | "Savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  nature: CategoryNature;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;
  label: string;
  status: TransactionStatus;
  date: string;
  smsReference?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  amountLimit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  isEmergencyFund?: boolean;
}

// --- MOCK DATA ---

export const accounts: Account[] = [
  { id: "acc-1", name: "BICEC Courant", type: "Bank", balance: 450000, icon: "landmark" },
  { id: "acc-2", name: "MTN MoMo", type: "Mobile Money", balance: 125000, icon: "smartphone" },
  { id: "acc-3", name: "Orange Money", type: "Mobile Money", balance: 78000, icon: "smartphone" },
  { id: "acc-4", name: "Caisse Maison", type: "Cash", balance: 35000, icon: "wallet" },
];

export const categories: Category[] = [
  { id: "cat-1", name: "Salaire", type: "Income", nature: "Essential" },
  { id: "cat-2", name: "Freelance", type: "Income", nature: "Essential" },
  { id: "cat-3", name: "Loyer", type: "Expense", nature: "Essential" },
  { id: "cat-4", name: "Alimentation", type: "Expense", nature: "Essential" },
  { id: "cat-5", name: "Transport", type: "Expense", nature: "Essential" },
  { id: "cat-6", name: "Électricité", type: "Expense", nature: "Essential" },
  { id: "cat-7", name: "Restaurant", type: "Expense", nature: "Desire" },
  { id: "cat-8", name: "Loisirs", type: "Expense", nature: "Desire" },
  { id: "cat-9", name: "Shopping", type: "Expense", nature: "Desire" },
  { id: "cat-10", name: "Épargne", type: "Expense", nature: "Savings" },
  { id: "cat-11", name: "Investissement", type: "Expense", nature: "Savings" },
  { id: "cat-12", name: "Charge Familiale", type: "Expense", nature: "Desire" },
  { id: "cat-13", name: "Santé", type: "Expense", nature: "Essential" },
  { id: "cat-14", name: "Éducation", type: "Expense", nature: "Essential" },
];

export const transactions: Transaction[] = [
  { id: "tx-1", accountId: "acc-1", categoryId: "cat-1", amount: 350000, label: "Salaire Février", status: "Realized", date: "2026-02-05" },
  { id: "tx-2", accountId: "acc-2", categoryId: "cat-2", amount: 75000, label: "Projet Web client", status: "Realized", date: "2026-02-08" },
  { id: "tx-3", accountId: "acc-1", categoryId: "cat-3", amount: -85000, label: "Loyer Studio", status: "Realized", date: "2026-02-01" },
  { id: "tx-4", accountId: "acc-3", categoryId: "cat-4", amount: -45000, label: "Marché semaine", status: "Realized", date: "2026-02-10" },
  { id: "tx-5", accountId: "acc-2", categoryId: "cat-5", amount: -12000, label: "Taxi + moto", status: "Realized", date: "2026-02-11" },
  { id: "tx-6", accountId: "acc-4", categoryId: "cat-7", amount: -8500, label: "Dîner Le Safoutier", status: "Realized", date: "2026-02-12" },
  { id: "tx-7", accountId: "acc-1", categoryId: "cat-10", amount: -70000, label: "Virement épargne", status: "Realized", date: "2026-02-06" },
  { id: "tx-8", accountId: "acc-2", categoryId: "cat-12", amount: -25000, label: "Aide frère cadet", status: "Realized", date: "2026-02-09" },
  { id: "tx-9", accountId: "acc-3", categoryId: "cat-6", amount: -15000, label: "Facture ENEO", status: "Realized", date: "2026-02-07" },
  { id: "tx-10", accountId: "acc-4", categoryId: "cat-8", amount: -6000, label: "Cinéma Canal Olympia", status: "Realized", date: "2026-02-13" },
];

export const budgets: Budget[] = [
  { id: "bud-1", categoryId: "cat-3", month: 2, year: 2026, amountLimit: 85000 },
  { id: "bud-2", categoryId: "cat-4", month: 2, year: 2026, amountLimit: 60000 },
  { id: "bud-3", categoryId: "cat-5", month: 2, year: 2026, amountLimit: 20000 },
  { id: "bud-4", categoryId: "cat-6", month: 2, year: 2026, amountLimit: 20000 },
  { id: "bud-5", categoryId: "cat-7", month: 2, year: 2026, amountLimit: 15000 },
  { id: "bud-6", categoryId: "cat-8", month: 2, year: 2026, amountLimit: 10000 },
  { id: "bud-7", categoryId: "cat-10", month: 2, year: 2026, amountLimit: 85000 },
  { id: "bud-8", categoryId: "cat-12", month: 2, year: 2026, amountLimit: 30000 },
  { id: "bud-9", categoryId: "cat-13", month: 2, year: 2026, amountLimit: 15000 },
];

export const goals: Goal[] = [
  { id: "goal-1", name: "Fonds d'Urgence", targetAmount: 1200000, currentAmount: 480000, deadline: "2026-12-31", icon: "shield", isEmergencyFund: true },
  { id: "goal-2", name: "Terrain Kribi", targetAmount: 3000000, currentAmount: 750000, deadline: "2028-06-30", icon: "map-pin" },
  { id: "goal-3", name: "Formation Cloud", targetAmount: 250000, currentAmount: 180000, deadline: "2026-06-30", icon: "graduation-cap" },
];

// Cashflow data for bar chart (6 months)
export const cashflowData = [
  { month: "Sep", income: 380000, expenses: 290000 },
  { month: "Oct", income: 350000, expenses: 310000 },
  { month: "Nov", income: 420000, expenses: 285000 },
  { month: "Déc", income: 500000, expenses: 380000 },
  { month: "Jan", income: 360000, expenses: 300000 },
  { month: "Fév", income: 425000, expenses: 266500 },
];

// Helper functions
export const getAccount = (id: string) => accounts.find(a => a.id === id);
export const getCategory = (id: string) => categories.find(c => c.id === id);

export const getTotalBalance = () => accounts.reduce((sum, a) => sum + a.balance, 0);

export const getMonthlyIncome = () =>
  transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

export const getMonthlyExpenses = () =>
  transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

export const getExpensesByNature = () => {
  const result = { Essential: 0, Desire: 0, Savings: 0 };
  transactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      const cat = getCategory(t.categoryId);
      if (cat) result[cat.nature] += Math.abs(t.amount);
    });
  return result;
};
