import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MFASetup from "./MFASetup";

interface RegisterFormProps {
  onRegistrationComplete: () => void;
}

export const RegisterForm = ({ onRegistrationComplete }: RegisterFormProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [error, setError] = useState('');
  const { register, loading, resetAuthState } = useAuth({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    }
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      resetAuthState();
    };
  }, [resetAuthState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await register(username, email, password);
      if (success) {
        toast({
          title: "Success",
          description: "Account created successfully",
        });
        setRegistrationComplete(true);
        onRegistrationComplete();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMFASetupComplete = () => {
    toast({
      title: "Success",
      description: "MFA setup completed successfully",
    });
    navigate("/login");
  };

  if (showMFASetup) {
    return (
      <div>
        <MFASetup 
          email={email} 
          onComplete={handleMFASetupComplete}
        />
        <Button
          onClick={() => {
            setShowMFASetup(false);
            navigate("/login");
          }}
          className="mt-4 w-full"
          variant="outline"
        >
          Skip MFA Setup
        </Button>
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium">Account Created Successfully!</h3>
          <p className="text-sm text-gray-500">Would you like to enable two-factor authentication?</p>
        </div>
        <Button
          onClick={() => setShowMFASetup(true)}
          className="w-full"
          variant="default"
        >
          Enable MFA
        </Button>
        <Button
          onClick={() => navigate("/login")}
          className="w-full"
          variant="outline"
        >
          Skip for Now
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Username"
            className="pl-10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Email"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
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
            disabled={loading}
            minLength={10}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}