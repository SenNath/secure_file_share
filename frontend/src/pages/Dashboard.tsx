import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { FileList } from "@/components/files/FileList";
import { FileUpload } from "@/components/files/FileUpload";
import { FileShared } from "@/components/files/FileShared";
import { FileTrash } from "@/components/files/FileTrash";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<FileList />} />
        <Route path="/upload" element={<FileUpload />} />
        <Route path="/shared" element={<FileShared />} />
        <Route path="/trash" element={<FileTrash />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;