import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Dashboard | SENSED',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
