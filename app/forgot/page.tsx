"use client";

import React, { useState, useMemo } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Mail, ArrowLeft } from "lucide-react";

type MessageType = "success" | "error" | null;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: MessageType; text: string } | null>(null);
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

  const isFormValid = email.length > 0 && emailValidation.isValid;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isFormValid) {
      setMessage({ 
        type: "error", 
        text: "Please enter a valid email address" 
      });
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        type: "success", 
        text: "Password reset email sent! Please check your inbox and spam folder." 
      });
      setIsLoading(false);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      setIsLoading(false);
      
      // Handle Firebase errors
      switch (error.code) {
        case "auth/user-not-found":
          setMessage({ 
            type: "error", 
            text: "No account found with this email address." 
          });
          break;
        case "auth/invalid-email":
          setMessage({ 
            type: "error", 
            text: "Invalid email format. Please check and try again." 
          });
          break;
        case "auth/too-many-requests":
          setMessage({ 
            type: "error", 
            text: "Too many requests. Please try again later." 
          });
          break;
        case "auth/network-request-failed":
          setMessage({ 
            type: "error", 
            text: "Network error. Please check your connection." 
          });
          break;
        default:
          setMessage({ 
            type: "error", 
            text: error.message || "An error occurred. Please try again." 
          });
      }
    }
  };

  const Message = ({ text, type }: { text: string; type: MessageType }) => {
    if (!type) return null;
    
    return (
      <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
        type === "success" 
          ? "bg-green-900/30 border border-green-800 text-green-400"
          : "bg-red-900/30 border border-red-800 text-red-400"
      }`}>
        {type === "success" ? (
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        )}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleReset}
          className="bg-gray-800 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-full mb-3">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Reset Password
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div className="mb-4">
              <Message text={message.text} type={message.type} />
            </div>
          )}

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Email Address
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
                  setMessage(null);
                }}
                required
                disabled={isLoading || message?.type === "success"}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading || message?.type === "success"}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isFormValid && !isLoading && message?.type !== "success"
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/50"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Sending..." : message?.type === "success" ? "Email Sent!" : "Send Reset Link"}
          </button>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>

          {/* Info Text */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              If you don't receive an email within a few minutes, please check your spam folder.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}