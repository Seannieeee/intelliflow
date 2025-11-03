"use client";

import React, { useState, useMemo } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Password validation rules
  const passwordValidations = useMemo(() => {
    return {
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0 && confirmPassword.length > 0,
    };
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      email.length > 0 &&
      passwordValidations.minLength &&
      passwordValidations.hasUpperCase &&
      passwordValidations.hasLowerCase &&
      passwordValidations.hasNumber &&
      passwordValidations.passwordsMatch
    );
  }, [email, passwordValidations]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      alert("Verification email sent! Please check your inbox.");
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
      <span className={isValid ? "text-green-500" : "text-gray-400"}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleRegister}
          className="bg-gray-800 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-white">
            Create Account
          </h1>
          <p className="text-gray-400 text-center mb-6 text-sm">
            Sign up to get started
          </p>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password Input */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Show Password Toggle */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
            />
            <label htmlFor="showPassword" className="ml-2 text-sm text-gray-400 cursor-pointer">
              Show password
            </label>
          </div>

          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <p className="text-gray-300 font-medium mb-3 text-sm">Password Requirements:</p>
              <div className="space-y-2">
                <ValidationItem
                  isValid={passwordValidations.minLength}
                  text="At least 6 characters"
                />
                <ValidationItem
                  isValid={passwordValidations.hasUpperCase}
                  text="Contains uppercase letter"
                />
                <ValidationItem
                  isValid={passwordValidations.hasLowerCase}
                  text="Contains lowercase letter"
                />
                <ValidationItem
                  isValid={passwordValidations.hasNumber}
                  text="Contains number"
                />
                {confirmPassword.length > 0 && (
                  <ValidationItem
                    isValid={passwordValidations.passwordsMatch}
                    text="Passwords match"
                  />
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isFormValid
                ? "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/50"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            Create Account
          </button>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <span className="text-gray-400 text-sm">Already have an account? </span>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-green-500 hover:text-green-400 font-medium text-sm transition-colors"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}