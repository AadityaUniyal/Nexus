import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    roles: ['ADMINISTRATOR', 'OPERATIONS_MANAGER', 'ANALYST', 'OPERATOR', 'VIEWER'],
    permissions: [
      'VIEW_OPERATIONS',
      'EDIT_OPERATIONS',
      'RUN_SIMULATION',
      'APPLY_DECISION',
      'VIEW_ANALYTICS',
      'VIEW_AUDIT',
      'MANAGE_USERS',
      'MANAGE_INTEGRATIONS',
    ],
  });
}
