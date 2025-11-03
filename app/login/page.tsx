"use client";

import React, { useState, useMemo } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Eye, EyeOff, Mail, Lock } from "lucide-react";

type ErrorType = "email" | "password" | "auth" | "verification" | null;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Email validation
  const emailValidation = useMemo(() => {
    if (email.length === 0) return { isValid: true, message: "" };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      return { isValid: false, message: "Invalid email format" };
    }
    if (email.includes(' ')) {
      return { isValid: false, message: "Email cannot contain spaces" };
    }
    
    return { isValid: true, message: "Valid email format" };
  }, [email]);

  // Password validation
  const passwordValidation = useMemo(() => {
    if (password.length === 0) return { isValid: true, message: "" };
    
    if (password.length < 6) {
      return { isValid: false, message: "Password must be at least 6 characters" };
    }
    if (password.includes(' ')) {
      return { isValid: false, message: "Password cannot contain spaces" };
    }
    
    return { isValid: true, message: "Password format valid" };
  }, [password]);

  const isFormValid = email.length > 0 && password.length > 0 && 
                      emailValidation.isValid && passwordValidation.isValid;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError({ 
        type: "auth", 
        message: "Please fix all errors before submitting" 
      });
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        setError({ 
          type: "verification", 
          message: "Please verify your email before logging in. Check your inbox." 
        });
        await signOut(auth);
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (error: any) {
      setIsLoading(false);
      
      // Handle Firebase auth errors with detailed messages
      switch (error.code) {
        case "auth/invalid-credential":
          setError({ 
            type: "auth", 
            message: "Incorrect email or password. Please double-check and try again." 
          });
          break;
        case "auth/wrong-password":
          setError({ 
            type: "password", 
            message: "Incorrect password. Password is case-sensitive." 
          });
          break;
        case "auth/user-not-found":
          setError({ 
            type: "email", 
            message: "No account found with this email address." 
          });
          break;
        case "auth/user-disabled":
          setError({ 
            type: "auth", 
            message: "This account has been disabled." 
          });
          break;
        case "auth/too-many-requests":
          setError({ 
            type: "auth", 
            message: "Too many failed attempts. Please try again later." 
          });
          break;
        case "auth/network-request-failed":
          setError({ 
            type: "auth", 
            message: "Network error. Please check your connection." 
          });
          break;
        case "auth/invalid-email":
          setError({ 
            type: "email", 
            message: "Invalid email format." 
          });
          break;
        default:
          setError({ 
            type: "auth", 
            message: error.message || "An error occurred. Please try again." 
          });
      }
    }
  };

  const ErrorMessage = ({ message, type }: { message: string; type: "error" | "warning" | "success" }) => (
    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
      type === "error" ? "bg-red-900/30 border border-red-800 text-red-400" :
      type === "warning" ? "bg-yellow-900/30 border border-yellow-800 text-yellow-400" :
      "bg-green-900/30 border border-green-800 text-green-400"
    }`}>
      {type === "success" ? (
        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="bg-gray-800 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-white">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-center mb-6 text-sm">
            Sign in to your account
          </p>

          {/* Global Error Message */}
          {error && (
            <div className="mb-4">
              <ErrorMessage 
                message={error.message} 
                type={error.type === "verification" ? "warning" : "error"} 
              />
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full bg-gray-700 border ${
                  email.length > 0 && !emailValidation.isValid 
                    ? "border-red-500 focus:ring-red-500" 
                    : "border-gray-600 focus:ring-blue-500"
                } text-white p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
              />
            </div>
            {email.length > 0 && (
              <div className="mt-2">
                {emailValidation.isValid ? (
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>{emailValidation.message}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
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
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`w-full bg-gray-700 border ${
                  password.length > 0 && !passwordValidation.isValid 
                    ? "border-red-500 focus:ring-red-500" 
                    : "border-gray-600 focus:ring-blue-500"
                } text-white p-3 pl-10 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                {passwordValidation.isValid ? (
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>{passwordValidation.message}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{passwordValidation.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isFormValid && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/50"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          {/* Links */}
          <div className="text-center mt-6 space-y-3">
            <button
              type="button"
              onClick={() => router.push("/forgot")}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors block w-full"
            >
              Forgot Password?
            </button>
            
            <div className="pt-3 border-t border-gray-700">
              <span className="text-gray-400 text-sm">Don't have an account? </span>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}