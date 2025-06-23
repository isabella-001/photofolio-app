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
import { Users } from "lucide-react";

// In a real application, this would be a database call.
// Storing users like this is for demonstration purposes only.
const USERS = [
  { name: "isabella", password: "password123" },
  { name: "studio", password: "firebase" },
];

export function LoginForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USERS.find(
      (u) => u.name.toLowerCase() === name.toLowerCase() && u.password === password
    );

    if (user) {
      setError("");
      try {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("currentUser", JSON.stringify({ name: user.name }));
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
      setError("Invalid name or password. Please try again.");
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
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={!name || !password}
            >
              Login
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
