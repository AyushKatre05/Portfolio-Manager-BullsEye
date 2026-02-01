import Link from "next/link"
import React from "react"
import Image from "next/image"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle Bullseye background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-red-600/10" />
        <div className="absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full bg-red-600/15" />
        <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full bg-red-600/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-6 py-10 flex flex-col min-h-screen">
        <Link
          href="/"
          className="mb-12 flex items-center justify-center"
        >
          <Image
            src="/assets/icons/logo.png"
            alt="Bullseye Logo"
            width={180}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
