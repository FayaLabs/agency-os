import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus } from 'lucide-react'

const contacts = [
  { name: 'Sarah Johnson', company: 'Acme Corp', email: 'sarah@acme.com', stage: 'Proposal', value: '$12,000' },
  { name: 'Mark Chen', company: 'Blue Wave LLC', email: 'mark@bluewave.com', stage: 'Negotiation', value: '$8,500' },
  { name: 'Lisa Park', company: 'Sunrise Media', email: 'lisa@sunrise.com', stage: 'Lead', value: '$3,200' },
  { name: 'Tom Brandt', company: 'TechForward', email: 'tom@techforward.com', stage: 'Closed Won', value: '$22,000' },
  { name: 'Amy Rivera', company: 'Maple Retail', email: 'amy@maple.com', stage: 'Closed Lost', value: '$5,000' },
  { name: 'James Olsen', company: 'Orbit Agency', email: 'james@orbit.com', stage: 'Lead', value: '$6,800' },
]

const stageVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Lead': 'secondary',
  'Proposal': 'outline',
  'Negotiation': 'default',
  'Closed Won': 'default',
  'Closed Lost': 'destructive',
}

export default function CRM() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">{contacts.length} contacts</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search contacts..."
          className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Contacts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium">Company</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-3 font-medium">Stage</th>
                <th className="text-left px-6 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.email} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{c.company}</td>
                  <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{c.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={stageVariant[c.stage] ?? 'outline'}>{c.stage}</Badge>
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
