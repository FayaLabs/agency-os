import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const stats = [
  { title: 'Total Contacts', value: '4,231', change: '+12%', up: true, icon: Users },
  { title: 'Revenue (MRR)', value: '$18,420', change: '+8.2%', up: true, icon: DollarSign },
  { title: 'Pipeline Value', value: '$72,000', change: '+5.1%', up: true, icon: TrendingUp },
  { title: 'Avg. Reputation', value: '4.7', change: '-0.1', up: false, icon: Star },
]

const recent = [
  { name: 'Acme Corp', stage: 'Proposal', value: '$12,000', status: 'Active' },
  { name: 'Blue Wave LLC', stage: 'Negotiation', value: '$8,500', status: 'Active' },
  { name: 'Sunrise Media', stage: 'Lead', value: '$3,200', status: 'New' },
  { name: 'TechForward', stage: 'Closed Won', value: '$22,000', status: 'Won' },
  { name: 'Maple Retail', stage: 'Closed Lost', value: '$5,000', status: 'Lost' },
]

const stageColor: Record<string, string> = {
  'Active': 'bg-blue-100 text-blue-700',
  'New': 'bg-yellow-100 text-yellow-700',
  'Won': 'bg-green-100 text-green-700',
  'Lost': 'bg-red-100 text-red-700',
}

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {s.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="text-left pb-2 font-medium">Company</th>
                <th className="text-left pb-2 font-medium">Stage</th>
                <th className="text-left pb-2 font-medium">Value</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.name} className="border-b last:border-0">
                  <td className="py-3 font-medium text-foreground">{r.name}</td>
                  <td className="py-3 text-muted-foreground">{r.stage}</td>
                  <td className="py-3 text-foreground">{r.value}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColor[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
