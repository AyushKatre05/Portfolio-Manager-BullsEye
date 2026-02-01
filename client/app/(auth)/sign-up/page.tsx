"use client"

import {CountrySelectField} from "@/components/forms/CountrySelectField"
import FooterLink from "@/components/forms/FooterLink"
import InputFeild from "@/components/forms/InputFeild"
import SelectFields from "@/components/forms/SelectFields"
import {Button} from "@/components/ui/button"
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants"
import React from "react"
import {useForm} from "react-hook-form"
import {toast} from "sonner"

const SignUp = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: {errors, isSubmitting},
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "US",
      investmentGoals: "",
      riskTolerance: "medium",
      preferredIndustry: "Technology",
    }, 
    mode: "onBlur",
  })
  const onSubmit = async (data: SignUpFormData) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
      const result = await fetch(`${backendUrl}/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (result.ok) {
        console.log("✅ Sign Up Successful:", data)
        toast.success("Account created successfully! Redirecting to sign in...")

        // Use window.location for hard redirect
        setTimeout(() => {
          window.location.href = "/sign-in"
        }, 100)
      } else {
        const errorData = await result.json().catch(() => ({}))
        throw new Error(errorData.message || "Sign up failed")
      }
    } catch (error) {
      console.error("Sign Up Error:", error)
      toast.error("Sign Up Failed.", {
        description:
          error instanceof Error ? error.message : "Failed to create account.",
      })
    }
  }

  return (
    <>
      <h1 className="form-title">Sign Up and Personalize</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputFeild
          name="full_name"
          label="Full Name"
          placeholder="John Doe"
          register={register}
          error={errors.fullName}
          validation={{required: "Full Name is required", minLength: 2}}
        />

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

        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />

        <SelectFields
          name="investment_goals"
          label="Investment Goals"
          placeholder="Select your investment goals"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />

        <SelectFields
          name="risk_tolerance"
          label="Risk Tolerance"
          placeholder="Select your risk tolerance"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />

        <SelectFields
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-5 yellow-btn"
        >
          {isSubmitting ? "Creating Account" : "Start Your Investment Journey"}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign In"
          href="/sign-in"
        />
      </form>
    </>
  )
}

export default SignUp
