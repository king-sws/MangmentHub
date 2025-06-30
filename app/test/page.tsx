/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, CheckCircle, XCircle, AlertCircle, Bug, Settings, Key, Database, Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AuditLogsDebugger = () => {
  const [testResults, setTestResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tester')
  const [adminKey, setAdminKey] = useState('')
  const [customParams, setCustomParams] = useState({
    type: 'audit',
    page: '1',
    limit: '10',
    category: '',
    severity: '',
    search: ''
  })

  const debugTests = [
    {
      name: 'API Route Check',
      url: '/api/admin/audit-logs',
      description: 'Check if the API route exists and responds',
      method: 'HEAD'
    },
    {
      name: 'Basic Request (No Auth)',
      url: '/api/admin/audit-logs?type=audit&page=1&limit=5',
      description: 'Test without authentication to see error response'
    },
    {
      name: 'With Admin Key',
      url: '/api/admin/audit-logs?type=audit&page=1&limit=5',
      description: 'Test with adminKey parameter',
      useAdminKey: true
    },
    {
      name: 'Security Events',
      url: '/api/admin/audit-logs?type=security&page=1&limit=5',
      description: 'Test security events endpoint',
      useAdminKey: true
    },
    {
      name: 'Invalid Parameters (Fixed)',
      url: '/api/admin/audit-logs?type=invalid&page=1&limit=50',
      description: 'Test with corrected parameters (page >= 1, limit <= 100)'
    },
    {
      name: 'Valid Category Filter',
      url: '/api/admin/audit-logs?type=audit&page=1&limit=5&category=ADMIN',
      description: 'Test with valid category filter',
      useAdminKey: true
    },
    {
      name: 'Valid Severity Filter',
      url: '/api/admin/audit-logs?type=security&page=1&limit=5&severity=HIGH',
      description: 'Test with valid severity filter',
      useAdminKey: true
    },
    {
      name: 'Database Connection Test',
      url: '/api/admin/audit-logs?type=audit&page=1&limit=1',
      description: 'Minimal request to test database connectivity',
      useAdminKey: true
    }
  ]

  const runSingleTest = async (testCase: { name: string; url: string; description: string; method: string; useAdminKey?: undefined } | { name: string; url: string; description: string; method?: undefined; useAdminKey?: undefined } | { name: string; url: string; description: string; useAdminKey: boolean; method?: undefined }) => {
    try {
      console.log(`Testing: ${testCase.name} - ${testCase.url}`)
      
      // Add admin key if needed
      let testUrl = testCase.url
      if (testCase.useAdminKey && adminKey) {
        const separator = testUrl.includes('?') ? '&' : '?'
        testUrl = `${testUrl}${separator}adminKey=${encodeURIComponent(adminKey)}`
      }
      
      const startTime = performance.now()
      const response = await fetch(testUrl, {
        method: testCase.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      let data = null
      let jsonError = null
      let rawResponse = null
      
      try {
        const responseText = await response.text()
        rawResponse = responseText
        if (responseText) {
          data = JSON.parse(responseText)
        }
      } catch (e: any) {
        jsonError = e.message
      }

      return {
        ...testCase,
        actualUrl: testUrl,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data,
        rawResponse,
        jsonError,
        success: response.ok && !jsonError,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error: any) {
      return {
        ...testCase,
        status: 0,
        statusText: 'Network Error',
        error: error.message,
        success: false
      }
    }
  }

  const runDebugTests = async () => {
    setLoading(true)
    setTestResults(null)
    
    const results = []
    
    for (const testCase of debugTests) {
      const result = await runSingleTest(testCase)
      results.push(result)
    }
    
    setTestResults(results)
    setLoading(false)
  }

  // Validation helper functions
  const validatePage = (value: string) => {
    const num = parseInt(value)
    return !isNaN(num) && num >= 1 ? num.toString() : '1'
  }

  const validateLimit = (value: string) => {
    const num = parseInt(value)
    if (isNaN(num)) return '10'
    if (num < 1) return '1'
    if (num > 100) return '100'
    return num.toString()
  }

  const runCustomTest = async () => {
    setLoading(true)
    
    // Validate parameters before building URL
    const validatedParams = {
      ...customParams,
      page: validatePage(customParams.page),
      limit: validateLimit(customParams.limit)
    }
    
    const queryParams = new URLSearchParams()
    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        queryParams.append(key, value)
      } else if (key === 'type' || key === 'page' || key === 'limit') {
        queryParams.append(key, value || (key === 'type' ? 'audit' : key === 'page' ? '1' : '10'))
      }
    })
    
    if (adminKey) {
      queryParams.append('adminKey', adminKey)
    }
    
    const customUrl = `/api/admin/audit-logs?${queryParams.toString()}`
    
    const customTest = {
      name: 'Custom Test',
      url: customUrl,
      description: 'Custom test with your parameters'
    }
    
    const result = await runSingleTest(customTest)
    setTestResults([result])
    setLoading(false)
  }

  const getStatusBadge = (result: { success: any; status: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined }) => {
    if (result?.success) {
      return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>
    } else if (result?.status === 0) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Network Error</Badge>
    } else if (result?.status === 404) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Not Found</Badge>
    } else if (result?.status === 401 || result?.status === 403) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><AlertCircle className="w-3 h-3 mr-1" />Auth Error</Badge>
    } else if (result?.status && result.status >= 400) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />HTTP {result.status}</Badge>
    } else {
      return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>
    }
  }

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const getDiagnosisAndSolutions = (results: any[]) => {
    if (!results || results.length === 0) return null

    const issues = []
    const solutions = []

    // Check if API route exists
    const routeCheck = results.find((r: { name: string }) => r.name === 'API Route Check')
    if (routeCheck && routeCheck.status === 404) {
      issues.push("API route not found")
      solutions.push("Ensure your file is at app/api/admin/audit-logs/route.ts")
    }

    // Check for auth issues
    const authErrors = results.filter((r: { status: number }) => r.status === 401 || r.status === 403)
    if (authErrors.length > 0) {
      issues.push("Authentication/Authorization errors")
      solutions.push("Check your validateAdminAccess function and admin authentication setup")
      
      // Check if admin key is being used
      if (!adminKey) {
        solutions.push("Try setting a valid admin key in the settings")
      }
      
      // Check specific auth responses
      const authResponses = authErrors.map((r: { data: { error: any; code: any } }) => r.data?.error || r.data?.code).filter(Boolean)
      if (authResponses.length > 0) {
        solutions.push(`Auth error details: ${authResponses.join(', ')}`)
      }
    }

    // Check for server errors
    const serverErrors = results.filter((r: { status: number }) => r.status >= 500)
    if (serverErrors.length > 0) {
      issues.push("Server errors detected")
      solutions.push("Check your database connection, Prisma setup, and server logs")
      
      // Check for specific error messages
      const errorMessages = serverErrors.map((r: { data: { message: any; error: any } }) => r.data?.message || r.data?.error).filter(Boolean)
      if (errorMessages.length > 0) {
        solutions.push(`Server error details: ${errorMessages.join(', ')}`)
      }
    }

    // Check for validation errors
    const validationErrors = results.filter((r: { status: number }) => r.status === 400)
    if (validationErrors.length > 0) {
      issues.push("Parameter validation errors")
      solutions.push("Check your Zod schema validation and query parameter handling")
      
      // Check for specific validation issues
      const validationDetails = validationErrors.map((r: { data: { details: any; error: any } }) => r.data?.details || r.data?.error).filter(Boolean)
      if (validationDetails.length > 0) {
        solutions.push(`Validation error details: ${JSON.stringify(validationDetails)}`)
      }
    }

    // Check for successful responses to provide insights
    const successfulTests = results.filter((r: { success: any }) => r.success)
    if (successfulTests.length > 0) {
      solutions.push(`✅ ${successfulTests.length} test(s) passed successfully`)
    }

    return { issues, solutions }
  }

  const buildDisplayUrl = () => {
    // Validate parameters before building display URL
    const validatedParams = {
      ...customParams,
      page: validatePage(customParams.page),
      limit: validateLimit(customParams.limit)
    }
    
    const params = new URLSearchParams()
    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.append(key, value)
      } else if (key === 'type' || key === 'page' || key === 'limit') {
        params.append(key, value || (key === 'type' ? 'audit' : key === 'page' ? '1' : '10'))
      }
    })
    
    if (adminKey) {
      params.append('adminKey', adminKey)
    }
    
    return `/api/admin/audit-logs?${params.toString()}`
  }

  const diagnosis = testResults ? getDiagnosisAndSolutions(testResults) : null

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Bug className="h-8 w-8 text-orange-500" />
          Enhanced Audit Logs API Debugger (Fixed)
        </h1>
        <p className="text-muted-foreground">Debug and troubleshoot your audit logs API endpoint with detailed analysis and parameter validation</p>
      </div>

      {/* Parameter Validation Info */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Parameter Validation Fixed
          </CardTitle>
          <CardDescription>
            The debugger now automatically validates parameters to prevent common validation errors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Page Parameter:</h4>
              <ul className="text-green-700 space-y-1">
                <li>• Must be ≥ 1</li>
                <li>• Automatically corrected if invalid</li>
                <li>• Default: 1</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Limit Parameter:</h4>
              <ul className="text-green-700 space-y-1">
                <li>• Must be between 1 and 100</li>
                <li>• Automatically clamped to valid range</li>
                <li>• Default: 10</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Key Configuration */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Admin Key Configuration
          </CardTitle>
          <CardDescription>
            Set your admin key for authenticated requests. Leave empty to test without authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Enter your admin key..."
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground mt-2">
            This key will be added to authenticated test requests
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tester" className="gap-2">
            <Bug className="h-4 w-4" />
            Debug Tests
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Settings className="h-4 w-4" />
            Custom Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tester">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Debug Tests</CardTitle>
              <CardDescription>Run diagnostic tests to identify issues with your API (now with fixed validation)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runDebugTests} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Debug Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Debug Tests
                  </>
                )}
              </Button>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Tests Include:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Route existence check</li>
                  <li>• Authentication validation</li>
                  <li>• Parameter validation (with corrected values)</li>
                  <li>• Database connectivity</li>
                  <li>• Both audit and security endpoints</li>
                  <li>• Error handling verification</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Test</CardTitle>
              <CardDescription>Test with specific parameters (automatically validated)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={customParams.type} onValueChange={(value) => setCustomParams(prev => ({...prev, type: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Page (≥1)</label>
                  <Input 
                    type="number" 
                    value={customParams.page}
                    onChange={(e) => setCustomParams(prev => ({...prev, page: e.target.value}))}
                    min="1"
                    className={parseInt(customParams.page) < 1 ? "border-red-300" : ""}
                  />
                  {parseInt(customParams.page) < 1 && (
                    <p className="text-xs text-red-600 mt-1">Will be corrected to 1</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Limit (1-100)</label>
                  <Input 
                    type="number" 
                    value={customParams.limit}
                    onChange={(e) => setCustomParams(prev => ({...prev, limit: e.target.value}))}
                    min="1"
                    max="100"
                    className={parseInt(customParams.limit) < 1 || parseInt(customParams.limit) > 100 ? "border-red-300" : ""}
                  />
                  {(parseInt(customParams.limit) < 1 || parseInt(customParams.limit) > 100) && (
                    <p className="text-xs text-red-600 mt-1">Will be clamped to 1-100 range</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category (Audit only)</label>
                  <Select value={customParams.category} onValueChange={(value) => setCustomParams(prev => ({...prev, category: value === 'all' ? '' : value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="SECURITY">Security</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Severity (Security only)</label>
                  <Select value={customParams.severity} onValueChange={(value) => setCustomParams(prev => ({...prev, severity: value === 'all' ? '' : value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input 
                  placeholder="Search term..."
                  value={customParams.search}
                  onChange={(e) => setCustomParams(prev => ({...prev, search: e.target.value}))}
                />
              </div>
              
              <Button onClick={runCustomTest} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Custom Test
                  </>
                )}
              </Button>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Test URL (with validated parameters):</p>
                <code className="text-sm text-muted-foreground break-all">
                  {buildDisplayUrl()}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Diagnosis Section */}
      {diagnosis && (diagnosis.issues.length > 0 || diagnosis.solutions.length > 0) && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Diagnosis & Solutions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosis.issues.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Issues Found:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {diagnosis.issues.map((issue, index) => (
                    <li key={index} className="text-orange-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {diagnosis.solutions.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Recommended Solutions:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {diagnosis.solutions.map((solution, index) => (
                    <li key={index} className="text-orange-700">{solution}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {testResults && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Test Results</h2>
          
          {testResults.map((result, index) => (
            <Card key={index} className="w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{result.name}</CardTitle>
                    <CardDescription>{result.description}</CardDescription>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block break-all">
                      {result.actualUrl || result.url}
                    </code>
                  </div>
                  {getStatusBadge(result)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span> {result.status} {result.statusText}
                  </div>
                  {result.responseTime && (
                    <div>
                      <span className="font-medium">Response Time:</span> {result.responseTime}ms
                    </div>
                  )}
                  {result.rawResponse && (
                    <div>
                      <span className="font-medium">Response Size:</span> {result.rawResponse.length} bytes
                    </div>
                  )}
                </div>

                {/* Headers */}
                {result.headers && Object.keys(result.headers).length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Response Headers:</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-32">
                      {formatJson(result.headers)}
                    </pre>
                  </div>
                )}

                {/* Error Display */}
                {result.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-800">Network Error:</p>
                    <pre className="text-sm text-red-700 mt-1">{result.error}</pre>
                  </div>
                )}

                {/* JSON Error Display */}
                {result.jsonError && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-medium text-yellow-800">JSON Parse Error:</p>
                    <pre className="text-sm text-yellow-700 mt-1">{result.jsonError}</pre>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium text-yellow-800">Raw Response</summary>
                      <pre className="text-xs text-yellow-700 mt-1 bg-yellow-100 p-2 rounded overflow-x-auto">
                        {result.rawResponse || 'No response body'}
                      </pre>
                    </details>
                  </div>
                )}

                {/* Response Data */}
                {result.data && (
                  <div>
                    <p className="font-medium mb-2">Response Data:</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-96">
                      {formatJson(result.data)}
                    </pre>
                  </div>
                )}

                {/* Raw Response for non-JSON */}
                {result.rawResponse && !result.data && !result.jsonError && (
                  <div>
                    <p className="font-medium mb-2">Raw Response:</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-96">
                      {result.rawResponse}
                    </pre>
                  </div>
                )}

                {/* Enhanced diagnostics for specific status codes */}
                {(result.status === 500 || result.status === 404 || result.status === 401 || result.status === 400) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800 mb-2">Common Causes for {result.status}:</p>
                    <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                      {result.status === 500 && (
                        <>
                          <li>Database connection issues (check DATABASE_URL)</li>
                          <li>Missing or incorrect Prisma setup (run npx prisma generate)</li>
                          <li>Invalid environment variables</li>
                          <li>Missing dependencies or import errors</li>
                          <li>Check server console for detailed error logs</li>
                        </>
                      )}
                      {result.status === 404 && (
                        <>
                          <li>API route file not in correct location (app/api/admin/audit-logs/route.ts)</li>
                          <li>Route not properly exported (export async function GET)</li>
                          <li>Build issues - try restarting your development server</li>
                          <li>File naming case sensitivity issues</li>
                        </>
                      )}
                      {result.status === 401 && (
                        <>
                          <li>validateAdminAccess function is rejecting the request</li>
                          <li>Admin key validation failing</li>
                          <li>Session/authentication middleware issues</li>
                          <li>Missing or invalid admin privileges</li>
                          <li>Check the auth() function and session handling</li>
                        </>
                      )}
                      {result.status === 400 && (
                        <>
                          <li>Zod schema validation failing</li>
                          <li>Invalid query parameter format</li>
                          <li>DateTime format issues (use ISO format)</li>
                          <li>Enum values not matching schema</li>
                          <li>Page/limit values out of range</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Enhanced Troubleshooting Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Common Issues & Solutions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-600 mb-2">🔴 404 Not Found</h4>
              <p className="text-sm text-red-700 mb-2">
                API route not found. This is usually a file structure issue.
              </p>
              <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                <li>Ensure file is at: <code>app/api/admin/audit-logs/route.ts</code></li>
                <li>Check export syntax: <code>export async function GET(req: NextRequest)</code></li>
                <li>Restart development server after creating the file</li>
                <li>Verify TypeScript compilation is successful</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-600">🟡 401/403 Unauthorized</h4>
              <p className="text-sm text-muted-foreground">
                Authentication issues. Check: validateAdminAccess function, Session handling, Admin permissions, API key validation.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-red-600">🔴 500 Server Error</h4>
              <p className="text-sm text-muted-foreground">
                Server-side issues. Check: Database connection, Prisma client setup, Environment variables, Server logs for detailed errors.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-600">🔵 400 Bad Request</h4>
              <p className="text-sm text-muted-foreground">
                Invalid parameters. Check: Zod schema validation, Query parameter handling, Required fields.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogsDebugger