"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Report {
  id: string
  type: string
  model_name: string | null
  details: string
  contact_email: string | null
  status: string
  created_at: string
  user_id: string | null
  admin_notes: string | null
}

export default function ReportsAdminPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [activeTab])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("reports").select("*")

      // Filter based on tab
      if (activeTab !== "all") {
        query = query.eq("status", activeTab)
      }

      // Order by most recent first
      query = query.order("created_at", { ascending: false })

      const { data, error } = await query
      
      if (error) {
        throw error
      }

      setReports(data || [])
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error fetching reports",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reportId)

      if (error) {
        throw error
      }

      // Update local state
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ))

      toast({
        title: "Report updated",
        description: `Report status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating report:", error)
      toast({
        title: "Error updating report",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Report Management</CardTitle>
          <CardDescription>
            Review and respond to user reports about missing or incorrect model data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="w-full">
              {isLoading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">No {activeTab !== "all" ? activeTab : ""} reports found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant={report.type === "missing" ? "outline" : "secondary"}>
                            {report.type === "missing" ? "Missing Data" : "Incorrect Data"}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.model_name || "Not specified"}</TableCell>
                        <TableCell className="max-w-xs truncate">{report.details}</TableCell>
                        <TableCell>{report.contact_email || "Anonymous"}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              report.status === "pending" ? "default" :
                              report.status === "reviewed" ? "outline" :
                              report.status === "resolved" ? "secondary" : "destructive"
                            }
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            defaultValue={report.status} 
                            onValueChange={(value) => updateReportStatus(report.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 