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
import { Loader2, UserPlus } from "lucide-react";
import { addUser } from "@/lib/user-store";

export function SignupForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await addUser({ name, password });

      if (result.success) {
        toast({
          title: "Signup Successful",
          description: "You can now log in with your new account.",
        });
        router.push("/login");
      } else {
        setError(result.message);
      }
    } catch (err) {
       console.error("Signup failed:", err);
       const message = err instanceof Error ? err.message : "An unexpected error occurred.";
       setError(`Signup failed: ${message}`);
       toast({
         title: "Signup Failed",
         description: "Could not connect to the database. Please check your connection and try again.",
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
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Choose a name and password to get started.
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
                  autoComplete="new-password"
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
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </Button>
             <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
