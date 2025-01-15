import { useState, useEffect } from "react";
import { useFiles } from "@/hooks/useFiles";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface FileSearchProps {
  onSearch: (files: any[]) => void;
}

export const FileSearch = ({ onSearch }: FileSearchProps) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { searchFiles } = useFiles();

  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.trim()) {
        const results = await searchFiles(debouncedQuery);
        onSearch(results);
      } else {
        onSearch([]);
      }
    };
    search();
  }, [debouncedQuery, searchFiles, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}; 