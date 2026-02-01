"use client"

import FooterLink from "@/components/forms/FooterLink"
import InputFeild from "@/components/forms/InputFeild"
import {Button} from "@/components/ui/button"
import React, {useState, useEffect} from "react"
import {useForm} from "react-hook-form"
import {toast} from "sonner"

const SignIn = () => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  })
  const onSubmit = async (data: SignInFormData) => {
    try {
      console.log("🔐 Sign-in attempt started...")
      // Call the local API route which will forward credentials to the backend
      // and set an httpOnly cookie named 'token'. It also returns a minimal
      // user object in the response body which we store in localStorage for UI.
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
      })

      console.log("📡 Sign-in API response status:", res.status)
      const json = await res.json()
      console.log("📦 Sign-in API response data:", json)

      if (!res.ok) {
        console.error("❌ Sign-in failed:", json.error)
        toast.error(json.error || "Sign In Failed.")
        return
      }

      if (json.user) {
        console.log("💾 Storing user in localStorage:", json.user)
        localStorage.setItem("user", JSON.stringify(json.user))
      }

      console.log("✅ Sign-in successful, preparing redirect...")
      toast.success("Signed In Successfully!")

      // Small delay to ensure cookie is set and toast is visible
      setTimeout(() => {
        console.log("🚀 Redirecting to homepage...")
        window.location.href = "/"
      }, 100)
    } catch (error) {
      console.error("💥 Sign In Error:", error)
      toast.error("An error occurred during sign-in.")
    }
  }

  return (
    <>
      <h1 className="form-title">Welcome Back</h1>

      {!isMounted ? (
        <div className="space-y-5">
          <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <InputFeild
            name="email"
            label="Email"
            placeholder="john.doe@example.com"
            register={register}
            error={errors.email}
            validation={{
              required: "Email is required",
              pattern: {value: /^\S+@\S+$/, message: "Email is invalid"},
            }}
          />

          <InputFeild
            name="password"
            label="Password"
            placeholder="Enter a strong password"
            type="password"
            register={register}
            error={errors.password}
            validation={{required: "Password is required", minLength: 6}}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-5 yellow-btn"
          >
            {isSubmitting ? "Logging In..." : "Resume Your Investment Journey"}
          </Button>

          <FooterLink
            text="Do not have an account?"
            linkText="Create an Account"
            href="/sign-up"
          />
        </form>
      )}
    </>
  )
}

export default SignIn
