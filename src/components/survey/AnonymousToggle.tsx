import { UserX, User } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AnonymousToggleProps {
  isAnonymous: boolean;
  onToggle: (value: boolean) => void;
}

const AnonymousToggle = ({ isAnonymous, onToggle }: AnonymousToggleProps) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/30">
      <div className="flex items-center gap-3">
        {isAnonymous ? (
          <UserX className="w-5 h-5 text-accent" />
        ) : (
          <User className="w-5 h-5 text-primary" />
        )}
        <div className="space-y-0.5">
          <Label htmlFor="anonymous-mode" className="text-sm font-medium cursor-pointer">
            โหมดไม่ระบุตัวตน
          </Label>
          <p className="text-xs text-muted-foreground">
            {isAnonymous 
              ? 'ไม่ต้องกรอกชื่อและอีเมล' 
              : 'กรอกข้อมูลเพื่อรับการติดต่อกลับ'}
          </p>
        </div>
      </div>
      <Switch
        id="anonymous-mode"
        checked={isAnonymous}
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default AnonymousToggle;
