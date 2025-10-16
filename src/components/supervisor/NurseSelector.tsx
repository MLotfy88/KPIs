import { useState, useEffect } from 'react';
import { getActiveNurses } from '@/lib/api';
import { Nurse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface NurseSelectorProps {
  onNurseSelect: (nurse: Nurse) => void;
}

const NurseSelector = ({ onNurseSelect }: NurseSelectorProps) => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [filteredNurses, setFilteredNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setIsLoading(true);
        const data = await getActiveNurses();
        setNurses(data || []);
        setFilteredNurses(data || []);
      } catch (error) {
        console.error('Error fetching nurses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNurses();
  }, []);

  useEffect(() => {
    const results = nurses.filter(nurse =>
      nurse.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNurses(results);
  }, [searchTerm, nurses]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Input
        placeholder="ابحث عن اسم الممرض..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredNurses.map(nurse => (
          <Card
            key={nurse.id}
            className="cursor-pointer hover:border-primary transition-all"
            onClick={() => onNurseSelect(nurse)}
          >
            <CardContent className="flex flex-col items-center justify-center p-4">
              <Avatar className="w-20 h-20 mb-2">
                <AvatarImage src={nurse.photo_url || ''} alt={nurse.name} />
                <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="font-medium text-center">{nurse.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredNurses.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          لم يتم العثور على ممرضين.
        </p>
      )}
    </div>
  );
};

export default NurseSelector;
