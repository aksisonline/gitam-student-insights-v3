import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Settings,
  BarChart3,
  Shield,
  Sparkles,
  Zap,
  RefreshCw,
  Code2,
  Crown
} from "lucide-react"
import { getDevProMode, setDevProMode, updateProModeCache } from "@/lib/features/featureManager"
import "@/globals.css"

function IndexPopup() {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  const [isGitamPage, setIsGitamPage] = useState(false)
  const [pageType, setPageType] = useState<'login' | 'attendance' | 'other' | 'unknown'>('unknown')
  const [devProMode, setDevProModeState] = useState(false)
  const [proModeLoading, setProModeLoading] = useState(false)

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
    
    // Load dev pro mode status
    loadDevProMode()
  }, [])

  const loadDevProMode = async () => {
    try {
      const isPro = await getDevProMode()
      setDevProModeState(isPro)
      await updateProModeCache()
    } catch (error) {
      console.error('Error loading dev pro mode:', error)
    }
  }

  const handleProModeToggle = async (checked: boolean) => {
    setProModeLoading(true)
    try {
      await setDevProMode(checked)
      setDevProModeState(checked)
      await updateProModeCache()
      
      // Notify content scripts to refresh
      if (currentTab?.id) {
        chrome.tabs.sendMessage(currentTab.id, { 
          action: 'proModeChanged', 
          enabled: checked 
        }).catch(() => {
          // Tab might not have content script loaded, that's okay
        })
      }
    } catch (error) {
      console.error('Error toggling pro mode:', error)
    } finally {
      setProModeLoading(false)
    }
  }

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
    <div className="w-96 min-h-[500px] bg-gradient-to-br from-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 text-white">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">GITAM Insights</h1>
              <p className="text-sm text-white/90">Enhanced Student Experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                Extension Status
                {isGitamPage ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Page</span>
              </div>
              <Badge 
                variant={isGitamPage ? "default" : "secondary"}
                className={isGitamPage ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {pageType === 'login' ? '🔐 Login' : 
                 pageType === 'attendance' ? '📊 Portal' : 
                 '🌐 Other'}
              </Badge>
            </div>
            
            {isGitamPage && (
              <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Zap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  {pageType === 'login' ? '✨ CAPTCHA auto-fill is active and ready to assist you!' : 
                   pageType === 'attendance' ? '🚀 Enhanced attendance view with analytics is available!' : 
                   'Features will automatically activate on GITAM pages'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs">
              Navigate to GITAM services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={openGitamPortal} 
              className="w-full justify-start gap-2 group"
              variant="outline"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Open GITAM Portal</span>
            </Button>
            
            <Button 
              onClick={openGitamLogin} 
              className="w-full justify-start gap-2 group"
              variant="outline"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Open GITAM Login</span>
            </Button>

            {isGitamPage && (
              <Button 
                onClick={refreshCurrentPage} 
                className="w-full justify-start gap-2 group"
                variant="default"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Refresh Current Page</span>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Features Info */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Features
            </CardTitle>
            <CardDescription className="text-xs">
              All features enabled and ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="p-1.5 bg-green-500/10 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">CAPTCHA Auto-fill</p>
                  <p className="text-xs text-muted-foreground">Automatic login form completion</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="p-1.5 bg-blue-500/10 rounded-md">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Enhanced Dashboard</p>
                  <p className="text-xs text-muted-foreground">Modern attendance interface</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="p-1.5 bg-purple-500/10 rounded-md">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Interactive Charts</p>
                  <p className="text-xs text-muted-foreground">Visual analytics & insights</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="p-1.5 bg-amber-500/10 rounded-md">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Real-time Updates</p>
                  <p className="text-xs text-muted-foreground">Live data synchronization</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development PRO Mode Toggle */}
        <Card className="border-2 border-amber-500/50 shadow-lg bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Development Tools
              <Badge variant="outline" className="ml-auto bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-xs">
                DEV ONLY
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Temporary controls for testing PRO features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border-2 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  devProMode 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-muted'
                }`}>
                  <Crown className={`h-4 w-4 ${
                    devProMode ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <Label 
                    htmlFor="pro-mode-toggle" 
                    className="text-sm font-semibold cursor-pointer flex items-center gap-2"
                  >
                    PRO Mode
                    {devProMode && (
                      <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                        <Sparkles className="h-3 w-3" />
                        ACTIVE
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {devProMode 
                      ? '🎉 All PRO features unlocked' 
                      : '🔒 PRO features locked'}
                  </p>
                </div>
              </div>
              <Switch
                id="pro-mode-toggle"
                checked={devProMode}
                onCheckedChange={handleProModeToggle}
                disabled={proModeLoading}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
              />
            </div>
            
            <div className="mt-3 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <p className="font-medium">⚠️ Development Preview Only</p>
                  <p>This toggle is temporary. In production, PRO status will be determined by Firebase authentication and subscription status.</p>
                  {devProMode && (
                    <p className="mt-2 text-amber-600 dark:text-amber-400">
                      💡 <strong>Tip:</strong> Refresh the GITAM portal page after toggling to see changes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1 pt-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <p>Built with Plasmo & shadcn/ui</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Version 3.0.0
          </Badge>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
