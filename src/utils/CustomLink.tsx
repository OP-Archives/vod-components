import { Link } from 'react-router-dom';

export default function CustomLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link to={href} className="transition-opacity hover:opacity-50 inline-block no-underline">
      {children}
    </Link>
  );
}
