"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { validateUser } from "@/lib/user-store";

export function LoginForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      const user = await validateUser(name, password);

      if (user) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("currentUser", JSON.stringify({ name: user.name }));
        router.push("/folio");
      } else {
        setError("Invalid name or password. Please try again.");
      }
    } catch (err) {
       console.error("Login failed:", err);
       const message = err instanceof Error ? err.message : "An unexpected error occurred.";
       setError(`Login failed: ${message}`);
       toast({
         title: "Login Failed",
         description: message,
         variant: "destructive",
       });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>PhotoFolio Access</CardTitle>
            <CardDescription>
              Please enter your name and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!name || !password || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
