
import React from "react";
import { useElection } from "@/contexts/ElectionContext";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import RefreshButton from "@/components/ui/refresh-button";
import { Loader2 } from "lucide-react";

interface StudentPaginationProps {
  className?: string;
}

const StudentPagination = ({ className }: StudentPaginationProps) => {
  const { 
    loadMoreStudents, 
    hasMoreStudents, 
    refreshStudents,
    loading
  } = useElection();

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem className="flex gap-2">
          <RefreshButton 
            onClick={refreshStudents} 
            loading={loading}
            size="sm"
          />
          
          {hasMoreStudents && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadMoreStudents}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default StudentPagination;
