'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@homelab/ui/tabs'
import { Badge } from '@homelab/ui/badge'
import { ArrowLeft, Save, X, FileText, ListChecks, FileCode, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { Alert, AlertDescription, AlertTitle } from '@homelab/ui/alert'
import { AlertTriangle } from 'lucide-react'

// Dynamic import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export default function SpecEditorPage() {
  const params = useParams()
  const router = useRouter()
  const specId = params.id as string

  const [activeTab, setActiveTab] = useState('proposal')
  const [proposalContent, setProposalContent] = useState('')
  const [tasksContent, setTasksContent] = useState('')
  const [designContent, setDesignContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [hasDesignFile, setHasDesignFile] = useState(false)

  const utils = trpc.useUtils()

  // Load spec data
  const { data: spec, isLoading } = trpc.sync.getSpecContent.useQuery(
    { id: specId },
    {
      onSuccess: (data) => {
        setProposalContent(data.proposal || '')
        setTasksContent(data.tasks || '')
        setDesignContent(data.design || '')
        setHasDesignFile(!!data.design)
      },
    }
  )

  // Get spec lifecycle status
  const { data: lifecycleStatus } = trpc.lifecycle.getStatus.useQuery({ specId })

  // Save spec mutation
  const saveSpec = trpc.sync.updateSpecContent.useMutation({
    onSuccess: () => {
      utils.sync.getSpecContent.invalidate({ specId })
      utils.workQueue.getQueue.invalidate()
      setHasChanges(false)
      toast.success('Spec saved and synced to filesystem')
    },
    onError: (error) => {
      toast.error(`Failed to save spec: ${error.message}`)
    },
  })

  // Approve spec mutation
  const approveSpec = trpc.lifecycle.approve.useMutation({
    onSuccess: () => {
      utils.lifecycle.getStatus.invalidate({ specId })
      utils.lifecycle.listByStatus.invalidate()
      utils.workQueue.getQueue.invalidate()
      toast.success('Spec approved and added to work queue')
      router.push('/dashboard?tab=work-queue')
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`)
    },
  })

  const handleSave = () => {
    saveSpec.mutate({
      id: specId,
      proposal: proposalContent,
      tasks: tasksContent,
      design: hasDesignFile ? designContent : undefined,
    })
  }

  const handleSaveAndApprove = async () => {
    // First save the spec
    await saveSpec.mutateAsync({
      id: specId,
      proposal: proposalContent,
      tasks: tasksContent,
      design: hasDesignFile ? designContent : undefined,
    })
    // Then approve it
    approveSpec.mutate({ specId })
  }

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Discard them?')
      if (!confirmed) return
    }
    router.back()
  }

  const handleContentChange = (type: 'proposal' | 'tasks' | 'design', value: string | undefined) => {
    if (type === 'proposal') setProposalContent(value || '')
    if (type === 'tasks') setTasksContent(value || '')
    if (type === 'design') setDesignContent(value || '')
    setHasChanges(true)
  }

  const calculateTaskCompletion = () => {
    if (!tasksContent) return 0
    const totalTasks = (tasksContent.match(/- \[[ x]\]/g) || []).length
    const completedTasks = (tasksContent.match(/- \[x\]/g) || []).length
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  }

  const handleCreateDesign = () => {
    const template = `# Design Document

## Overview
[Brief overview of the design]

## Architecture
[System architecture and component design]

## Database Schema
[Database changes and schema design]

## API Design
[API endpoints and data contracts]

## Security Considerations
[Security implications and mitigations]

## Performance Considerations
[Performance implications and optimizations]
`
    setDesignContent(template)
    setHasDesignFile(true)
    setActiveTab('design')
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading spec...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{specId}</h1>
            <p className="text-sm text-muted-foreground">Spec Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50">
              Unsaved Changes
            </Badge>
          )}
          {lifecycleStatus?.currentState && (
            <Badge variant="outline">
              {lifecycleStatus.currentState}
            </Badge>
          )}
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveSpec.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {lifecycleStatus?.currentState === 'proposing' && (
            <Button
              onClick={handleSaveAndApprove}
              disabled={saveSpec.isPending || approveSpec.isPending}
              variant="default"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save & Approve
            </Button>
          )}
        </div>
      </div>

      {/* Conflict Warning (placeholder for future implementation) */}
      {false && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conflict Detected</AlertTitle>
          <AlertDescription>
            The spec has been modified on the filesystem since you loaded it. Please reload to see
            the latest changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Editor Tabs */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="proposal" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Proposal
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Tasks
                <Badge variant="outline" className="ml-2">
                  {calculateTaskCompletion().toFixed(0)}%
                </Badge>
              </TabsTrigger>
              {hasDesignFile ? (
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Design
                </TabsTrigger>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleCreateDesign}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Create Design
                </Button>
              )}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} className="h-full">
            <TabsContent value="proposal" className="h-full m-0">
              <div className="h-full">
                <MonacoEditor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={proposalContent}
                  onChange={(value) => handleContentChange('proposal', value)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="h-full m-0">
              <div className="h-full">
                <MonacoEditor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={tasksContent}
                  onChange={(value) => handleContentChange('tasks', value)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            </TabsContent>

            {hasDesignFile && (
              <TabsContent value="design" className="h-full m-0">
                <div className="h-full">
                  <MonacoEditor
                    height="100%"
                    language="markdown"
                    theme="vs-dark"
                    value={designContent}
                    onChange={(value) => handleContentChange('design', value)}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
