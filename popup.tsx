import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, ExternalLink, Settings } from "lucide-react"
import "@/globals.css"

function IndexPopup() {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  const [isGitamPage, setIsGitamPage] = useState(false)
  const [pageType, setPageType] = useState<'login' | 'attendance' | 'other' | 'unknown'>('unknown')

  useEffect(() => {
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0])
        const url = tabs[0].url || ''
        
        if (url.includes('login.gitam.edu')) {
          setIsGitamPage(true)
          setPageType('login')
        } else if (url.includes('gstudent.gitam.edu')) {
          setIsGitamPage(true)
          setPageType('attendance')
        } else {
          setIsGitamPage(false)
          setPageType('other')
        }
      }
    })
  }, [])

  const openGitamPortal = () => {
    chrome.tabs.create({ url: 'https://gstudent.gitam.edu' })
  }

  const openGitamLogin = () => {
    chrome.tabs.create({ url: 'https://login.gitam.edu' })
  }

  const refreshCurrentPage = () => {
    if (currentTab?.id) {
      chrome.tabs.reload(currentTab.id)
    }
  }

  return (
    <div className="w-80 p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">GITAM Student Insights</h1>
        <p className="text-sm text-muted-foreground">Enhanced attendance tracking</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Extension Status
            {isGitamPage ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Current Page:</span>
            <Badge variant={isGitamPage ? "default" : "secondary"}>
              {pageType === 'login' ? 'GITAM Login' : 
               pageType === 'attendance' ? 'GITAM Portal' : 
               'Other Site'}
            </Badge>
          </div>
          
          {isGitamPage && (
            <div className="text-xs text-muted-foreground">
              {pageType === 'login' ? 'CAPTCHA auto-fill available' : 
               pageType === 'attendance' ? 'Enhanced attendance view available' : 
               'Features will activate on GITAM pages'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={openGitamPortal} 
            className="w-full justify-start"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open GITAM Portal
          </Button>
          
          <Button 
            onClick={openGitamLogin} 
            className="w-full justify-start"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open GITAM Login
          </Button>

          {isGitamPage && (
            <Button 
              onClick={refreshCurrentPage} 
              className="w-full justify-start"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Refresh Current Page
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>CAPTCHA Auto-fill on login</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Enhanced attendance dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Interactive charts & analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Real-time data processing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Built with Plasmo & shadcn/ui</p>
        <p>Version 3.0.0</p>
      </div>
    </div>
  )
}

export default IndexPopup
