const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-[#f0f2f5] p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-[#d1d7db] shadow-inner transition-opacity duration-1000 ${i % 2 === 0 ? "opacity-50" : ""
                }`}
            />
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-[#0b141a]">{title}</h2>
        <p className="text-slate-600 font-medium">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
