import { useTheme } from '@/contexts/ThemeContext';

const GlobalBackground = () => {
  const { theme } = useTheme();

  // Solid background - handled by body gradient in CSS
  if (theme.background_type === 'solid' || !theme.background_value) {
    return null;
  }

  // Image background
  if (theme.background_type === 'image') {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${theme.background_value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
        aria-hidden="true"
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>
    );
  }

  // Video background
  if (theme.background_type === 'video') {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-full min-h-full w-auto h-auto object-cover"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <source src={theme.background_value} type="video/mp4" />
        </video>
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>
    );
  }

  return null;
};

export default GlobalBackground;
