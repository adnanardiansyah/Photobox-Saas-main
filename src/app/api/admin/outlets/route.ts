import { NextRequest } from 'next/server'
import * as resource from '../[resource]/route'
export const dynamic = 'force-dynamic'
const context = { params: { resource: 'outlets' } }
export const GET = (req: NextRequest) => resource.GET(req, context)
export const POST = (req: NextRequest) => resource.POST(req, context)
export const PUT = (req: NextRequest) => resource.PUT(req, context)
export const DELETE = (req: NextRequest) => resource.DELETE(req, context)
