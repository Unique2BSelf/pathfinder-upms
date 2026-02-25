"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "adjustment";
  description: string;
  created_at: string;
  youth: any;
  created_by_user: any;
}

interface AccountSummary {
  youth_id: string;
  youth_name: string;
  total_deposits: number;
  total_withdrawals: number;
  balance: number;
}

export default function FinancialsAdminPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: txns } = await supabase
        .from("transactions")
        .select("id, amount, type, description, created_at, youth_id, created_by")
        .order("created_at", { ascending: false })
        .limit(200);

      const { data: allTxns } = await supabase.from("transactions").select("amount, type, youth_id");

      const accMap: Record<string, AccountSummary> = {};
      (allTxns || []).forEach((t: any) => {
        if (!accMap[t.youth_id]) accMap[t.youth_id] = { youth_id: t.youth_id, youth_name: "", total_deposits: 0, total_withdrawals: 0, balance: 0 };
        if (t.type === "deposit") accMap[t.youth_id].total_deposits += t.amount;
        else if (t.type === "withdrawal") accMap[t.youth_id].total_withdrawals += t.amount;
        accMap[t.youth_id].balance = accMap[t.youth_id].total_deposits - accMap[t.youth_id].total_withdrawals;
      });

      const youthIds = Object.keys(accMap);
      if (youthIds.length > 0) {
        const { data: youth } = await supabase.from("youth_members").select("id, first_name, last_name").in("id", youthIds);
        (youth || []).forEach((y: any) => { if (accMap[y.id]) accMap[y.id].youth_name = `${y.first_name} ${y.last_name}`; });
      }

      setTransactions(txns || []);
      setAccounts(Object.values(accMap));
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const filteredTxns = transactions.filter(t => {
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesType;
  });

  const totalDeposits = accounts.reduce((sum, a) => sum + a.total_deposits, 0);
  const totalWithdrawals = accounts.reduce((sum, a) => sum + a.total_withdrawals, 0);
  const totalBalance = totalDeposits - totalWithdrawals;

  const exportCSV = () => {
    const headers = ["Date", "Youth ID", "Type", "Amount", "Description"];
    const rows = filteredTxns.map(t => [new Date(t.created_at).toLocaleDateString(), t.youth_id, t.type, t.amount.toFixed(2), t.description || ""]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pathfinder-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Administration</h1>
          <p className="text-slate-400">Overview of all accounts and transactions</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5 text-forest-400" /><span className="text-slate-400">Total Deposits</span></div>
          <div className="text-2xl font-bold text-forest-400">${totalDeposits.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><TrendingDown className="w-5 h-5 text-red-400" /><span className="text-slate-400">Total Withdrawals</span></div>
          <div className="text-2xl font-bold text-red-400">${totalWithdrawals.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-amber-400" /><span className="text-slate-400">Total Balance</span></div>
          <div className="text-2xl font-bold text-amber-400">${totalBalance.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account Balances</h2>
        <table className="w-full">
          <thead className="bg-slate-700"><tr><th className="px-4 py-2 text-left text-sm text-slate-300">Youth Member</th><th className="px-4 py-2 text-right text-sm text-slate-300">Deposits</th><th className="px-4 py-2 text-right text-sm text-slate-300">Withdrawals</th><th className="px-4 py-2 text-right text-sm text-slate-300">Balance</th></tr></thead>
          <tbody className="divide-y divide-slate-700">
            {accounts.map(a => (
              <tr key={a.youth_id} className="hover:bg-slate-750">
                <td className="px-4 py-3 text-white">{a.youth_name || a.youth_id.slice(0,8)}</td>
                <td className="px-4 py-3 text-right text-forest-400">${a.total_deposits.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-red-400">${a.total_withdrawals.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold text-white">${a.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="flex gap-4 mb-4">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
        <div className="space-y-2">
          {filteredTxns.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div><div className="text-white">{t.youth_id?.slice(0,8) || "—"}</div><div className="text-xs text-slate-500">{t.description || t.type} • {new Date(t.created_at).toLocaleDateString()}</div></div>
              <div className={`font-bold ${t.type === "deposit" ? "text-forest-400" : t.type === "withdrawal" ? "text-red-400" : "text-slate-300"}`}>
                {t.type === "deposit" ? "+" : t.type === "withdrawal" ? "-" : ""}${t.amount.toFixed(2)}
              </div>
            </div>
          ))}
          {filteredTxns.length === 0 && <p className="text-slate-500 text-center py-4">No transactions found</p>}
        </div>
      </div>
    </div>
  );
}
