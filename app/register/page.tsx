"use client";

import React, { useState, useMemo } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Check, X, Eye, EyeOff, AlertCircle, Mail, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  // Email validation
  const emailValidation = useMemo(() => {
    if (email.length === 0) return { isValid: true, message: "" };
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      return { isValid: false, message: "Invalid email format" };
    }
    if (email.includes(' ')) {
      return { isValid: false, message: "Email cannot contain spaces" };
    }
    
    return { isValid: true, message: "Valid email format" };
  }, [email]);

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
      emailValidation.isValid &&
      passwordValidations.minLength &&
      passwordValidations.hasUpperCase &&
      passwordValidations.hasLowerCase &&
      passwordValidations.hasNumber &&
      passwordValidations.passwordsMatch &&
      !isSubmitting
    );
  }, [email, emailValidation, passwordValidations, isSubmitting]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!isFormValid) {
      setError("Please fix all validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Registration error:", error.code);
      
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("This email is already registered. Please try logging in instead.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format. Please check and try again.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Please use a stronger password.");
          break;
        case "auth/operation-not-allowed":
          setError("Email/password accounts are not enabled. Please contact support.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection and try again.");
          break;
        default:
          setError("Registration failed. Please try again later.");
          console.error("Unhandled error:", error);
      }
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    setShowSuccessModal(false);
    router.push("/login");
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
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Check Your Email!
                </h2>
                
                <p className="text-gray-300 mb-2">
                  We've sent a verification link to:
                </p>
                
                <p className="text-green-400 font-medium mb-4 break-all">
                  {email}
                </p>
                
                <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-6 text-left w-full">
                  <p className="text-blue-300 text-sm mb-2 font-medium">
                    📧 Next Steps:
                  </p>
                  <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Open your email inbox</li>
                    <li>Find the verification email (check spam folder)</li>
                    <li>Click the verification link</li>
                    <li>Return here to log in</li>
                  </ol>
                </div>
                
                <p className="text-gray-400 text-xs mb-6">
                  Didn't receive the email? Check your spam folder or try registering again.
                </p>
                
                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-600/50"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className={showSuccessModal ? "blur-sm pointer-events-none" : ""}>
          <div className="bg-gray-800 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl">
            {/* Back to Login Arrow */}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-4 group"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Login</span>
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-white">
              Create Account
            </h1>
            <p className="text-gray-400 text-center mb-6 text-sm">
              Sign up to get started
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full bg-gray-700 border ${
                  email.length > 0 && !emailValidation.isValid 
                    ? "border-red-500 focus:ring-red-500" 
                    : "border-gray-600 focus:ring-green-500"
                } text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={isSubmitting}
                required
              />
              {email.length > 0 && (
                <div className="mt-2">
                  {emailValidation.isValid ? (
                    <div className="flex items-center gap-1 text-green-500 text-xs">
                      <Check className="w-3 h-3" />
                      <span>{emailValidation.message}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <X className="w-3 h-3" />
                      <span>{emailValidation.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full bg-gray-700 border border-gray-600 text-white p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label="Toggle password visibility"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="w-full bg-gray-700 border border-gray-600 text-white p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label="Toggle confirm password visibility"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
              onClick={handleRegister}
              disabled={!isFormValid}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                isFormValid
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/50"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Already have an account */}
            <div className="text-center mt-6">
              <span className="text-gray-400 text-sm">Already have an account? </span>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-green-500 hover:text-green-400 font-medium text-sm transition-colors"
                disabled={isSubmitting}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}