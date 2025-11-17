export const FloatingShapes = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Green Circle */}
      <div 
        className="absolute animate-float-slow"
        style={{
          left: '10%',
          top: '20%',
          animationDelay: '0s',
        }}
      >
        <div className="w-24 h-24 rounded-full bg-[#9dbfa7] opacity-30 blur-xl" />
      </div>

      {/* Red Circle */}
      <div 
        className="absolute animate-float-medium"
        style={{
          right: '15%',
          top: '30%',
          animationDelay: '1s',
        }}
      >
        <div className="w-32 h-32 rounded-full bg-[#d16253] opacity-25 blur-xl" />
      </div>

      {/* White Circle */}
      <div 
        className="absolute animate-float-slow"
        style={{
          left: '70%',
          bottom: '25%',
          animationDelay: '2s',
        }}
      >
        <div className="w-28 h-28 rounded-full bg-white opacity-20 blur-xl" />
      </div>

      {/* Green Circle 2 */}
      <div 
        className="absolute animate-float-medium"
        style={{
          left: '25%',
          bottom: '15%',
          animationDelay: '1.5s',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-[#9dbfa7] opacity-25 blur-xl" />
      </div>

      {/* Red Circle 2 */}
      <div 
        className="absolute animate-float-slow"
        style={{
          right: '30%',
          bottom: '40%',
          animationDelay: '0.5s',
        }}
      >
        <div className="w-36 h-36 rounded-full bg-[#d16253] opacity-20 blur-xl" />
      </div>

      {/* Small accent shapes */}
      <div 
        className="absolute animate-float-medium"
        style={{
          left: '5%',
          bottom: '30%',
          animationDelay: '2.5s',
        }}
      >
        <div className="w-16 h-16 rounded-full bg-white opacity-15 blur-lg" />
      </div>

      <div 
        className="absolute animate-float-slow"
        style={{
          right: '10%',
          top: '60%',
          animationDelay: '1.2s',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-[#9dbfa7] opacity-20 blur-lg" />
      </div>
    </div>
  );
};
