const NeuralBackground = () => {
  return (
    <div className="neural-bg" aria-hidden="true">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 animate-float"
          style={{
            background: 'radial-gradient(circle, hsl(245 85% 60% / 0.4) 0%, transparent 70%)',
            top: '10%',
            left: '20%',
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-15 animate-float"
          style={{
            background: 'radial-gradient(circle, hsl(185 100% 50% / 0.3) 0%, transparent 70%)',
            top: '50%',
            right: '15%',
            animationDelay: '-5s',
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-10 animate-float"
          style={{
            background: 'radial-gradient(circle, hsl(270 60% 50% / 0.3) 0%, transparent 70%)',
            bottom: '20%',
            left: '30%',
            animationDelay: '-10s',
          }}
        />
      </div>
    </div>
  );
};

export default NeuralBackground;
