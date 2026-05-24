import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import AccountNav from '@/components/layout/account-nav'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <AccountNav />
        {children}
      </main>
      <Footer />
    </>
  )
}
