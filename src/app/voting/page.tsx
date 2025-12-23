'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Vote, Loader2, CheckCircle, Calendar, User, Users, Clock, GitBranch, ChevronDown, ChevronUp } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { SettingsGuard } from '@/components/settings-guard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Devlog {
  id: string
  content: string
  timestamp: string
  author: string
}

interface Project {
  id: string
  name: string
  description: string
  teamId: string
  teamName: string
  teamMembers: string[]
  gitRepo: string
  devlogs: Devlog[]
  hackatimeHours: number
}

export default function VotingPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [voted, setVoted] = useState(false)
  const router = useRouter()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setSelectedProject(null)
      setReason('')
      const response = await fetch('/api/voting')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !reason.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectsShown: projects.map(p => p.id),
          projectChosen: selectedProject,
          reason: reason.trim()
        })
      })

      if (response.ok) {
        setVoted(true)
        setTimeout(() => {
          setVoted(false)
          fetchProjects()
        }, 2000)
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsGuard requiredSetting="VotingEnabled">
      <div className="min-h-screen bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>
        
        <div className="relative z-10">
          <TopNav currentPage="voting" />
        
          <div className="container mx-auto px-6 -mt-16">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#7d82b8]" />
              </div>
            ) : voted ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h2 className="text-2xl font-bold text-white mb-2">Vote Submitted!</h2>
                  <p className="text-zinc-400">Loading new projects...</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-12">
                  <Vote className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <h2 className="text-xl font-semibold text-white mb-2">No Projects Available</h2>
                  <p className="text-zinc-400">Check back later when more projects are submitted!</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Vote for a Project</h1>
                  <p className="text-zinc-400">Choose the project you think is the most impressive and tell us why!</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`bg-zinc-900/50 backdrop-blur-sm rounded-2xl border transition-all ${
                        selectedProject === project.id
                          ? 'border-[#7d82b8] bg-[#7d82b8]/10'
                          : 'border-zinc-800/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedProject(project.id)}
                        className="w-full p-6 text-left"
                      >
                        <h3 className="text-xl font-semibold text-white mb-3">{project.name}</h3>
                        <p className="text-zinc-400 mb-4">{project.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{project.teamName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{project.teamMembers.length} members</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{project.hackatimeHours}h</span>
                          </div>
                          {project.gitRepo && (
                            <div className="flex items-center space-x-2 text-sm">
                              <GitBranch className="w-4 h-4 text-zinc-500" />
                              <a 
                                href={project.gitRepo} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#7d82b8] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Repository
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="text-zinc-500 text-xs mb-2">
                          Team: {project.teamMembers.join(', ')}
                        </div>

                        {selectedProject === project.id && (
                          <div className="mt-2 inline-flex items-center space-x-1 px-3 py-1 bg-[#7d82b8] text-white rounded-full text-sm">
                            <Vote className="w-4 h-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>

                      {project.devlogs && project.devlogs.length > 0 && (
                        <div className="border-t border-zinc-800 px-6 py-4">
                          <h4 className="text-sm font-medium text-zinc-400 mb-3">Devlogs</h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {project.devlogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((devlog) => (
                              <div key={devlog.id} className="bg-zinc-800/30 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2 text-xs">
                                    <User className="w-3 h-3 text-zinc-500" />
                                    <span className="text-zinc-400">{devlog.author}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-zinc-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(devlog.timestamp).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none [&>*]:text-zinc-300 [&_a]:text-[#7d82b8] [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:bg-zinc-800 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-zinc-800 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      img: ({ src, alt }) => (
                                        <img 
                                          src={src} 
                                          alt={alt || ''} 
                                          loading="lazy"
                                        />
                                      ),
                                      a: ({ href, children }) => (
                                        <a 
                                          href={href} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {children}
                                        </a>
                                      )
                                    }}
                                  >
                                    {devlog.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedProject && (
                  <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6 mb-6">
                    <label htmlFor="reason" className="block text-white font-medium mb-2">
                      Why did you choose this project?
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell us what impressed you about this project..."
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7d82b8] transition-colors resize-none"
                      rows={4}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={!selectedProject || !reason.trim() || submitting}
                    className="px-8 py-3 bg-[#7d82b8] text-white rounded-lg font-medium hover:bg-[#9ca0cc] disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Vote className="w-5 h-5" />
                        <span>Submit Vote</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </SettingsGuard>
  )
}