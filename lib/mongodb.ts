import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
// Note: Moltbook doesn't have a public agent lookup API, so verification is skipped for now
// const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY
// const MOLTBOOK_BASE_URL = 'https://www.moltbook.com/api/v1'

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
  // Moltbook doesn't have a public endpoint for looking up agents by name
  // Just accept the username for now - verification can be added later
  // if Moltbook adds such an endpoint
  const cleanUsername = username.replace(/^@/, '')

  return {
    valid: true,
    agent: {
      id: 'pending',
      name: cleanUsername
    }
  }
}
