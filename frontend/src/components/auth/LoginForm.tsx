import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import { useAuth, User } from "@/hooks/useAuth";
import MFAVerification from "./MFAVerification";
import MFASetup from "./MFASetup";

interface LoginResponse {
  requires_mfa: boolean;
  access: string;
  refresh: string;
  user: User | null;
}

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showMFA, setShowMFA] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login(email, password);
      if (response.requires_mfa) {
        setShowMFA(true);
      } else {
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASuccess = () => {
    toast({
      title: "Success",
      description: "Logged in successfully",
    });
    navigate('/dashboard');
  };

  const handleMFACancel = () => {
    setShowMFA(false);
    setEmail("");
    setPassword("");
  };

  const handleMFAComplete = () => {
    setIsLoading(false);
    navigate('/login');
  };

  const handleRegisterClick = () => {
    setIsLoading(false);
    navigate('/register');
  };

  if (showMFA) {
    return <MFAVerification email={email} onSuccess={handleMFASuccess} onCancel={handleMFACancel} />;
  }

  if (showMFASetup) {
    return <MFASetup email={email} onComplete={handleMFAComplete} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Email"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="password"
            placeholder="Password"
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="default"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};