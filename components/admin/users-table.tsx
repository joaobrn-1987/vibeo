"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, AlertTriangle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, getRiskLevelLabel } from "@/lib/utils"

interface UserRow {
  id: string
  email: string
  status: string
  role: string
  isMinor: boolean
  createdAt: string
  profile: {
    fullName: string
    currentRiskLevel: string
    totalCheckIns: number
  } | null
}

interface UsersTableProps {
  users: UserRow[]
  isMasterAdmin: boolean
  currentUserId: string
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  PENDING_EMAIL: "E-mail pendente",
  PENDING_CONSENT: "Consentimento pendente",
  SUSPENDED: "Suspenso",
  DEACTIVATED: "Desativado",
}

const statusVariant: Record<string, string> = {
  ACTIVE: "stable",
  PENDING_EMAIL: "warning",
  PENDING_CONSENT: "attention",
  SUSPENDED: "error",
  DEACTIVATED: "muted",
}

const roleLabel: Record<string, string> = {
  USER: "Usuário",
  GUARDIAN: "Responsável",
  ADMIN: "Admin",
  MASTER_ADMIN: "Master Admin",
}

const riskVariant: Record<string, string> = {
  STABLE: "stable",
  ATTENTION: "attention",
  HIGH_RISK: "high",
  IMMEDIATE_PRIORITY: "immediate",
}

export function UsersTable({ users, isMasterAdmin, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openConfirm(user: UserRow) {
    setConfirmId(user.id)
    setConfirmUser(user)
    setError(null)
  }

  function closeConfirm() {
    setConfirmId(null)
    setConfirmUser(null)
    setError(null)
  }

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${confirmId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao excluir.")
        return
      }
      closeConfirm()
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-50">
              <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Perfil</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Risco</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Check-ins</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Cadastro</th>
              {isMasterAdmin && (
                <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-cream-100 hover:bg-cream-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                      {user.profile?.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.profile?.fullName || "–"}</p>
                      <p className="text-xs text-foreground/40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={(statusVariant[user.status] || "muted") as any}>
                    {statusLabel[user.status] || user.status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-foreground/60">{roleLabel[user.role] || user.role}</span>
                    {user.isMinor && <Badge variant="warning" className="text-xs w-fit">Menor</Badge>}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {user.profile?.currentRiskLevel && (
                    <Badge variant={(riskVariant[user.profile.currentRiskLevel] || "stable") as any}>
                      {getRiskLevelLabel(user.profile.currentRiskLevel)}
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-foreground/60">{user.profile?.totalCheckIns || 0}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-foreground/60 text-xs">{formatDate(user.createdAt)}</span>
                </td>
                {isMasterAdmin && (
                  <td className="px-5 py-4">
                    {user.id !== currentUserId && user.role !== "MASTER_ADMIN" && (
                      <button
                        onClick={() => openConfirm(user)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir usuário e todos os dados"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation modal */}
      {confirmId && confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <button onClick={closeConfirm} className="p-1 rounded-lg hover:bg-cream-100 text-foreground/40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Excluir usuário permanentemente</h2>
              <p className="text-sm text-foreground/60 mt-2">
                Esta ação é <strong className="text-red-600">irreversível</strong>. Todos os dados do usuário serão excluídos:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-foreground/60 list-disc list-inside">
                <li>Perfil e informações pessoais</li>
                <li>Histórico de check-ins e respostas</li>
                <li>Sessões de IA e memórias</li>
                <li>Logs de consentimento</li>
                <li>Alertas emocionais</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
              <p className="text-xs text-foreground/40">Usuário a ser excluído</p>
              <p className="font-semibold text-foreground">{confirmUser.profile?.fullName || "–"}</p>
              <p className="text-xs text-foreground/50">{confirmUser.email}</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeConfirm} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Sim, excluir tudo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
