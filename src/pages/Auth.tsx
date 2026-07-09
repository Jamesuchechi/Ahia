import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import authBanner from "@/assets/auth_banner.png";

const Auth: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target
  const from = new URLSearchParams(location.search).get("redirect") || "/";

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  // If user is already authenticated, redirect
  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Welcome back!");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !firstName || !lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSigningUp(true);
    try {
      // 1. Sign up in Supabase Auth
      const { data: { user: newUser }, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        toast.error(error.message || "Failed to sign up");
        setIsSigningUp(false);
        return;
      }

      if (newUser) {
        // 2. Ensure profile details (including phone) are updated/upserted properly
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: newUser.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: "customer", // standard role
          });

        if (profileError) {
          console.warn("Profile sync error:", profileError.message);
        }

        toast.success("Account created successfully!");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Back button overlay */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors bg-white/80 dark:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm"
      >
        <ArrowLeft size={16} />
        <span>Return to Store</span>
      </Link>

      {/* Left Column: Form */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo or Brand */}
          <div className="mb-8 text-center lg:text-left">
            <Link to="/">
              <img src="/ahia-1.svg" alt="Ahia Logo" className="h-6 w-auto mx-auto lg:mx-0 mb-2" />
            </Link>
            <p className="text-muted-foreground text-sm font-light">
              Elevated essentials for modern luxury living.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted rounded-md p-1">
              <TabsTrigger value="login" className="text-sm font-light py-2 rounded-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm font-light py-2 rounded-sm">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-light tracking-tight">Welcome Back</CardTitle>
                  <CardDescription className="font-light">
                    Sign in to your account to manage orders, track deliveries, and view saved items.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="login-email">Email Address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={isLoggingIn}
                        className="font-light bg-background/50 border-input"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-password">Password</Label>
                        <a href="#" className="text-xs font-light text-muted-foreground hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoggingIn}
                        className="font-light bg-background/50 border-input"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full font-light py-6 mt-6" disabled={isLoggingIn}>
                      {isLoggingIn ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-light tracking-tight">Create an Account</CardTitle>
                  <CardDescription className="font-light">
                    Sign up for an account to enjoy faster checkouts, order tracking, and exclusive updates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="first-name">First Name *</Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isSigningUp}
                          className="font-light bg-background/50 border-input"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="last-name">Last Name *</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isSigningUp}
                          className="font-light bg-background/50 border-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-email">Email Address *</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        disabled={isSigningUp}
                        className="font-light bg-background/50 border-input"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isSigningUp}
                        className="font-light bg-background/50 border-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-password">Password *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isSigningUp}
                        className="font-light bg-background/50 border-input"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full font-light py-6 mt-6" disabled={isSigningUp}>
                      {isSigningUp ? "Creating account..." : "Register"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column: Dynamic Editorial Cover */}
      <div className="hidden lg:block relative overflow-hidden bg-muted">
        <img
          src={authBanner}
          alt="Modern Luxury Editorial"
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        
        {/* Fine-art styling tag */}
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="text-xs uppercase tracking-[0.2em] font-light mb-2 text-white/80">Ahia Curated Lifestyle</p>
          <h2 className="text-3xl font-light tracking-tight leading-tight max-w-md">
            "Designed for those who find elegance in simplicity."
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Auth;
