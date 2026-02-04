import NeuralBackground from '@/components/ui/NeuralBackground';
import DynamicSurveyForm from '@/components/surveys/DynamicSurveyForm';
import FloatingAdminButton from '@/components/FloatingAdminButton';

const Index = () => {
  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <NeuralBackground />
      
      {/* Content */}
      <div className="relative z-10 container py-8 sm:py-12 md:py-16 px-4 max-w-2xl">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl animate-slide-up">
          <DynamicSurveyForm />
        </div>
        
        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs sm:text-sm mt-8 opacity-60">
          © 2026 AI App Development Course
        </p>
      </div>

      {/* Floating Admin Button */}
      <FloatingAdminButton />
    </div>
  );
};

export default Index;
