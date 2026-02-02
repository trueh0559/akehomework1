import { Search, Download, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Response } from '@/pages/Admin';

interface ResponsesTableProps {
  responses: Response[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  scoreFilter: string;
  onScoreFilterChange: (value: string) => void;
  onViewDetail: (response: Response) => void;
  onExportCSV: () => void;
}

const ResponsesTable = ({
  responses,
  searchTerm,
  onSearchChange,
  scoreFilter,
  onScoreFilterChange,
  onViewDetail,
  onExportCSV,
}: ResponsesTableProps) => {
  const getTotalScore = (r: Response) =>
    r.q1_score + r.q2_score + r.q3_score + r.q4_score + r.q5_score;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-foreground">📋 รายการคำตอบทั้งหมด</CardTitle>
          <Button onClick={onExportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อหรือ Email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
          <Select value={scoreFilter} onValueChange={onScoreFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50 border-border/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="กรองตามคะแนน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="high">คะแนนสูง (≥4)</SelectItem>
              <SelectItem value="medium">คะแนนปานกลาง (2.5-4)</SelectItem>
              <SelectItem value="low">คะแนนต่ำ (&lt;2.5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-muted-foreground">วันที่</TableHead>
                <TableHead className="text-muted-foreground">ชื่อ</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground text-center">คะแนนรวม</TableHead>
                <TableHead className="text-muted-foreground text-center">ดูรายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((response) => (
                  <TableRow key={response.id} className="border-border/30">
                    <TableCell className="text-foreground">
                      {new Date(response.created_at).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">{response.name}</TableCell>
                    <TableCell className="text-muted-foreground">{response.email}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold">
                        {getTotalScore(response)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(response)}
                        className="gap-2 text-primary hover:text-primary/80"
                      >
                        <Eye className="w-4 h-4" />
                        ดู
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponsesTable;
