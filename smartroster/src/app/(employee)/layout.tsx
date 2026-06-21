import BottomNav from '@/components/layout/BottomNav'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">{children}</div>
      <BottomNav />
    </div>
  )
}
