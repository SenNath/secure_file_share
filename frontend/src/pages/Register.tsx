import { Link } from "react-router-dom";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Shield } from "lucide-react";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto" />
          <h2 className="mt-6 text-3xl font-bold">Create Account</h2>
          <p className="mt-2 text-gray-600">Start sharing files securely</p>
        </div>
        <RegisterForm />
        <p className="text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;