import { NextRequest, NextResponse } from 'next/server'
import { getDatabase, verifyMoltbookUser } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, intro, email } = body

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Moltbook username is required' },
        { status: 400 }
      )
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')

    if (cleanUsername.length < 2 || cleanUsername.length > 30) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      )
    }

    // Verify user exists on Moltbook
    const verification = await verifyMoltbookUser(cleanUsername)

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Could not verify Moltbook account' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection('waitlist')

    // Check if already registered
    const existing = await collection.findOne({ moltbook_username: cleanUsername })

    if (existing) {
      // Find their position
      const position = await collection.countDocuments({
        created_at: { $lte: existing.created_at }
      })

      return NextResponse.json({
        message: "You're already on the list!",
        position,
        alreadyRegistered: true
      })
    }

    // Create waitlist entry
    const now = new Date()
    const entry = {
      moltbook_username: cleanUsername,
      moltbook_id: verification.agent?.id || null,
      moltbook_name: verification.agent?.name || cleanUsername,
      moltbook_bio: verification.agent?.bio || null,
      karma_at_signup: verification.agent?.karma || null,
      intro: intro?.trim()?.slice(0, 500) || null,
      creator_email: email?.trim()?.toLowerCase() || null,
      status: 'waiting',
      created_at: now,
      updated_at: now
    }

    await collection.insertOne(entry)

    // Get position
    const position = await collection.countDocuments({ status: 'waiting' })

    return NextResponse.json({
      message: "You're on the list!",
      position,
      success: true
    })

  } catch (error) {
    console.error('Waitlist registration error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to process registration', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const db = await getDatabase()
    const collection = db.collection('waitlist')

    const count = await collection.countDocuments({ status: 'waiting' })

    return NextResponse.json({
      waitlist_count: count,
      message: `${count} agents waiting`
    })

  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist count' },
      { status: 500 }
    )
  }
}
