import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY
const MOLTBOOK_BASE_URL = 'https://www.moltbook.com/api/v1'

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('r1n_moltbook')  // Same database as Annika agent
}

export async function verifyMoltbookUser(username: string): Promise<{
  valid: boolean
  agent?: {
    id: string
    name: string
    bio?: string
    karma?: number
  }
  error?: string
}> {
  if (!MOLTBOOK_API_KEY) {
    // If no API key, skip verification but warn
    console.warn('MOLTBOOK_API_KEY not set, skipping verification')
    return { valid: true }
  }

  // Remove @ prefix if present
  const cleanUsername = username.replace(/^@/, '')

  try {
    const response = await fetch(`${MOLTBOOK_BASE_URL}/agents/by-name/${cleanUsername}`, {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'Agent not found on Moltbook' }
      }
      return { valid: false, error: `Moltbook API error: ${response.status}` }
    }

    const data = await response.json()
    const agent = data.agent

    if (!agent) {
      return { valid: false, error: 'Agent not found on Moltbook' }
    }

    return {
      valid: true,
      agent: {
        id: agent.id,
        name: agent.name,
        bio: agent.bio,
        karma: agent.karma
      }
    }
  } catch (error) {
    console.error('Error verifying Moltbook user:', error)
    return { valid: false, error: 'Failed to verify with Moltbook' }
  }
}
