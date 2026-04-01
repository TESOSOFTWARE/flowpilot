import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function linkPendingInvites(userId: string, email: string) {
  if (!email) return
  
  // Find any pending invitations for this email (case-insensitive)
  const pendingInvite = await prisma.teamMember.findFirst({
    where: { 
      inviteEmail: { equals: email.toLowerCase(), mode: 'insensitive' } 
    },
  })

  if (pendingInvite) {
    console.log(`[AUTH] Linking pending invite for ${email} to user ${userId}`)
    // Link the user to the existing placeholder team membership
    await prisma.teamMember.update({
      where: { id: pendingInvite.id },
      data: {
        userId: userId,
        inviteEmail: null, // Clear the invite email as it's now bound to a user
      },
    })
    
    // Also update the user's primary organization if not set
    await prisma.user.update({
      where: { id: userId },
      data: { 
        organizationId: pendingInvite.organizationId,
        role: "MEMBER"
      },
    })
    return true
  }
  return false
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Allow linking OAuth accounts to existing password-less user records (e.g. from invitations)
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        })

        if (!user || !user.password) return null

        const passwordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || "No Organization",
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (user.id && user.email) {
        await linkPendingInvites(user.id, user.email)
      }
    },
    async createUser({ user }) {
      if (!user.email || !user.id) return

      const linked = await linkPendingInvites(user.id, user.email)
      
      if (!linked) {
        // 2. Create a new organization for the user (organic signup)
        const orgName = `${user.name || user.email.split("@")[0]}'s Workspace`
        const slug = `${(user.name?.toLowerCase().replace(/\s+/g, "-") || user.email.split("@")[0])}-${Math.random().toString(36).substring(2, 7)}`

        const org = await prisma.organization.create({
          data: {
            name: orgName,
            slug: slug,
            plan: "free",
          },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: { 
            organizationId: org.id,
            role: "ADMIN"
          },
        })

        // Also create a team member record for the organic signup
        await prisma.teamMember.create({
          data: {
            userId: user.id as string,
            organizationId: org.id,
            role: "Owner",
            capacity: 0,
          },
        })
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        console.log(`[AUTH] Google Sign-In attempt for email: ${user.email}`)
        // The allowDangerousEmailAccountLinking: true on the provider handles the logic,
        // but explicitly returning true here ensures we don't block the handshake.
        return true
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (process.env.NEXT_RUNTIME === 'edge') return token
      try {
        if (user) {
          token.role = (user as any).role
          token.organizationId = (user as any).organizationId
          token.organizationName = (user as any).organizationName
        }
        
        // Handle session updates if workspace is switched or profile is updated
        if (trigger === "update") {
          if (session?.name) token.name = session.name
          if (session?.image) token.picture = session.image
          if (session?.organizationId) {
            token.organizationId = session.organizationId
            token.organizationName = session.organizationName
            // When switching org, we must also update the user's role in that org
            const m = await prisma.teamMember.findFirst({
              where: { userId: token.sub!, organizationId: session.organizationId }
            })
            if (m) token.role = m.role
          }
        }

        // Ensure we have a valid organizationId and fetch all available ones
        if (token.sub) {
          const memberships = await prisma.teamMember.findMany({
            where: { userId: token.sub },
            include: { organization: true }
          })

          // If current organizationId is not in memberships, pick the first one
          if (!token.organizationId || !memberships.some(m => m.organizationId === token.organizationId)) {
            if (memberships.length > 0) {
              token.organizationId = memberships[0].organizationId
              token.organizationName = memberships[0].organization.name
              token.role = memberships[0].role
            } else {
              // Fallback: If no memberships found, try to use the direct organizationId from User
              const u = await prisma.user.findUnique({
                where: { id: token.sub },
                include: { organization: true }
              })
              // Verify u.organization exists to avoid stale ID references
              if (u?.organizationId && u.organization) {
                token.organizationId = u.organizationId
                token.organizationName = u.organization.name
                token.role = u.role
              } else if (token.sub) {
                // RESCUE: Create a new organization for the orphaned user
                console.log(`[AUTH] Orphaned user ${token.email} detected. RESCUING with new workspace.`)
                const orgName = `${token.name || token.email?.toString().split("@")[0] || 'My'}'s Workspace`
                const slug = `${(token.name?.toLowerCase().replace(/\s+/g, "-") || 'workspace')}-${Math.random().toString(36).substring(2, 7)}`

                const newOrg = await prisma.organization.create({
                   data: { name: orgName, slug, plan: "free" }
                })

                await prisma.teamMember.create({
                   data: {
                     userId: token.sub as string,
                     organizationId: newOrg.id,
                     role: "Owner",
                     capacity: 0,
                     isActive: true
                   }
                })

                await prisma.user.update({
                   where: { id: token.sub as string },
                   data: { 
                     organizationId: newOrg.id,
                     role: "ADMIN"
                   }
                })

                token.organizationId = newOrg.id
                token.organizationName = newOrg.name
                token.role = "ADMIN"
              } else {
                // Total failure case
                token.organizationId = undefined
                token.organizationName = undefined
              }
            }
          }
          
          // Store all org IDs in token for easier UI listing
          token.organizations = memberships.length > 0 ? memberships.map(m => ({
            id: m.organizationId,
            name: m.organization.name,
            role: m.role
          })) : (token.organizationId ? [{
            id: token.organizationId,
            name: token.organizationName,
            role: token.role
          }] : [])
        }
      } catch (error) {
        console.error("JWT Callback Error:", error)
        // Ensure we still return the token even if DB calls fail
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        ;(session.user as any).role = token.role
        ;(session.user as any).organizationId = token.organizationId
        ;(session.user as any).organizationName = token.organizationName
        ;(session.user as any).organizations = token.organizations
      }
      return session
    },
  },
})
