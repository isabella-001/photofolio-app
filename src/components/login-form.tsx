"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Lock } from "lucide-react";

const CORRECT_PASSWORD = "57518";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setError("");
      try {
        localStorage.setItem("isAuthenticated", "true");
        router.push("/folio");
      } catch (e) {
        console.error("Couldn't use localStorage", e);
        toast({
          title: "Login failed",
          description:
            "Could not save authentication state. Please enable cookies/localStorage.",
          variant: "destructive",
        });
      }
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>PhotoFolio Access</CardTitle>
            <CardDescription>
              Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!password}>
              Login
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
