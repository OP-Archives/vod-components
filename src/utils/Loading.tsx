export default function Loading({ logo }: { logo?: string }) {
  const loadingLogo = logo || null;

  return (
    <div className="flex items-center justify-center h-screen w-full flex-col">
      <div className="flex flex-col justify-center items-center">
        {loadingLogo && <img alt="" src={loadingLogo} className="h-auto max-w-full max-h-[150px]" />}
        <div className="spinner" style={{ marginTop: loadingLogo ? '2rem' : '0' }} />
      </div>
    </div>
  );
}
