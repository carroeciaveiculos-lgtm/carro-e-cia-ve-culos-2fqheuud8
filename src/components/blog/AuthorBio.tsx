import { useState, useEffect } from 'react'
import { getExpertBio, ExpertBio } from '@/lib/expert-bios'
import { supabase } from '@/lib/supabase/client'

export function AuthorBio({ authorName }: { authorName?: string | null }) {
  const [bio, setBio] = useState<ExpertBio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBio = async () => {
      if (!authorName) {
        setLoading(false)
        return
      }

      const expertBio = getExpertBio(authorName)
      if (expertBio) {
        setBio(expertBio)
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('usuarios')
          .select('nome, bio, foto_url, especialidade, role')
          .ilike('nome', authorName)
          .limit(1)

        if (data && data[0]?.bio) {
          setBio({
            name: data[0].nome,
            role: data[0].role || 'Especialista',
            bio: data[0].bio,
            fotoUrl: data[0].foto_url || '',
            especialidade: data[0].especialidade || '',
          })
        }
      } catch {
        // silent fail
      }

      setLoading(false)
    }
    fetchBio()
  }, [authorName])

  if (loading || !bio) return null

  return (
    <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
      {bio.fotoUrl ? (
        <img
          src={bio.fotoUrl}
          alt={bio.name}
          className="w-16 h-16 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
          {bio.name[0]}
        </div>
      )}
      <div>
        <p className="font-bold text-slate-800">{bio.name}</p>
        <p className="text-sm text-primary font-medium mb-2">{bio.especialidade || bio.role}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{bio.bio}</p>
      </div>
    </div>
  )
}
