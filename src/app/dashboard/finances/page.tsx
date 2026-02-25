"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface TripAccount {
  youth_id: string;
  current_balance: number;
  youth: {
    first_name: string;
    last_name: string;
  };
  transactions: Transaction[];
}

export default function FinancesPage() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<TripAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('role, household_id')
        .eq('id', user.id)
        .single();
      
      if (!userData) return;
      setUserRole(userData.role);
      
      if (['admin', 'superadmin'].includes(userData.role)) {
        const { data: accountsData } = await supabase
          .from('trip_accounts')
          .select(`
            youth_id,
            current_balance,
            youth:youth_members(id, first_name, last_name)
          `);
        
        if (accountsData) {
          const accountsWithTx = await Promise.all(
            accountsData.map(async (acc: any) => {
              const { data: txns } = await supabase
                .from('transactions')
                .select('*')
                .eq('youth_id', acc.youth_id)
                .order('created_at', { ascending: false })
                .limit(10);
              return { ...acc, transactions: txns || [] };
            })
          );
          setAccounts(accountsWithTx);
        }
      } else {
        const { data: youthIds } = await supabase
          .from('youth_members')
          .select('id')
          .eq('household_id', userData.household_id);
        
        if (youthIds) {
          const ids = youthIds.map(y => y.id);
          const { data: accountsData } = await supabase
            .from('trip_accounts')
            .select(`
              youth_id,
              current_balance,
              youth:youth_members(id, first_name, last_name)
            `)
            .in('youth_id', ids);
          
          if (accountsData) {
            const accountsWithTx = await Promise.all(
              accountsData.map(async (acc: any) => {
                const { data: txns } = await supabase
                  .from('transactions')
                  .select('*')
                  .eq('youth_id', acc.youth_id)
                  .order('created_at', { ascending: false })
                  .limit(10);
                return { ...acc, transactions: txns || [] };
              })
            );
            setAccounts(accountsWithTx);
          }
        }
      }
      setLoading(false);
    }
    
    loadData();
  }, [supabase]);
  
  const isAdmin = ['admin', 'superadmin'].includes(userRole || '');
  
  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading finances...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trip Accounts</h1>
          <p className="text-slate-400">Track balances and transactions</p>
        </div>
        {isAdmin && (
          <button className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-500">
            Add Transaction
          </button>
        )}
      </div>
      
      {accounts.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No trip accounts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.youth_id} className="bg-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {account.youth?.first_name} {account.youth?.last_name}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    ${account.current_balance?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-slate-400">Current Balance</p>
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Transactions</h4>
                {account.transactions?.length === 0 ? (
                  <p className="text-sm text-slate-500">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {account.transactions?.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {tx.amount > 0 ? (
                            <TrendingUp className="w-4 h-4 text-forest-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <div>
                            <p className="text-sm text-white">{tx.description}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={tx.amount > 0 ? "text-forest-400" : "text-red-400"}>
                          {tx.amount > 0 ? "+" : ""}${tx.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
